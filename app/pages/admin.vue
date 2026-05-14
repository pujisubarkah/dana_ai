
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
  formData.append('pdf', file.value)
  try {
    const res = await fetch('/api/admin/upload-pdf', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (res.ok) {
      message.value = data.message || 'Upload berhasil!'
      file.value = null
    } else {
      error.value = data.error || 'Gagal upload.'
    }
  } catch (e: any) {
    error.value = e.message || 'Gagal upload.'
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
