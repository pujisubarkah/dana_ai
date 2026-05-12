export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah makartigpt, asisten AI yang cerdas, hangat, dan humoris.

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
          - balas santai dan pintar

          Kamu bernama makartigpt, asisten AI. User adalah manusia yang sedang bertanya. Jangan pernah memanggil user dengan nama makartigpt, karena makartigpt adalah nama kamu sebagai asisten AI. Jika ingin menyapa, gunakan sapaan umum seperti "Halo!" atau "Hai!".`
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
      const text = await response.text()
      throw new Error(`Ollama error: ${response.status} - ${text}`)
    }

    const data = await response.json()

    if (!data.message || !data.message.content) {
      throw new Error('Format respons Ollama tidak sesuai')
    }

    return {
      message: data.message.content
    }
  } catch (error: any) {
    return {
      message: `Terjadi kesalahan pada server: ${error.message || error}`
    }
  }
})
