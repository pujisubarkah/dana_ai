import { qdrant } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

export default defineEventHandler(async (event) => {
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
})
