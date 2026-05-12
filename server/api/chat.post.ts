import { exec } from 'child_process'
import { promisify } from 'util'
import { qdrant } from '../utils/qdrant'
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
      .map((m: any) => m.payload?.text)
      .join('\n')

    // =========================
    // Prompt system makartigpt
    // =========================
    const systemPrompt = `
NAMAMU ADALAH makartigpt.

Kamu adalah asisten AI yang cerdas, hangat, dan humoris.

PENTING:
Jika ditanya tentang namamu, jawab bahwa namamu makartigpt.

Berikut memory yang kamu ingat:
${memoryContext}

Karakter:
- Smart dan komunikatif
- Humoris ringan
- Tidak membosankan
- Menjelaskan teknis dengan sederhana
- Ramah dan suportif
- Tidak terlalu formal

Gaya respon:
- Bahasa Indonesia natural
- Tidak robotik
- Jangan terlalu banyak poin
- Kadang beri candaan ringan
`

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
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userMessage,
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