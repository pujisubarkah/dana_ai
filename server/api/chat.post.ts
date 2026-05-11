export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
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

    return {
      message: data.message.content
    }
  } catch (error) {
    // Ini akan memunculkan error asli di terminal tempat kamu menjalankan Nuxt
    console.error('Error saat menghubungi Ollama:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal menghubungi server AI' })
  }
})