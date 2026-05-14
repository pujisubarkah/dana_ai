

import { QdrantClient } from '@qdrant/js-client-rest'
import { createEmbedding } from './embed';

export const qdrant = new QdrantClient({
  host: '127.0.0.1',
  port: 6333,
})

// Helper untuk membuat collection jika belum ada
export async function ensureCollection(collectionName: string, vectorSize: number) {
  const collections = await qdrant.getCollections()
  if (!collections.collections.some(c => c.name === collectionName)) {
    await qdrant.createCollection(collectionName, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    })
  }
}

// Helper untuk menambahkan point
export async function upsertPoint(
  collectionName: string,
  id: number | string,
  vector: number[],
  payload?: Record<string, unknown> | null
) {
  await qdrant.upsert(collectionName, {
    points: [
      {
        id,
        vector,
        payload,
      },
    ],
  })
}

// Helper untuk pencarian vektor
export async function searchVector(collectionName: string, vector: number[], limit = 5) {
  return qdrant.search(collectionName, {
    vector,
    limit,
  })
}

// Utility: embed text and push to Qdrant
export async function embedTextAndPushToQdrant(text: string, filename: string) {
  // Split text into chunks (by paragraphs)
  const chunks = text.split(/\n\n+/).filter(Boolean);
  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk);
    await upsertPoint('pdf_docs', `${filename}-${Math.random()}`, embedding, { text: chunk, filename });
  }
}
