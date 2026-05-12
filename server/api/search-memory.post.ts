import { qdrant } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const embedding = await createEmbedding(body.text)

  const result = await qdrant.search('memory', {
    vector: embedding,
    limit: 3,
  })

  return result
})
