export async function createEmbedding(text: string) {
  const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nomic-embed-text',
      prompt: text,
    }),
  })

  const data = await response.json()

  return data.embedding
}
