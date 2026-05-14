<template>
  <div class="flex">
    <AdminSidebar />
    <div class="flex-1 p-8">
      <h1 class="text-2xl font-bold mb-4">Upload PDF ke Qdrant</h1>
      <form @submit.prevent="handleUpload" class="space-y-4">
        <input type="file" accept="application/pdf" @change="onFileChange" class="block" />
        <button type="submit" :disabled="loading || !file" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {{ loading ? 'Uploading...' : 'Upload PDF' }}
        </button>
      </form>
      <div v-if="extractedText" class="mt-6">
        <h2 class="text-lg font-semibold mb-2">Preview Teks PDF</h2>
        <textarea readonly class="w-full h-64 border rounded p-2 mb-4" :value="extractedText"></textarea>
        <button @click="pushToQdrant" :disabled="pushing" class="px-4 py-2 bg-green-600 text-white rounded">
          {{ pushing ? 'Memproses...' : 'Push ke Qdrant' }}
        </button>
      </div>
      <div v-if="message" class="mt-4 text-green-600">{{ message }}</div>
      <div v-if="error" class="mt-4 text-red-600">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'

const file = ref<File|null>(null)
const loading = ref(false)
const pushing = ref(false)
const message = ref('')
const error = ref('')
const extractedText = ref('')
const filename = ref('')

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
    extractedText.value = ''
    filename.value = ''
    message.value = ''
    error.value = ''
  }
}

async function handleUpload() {
  if (!file.value) return
  loading.value = true
  message.value = ''
  error.value = ''
  extractedText.value = ''
  filename.value = ''
  const formData = new FormData()
  formData.append('pdf', file.value)
  try {
    const res = await fetch('/api/admin/upload-pdf', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (res.ok && data.text) {
      extractedText.value = data.text
      filename.value = data.filename || (file.value && file.value.name) || 'uploaded.pdf'
      message.value = 'Teks berhasil diekstrak. Silakan cek dan push ke Qdrant.'
      file.value = null
    } else {
      error.value = data.error || 'Gagal ekstrak PDF.'
    }
  } catch (e: any) {
    error.value = e.message || 'Gagal upload.'
  } finally {
    loading.value = false
  }
}

async function pushToQdrant() {
  if (!extractedText.value || !filename.value) return
  pushing.value = true
  message.value = ''
  error.value = ''
  try {
    const res = await fetch('/api/admin/push-qdrant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: extractedText.value, filename: filename.value }),
    })
    const data = await res.json()
    if (res.ok) {
      message.value = data.message || 'Berhasil push ke Qdrant!'
      extractedText.value = ''
      filename.value = ''
    } else {
      error.value = data.error || 'Gagal push ke Qdrant.'
    }
  } catch (e: any) {
    error.value = e.message || 'Gagal push ke Qdrant.'
  } finally {
    pushing.value = false
  }
}
</script>
