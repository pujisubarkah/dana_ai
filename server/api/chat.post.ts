import { exec } from 'child_process'
import { promisify } from 'util'
import { qdrant, ensureCollection } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const userMessage = body.message

    // =========================
    // Generate embedding
    // =========================
    const embedding = await createEmbedding(userMessage)

    // Pastikan koleksi 'memory' sudah ada
    await ensureCollection('memory', embedding.length)

    // =========================
    // Search memory di Qdrant
    // =========================
    let memories: any[] = []
    try {
      memories = await qdrant.search('memory', {
        vector: embedding,
        limit: 5,
      })
    } catch (error) {
      console.error('Warning: Gagal terhubung ke Qdrant Search, melanjutkan tanpa memori.', error)
      // Tidak ada throw error di sini, memori dibiarkan kosong (array kosong)
    }

    const memoryContext = memories
      .map((m: any) => {
        // Jika data dari Qdrant memiliki title dan content (buatan manual)
        if (m.payload?.title && m.payload?.content) {
          return `[${m.payload.title}]: ${m.payload.content}`
        }
        // Fallback ke text (memori otomatis) atau sekadar content
        return m.payload?.text || m.payload?.content || ''
      })
      .filter((text: string) => text.trim() !== '')
      .join('\n')

    // DEBUG: Log context yang dikirim ke AI
    console.log('==== QDRANT CONTEXT YANG DIKIRIM KE AI ====')
    console.log(memoryContext)
    console.log('Scores:', memories.map((m: any) => m.score))
    console.log('===========================================')

    // =========================
    // Prompt system makartigpt
    // =========================
    const systemContent = `Kamu adalah MakartiGPT, asisten AI yang cerdas, hangat, komunikatif, dan santai. Gunakan bahasa Indonesia yang natural.`

    const userContent = `Gunakan informasi Referensi di bawah ini sebagai panduan utama untuk menjawab pertanyaan. Jika informasinya tidak ada, jawab berdasarkan pengetahuanmu secara singkat.

Referensi:
${memoryContext || '(Tidak ada informasi tambahan)'}

Pertanyaan: ${userMessage}`

    // =========================
    // Chat ke Ollama
    // =========================
    let response
    try {
      response = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:0.5b',
          stream: false,
          messages: [
            {
              role: 'system',
              content: systemContent,
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
        }),
      })
    } catch (error) {
      console.error('Error dari Ollama:', error)
      throw createError({ statusCode: 500, statusMessage: 'Gagal menghubungi AI lokal (Ollama)' })
    }

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}`)
    }

    const data = await response.json()

    const text = data.message.content

    // =========================
    // Simpan memory baru
    // =========================
    try {
      // Pastikan koleksi 'memory' sudah ada sebelum upsert
      await ensureCollection('memory', embedding.length)
      await qdrant.upsert('memory', {
        wait: true,
        points: [
          {
            id: crypto.randomUUID(),
            vector: embedding,
            payload: {
              text: userMessage,
              created_at: new Date().toISOString(),
            },
          },
        ],
      })
    } catch (error) {
      console.error('Error menyimpan memori ke Qdrant:', error)
    }

    // =========================
    // Generate audio Piper
    // =========================
    try {
      const escapedText = text.replace(/"/g, '\\"')

      await execAsync(
        `echo "${escapedText}" | ~/projects/piper/piper --model ~/projects/piper/voices/id_ID-news_tts-medium.onnx --config ~/projects/piper/voices/id_ID-news_tts-medium.onnx.json --output_file public/makartigpt.wav`
      )
    } catch (e) {
      console.error('Error generate audio Piper:', e)
    }

    return {
      text,
      audio: '/makartigpt.wav',
      memories,
    }
  } catch (error: any) {
    // Teruskan error yang sudah dibuat spesifik (H3Error) dari dalam try-catch di atas
    if (error.statusCode) {
      throw error
    }

    console.error('Terjadi kesalahan pada endpoint chat:', error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Terjadi kesalahan pada server (Ollama / Qdrant / Piper)',
    })
  }
})