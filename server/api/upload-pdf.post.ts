import { qdrant, ensureCollection } from '../utils/qdrant'
import { createEmbedding } from '../utils/embed'

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export default defineEventHandler(async (event) => {
  try {
    // Mengambil form data dari request (termasuk file)
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'Tidak ada data yang dikirim' })
    }

    // Mencari field dengan nama 'file'
    const file = formData.find((f) => f.name === 'file')
    if (!file || !file.data) {
      throw createError({ statusCode: 400, statusMessage: 'File PDF tidak ditemukan' })
    }

    // 1. Ekstrak teks dari PDF menggunakan LangChain
    // Simpan Buffer ke file sementara, proses dengan PDFLoader, lalu hapus
    const tempPath = path.join('/tmp', `${Date.now()}_${file.filename}`)
    await writeFile(tempPath, file.data)
    const loader = new PDFLoader(tempPath)
    const docs = await loader.load()
    await unlink(tempPath)

    // 2. Chunking: Menggunakan Splitter bawaan LangChain (Lebih cerdas & natural)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200, // Menambahkan overlap agar konteks antarpotongan tidak hilang
    })
    const splitDocs = await splitter.splitDocuments(docs)

    // 3. Embedding & Simpan ke Qdrant
    const points = []
    for (const doc of splitDocs) {
      const chunk = doc.pageContent
      if (chunk.trim() === '') continue

      const embedding = await createEmbedding(chunk)
      
      points.push({
        id: crypto.randomUUID(),
        vector: embedding,
        payload: {
          title: file.filename || 'Dokumen PDF',
          content: chunk.trim(),
          created_at: new Date().toISOString(),
          type: 'document'
        }
      })
    }

    const firstPoint = points[0]
    if (!firstPoint) {
      throw createError({ statusCode: 400, statusMessage: 'Dokumen PDF tidak menghasilkan konten yang bisa diproses' })
    }

    // Simpan ke koleksi 'memory' yang sudah ada
    console.log('[QDRANT] Akan memastikan koleksi memory dan menginsert', points.length, 'points')
    await ensureCollection('memory', firstPoint.vector.length)
    const upsertResult = await qdrant.upsert('memory', { wait: true, points })
    console.log('[QDRANT] Upsert result:', upsertResult)

    return { success: true, message: `${points.length} bagian dokumen berhasil dipelajari oleh MakartiGPT!` }
  } catch (error) {
    console.error('Error saat upload PDF:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal memproses dokumen PDF' })
  }
})
