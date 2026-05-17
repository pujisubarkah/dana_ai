import { qdrant } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const embedding = await createEmbedding(body.text)

    const result = await qdrant.search('memory', {
      vector: embedding,
      limit: 3,
    })

    return result
  } catch (error: any) {
    console.error('Error mencari memori di Qdrant:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal terhubung ke Qdrant' })
  }
})
