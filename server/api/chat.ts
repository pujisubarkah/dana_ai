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
