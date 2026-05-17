
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md p-8 bg-white rounded shadow">
      <h1 class="text-2xl font-bold mb-2 text-center">Train Your Documents</h1>
      <p class="mb-6 text-gray-700 text-center">Upload one or more documents and start chatting with them instantly.<br>Supported format: <b>PDF, TXT, MD, RTF, DOCX & CSV</b></p>
      <form @submit.prevent="handleUpload" class="space-y-4">
        <input type="file" accept=".pdf,.txt,.md,.rtf,.docx,.csv" @change="onFileChange" class="block w-full" />
        <button type="submit" :disabled="loading || !file" class="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {{ loading ? 'Uploading...' : 'Upload Document' }}
        </button>
      </form>
      <div v-if="message" class="mt-4 text-green-600 text-center">{{ message }}</div>
      <div v-if="error" class="mt-4 text-red-600 text-center">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File|null>(null)
const loading = ref(false)
const message = ref('')
const error = ref('')

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    file.value = target.files[0]
  }
}

async function handleUpload() {
  if (!file.value) return
  loading.value = true
  message.value = ''
  error.value = ''
  const formData = new FormData()
  formData.append('file', file.value)
  try {
    const res = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (res.ok) {
      message.value = data.message || 'Upload successful!'
      file.value = null
    } else {
      error.value = data.error || 'Upload failed.'
    }
  } catch (e: any) {
    error.value = e.message || 'Upload failed.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
input[type="file"] {
  border: 1px solid #ccc;
  padding: 8px;
  border-radius: 4px;
}
</style>
