import { qdrant } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const embedding = await createEmbedding(body.text)

    await qdrant.upsert('memory', {
      wait: true,
      points: [
        {
          id: crypto.randomUUID(),
          vector: embedding,
          payload: {
            text: body.text,
            created_at: new Date().toISOString(),
          },
        },
      ],
    })

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error menyimpan memori ke Qdrant:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal terhubung ke Qdrant' })
  }
})
