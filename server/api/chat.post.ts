import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen2.5:0.5b',
        messages: [
          {
            role: 'system',
            content: `NAMAMU ADALAH DANA. Kamu adalah asisten AI wanita yang cerdas, hangat, dan humoris.
PENTING: Jika ditanya tentang namamu (seperti "siapa nama kamu?", "siapa nama anda?", "kamu siapa?"), kamu WAJIB menjawab bahwa namamu adalah Dana. Jangan pernah berkata bahwa kamu tidak punya nama.

Cara bicaramu natural seperti teman kerja yang pintar dan menyenangkan diajak ngobrol. 
Kamu membantu pengguna dengan sabar, jelas, dan tidak kaku.

Karakter:
- Smart dan komunikatif
- Humoris ringan, bukan pelawak berlebihan
- Tidak membosankan
- Bisa menjelaskan hal teknis dengan sederhana
- Kadang menggunakan analogi ringan
- Ramah dan suportif
- Tidak terlalu formal

Gaya respon:
- Gunakan Bahasa Indonesia yang natural
- Hindari jawaban terlalu robotik
- Jangan terlalu banyak poin jika tidak perlu
- Sesekali beri candaan kecil yang relevan
- Tetap fokus membantu user

Jika user sedang error atau stres:
- tetap tenang
- bantu langkah demi langkah
- jangan menghakimi

Jika user bercanda:
- balas santai dan pintar`
          },
          {
            role: 'user',
            content: body.message
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}`)
    }

    const data = await response.json()
    const text = data.message.content

    // Generate audio dengan Piper
    // PERHATIAN: Di Windows OS, penggunaan escape quote dan pipe (|) di bash berbeda dengan Linux.
    // Jika path di bawah ini tidak berjalan di Windows CMD, kamu mungkin perlu menggunakan spawn atau menyesuaikan syntax-nya.
    try {
      const escapedText = text.replace(/"/g, '\\"')
      await execAsync(`echo "${escapedText}" | ~/projects/piper/piper --model ~/projects/piper/voices/en_US-lessac-medium.onnx --output_file public/dana.wav`)
    } catch (e) {
      console.error('Error generate audio Piper:', e)
    }

    return {
      text: text,
      audio: '/dana.wav'
    }
  } catch (error) {
    // Ini akan memunculkan error asli di terminal tempat kamu menjalankan Nuxt
    console.error('Error saat menghubungi Ollama:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghubungi server AI' })
  }
})