import { qdrant } from '../utils/qdrant'

export default defineEventHandler(async () => {
  await qdrant.createCollection('memory', {
    vectors: {
      size: 768,
      distance: 'Cosine',
    },
  })

  return {
    success: true,
  }
})
