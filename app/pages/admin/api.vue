<template>
  <div class="flex">
    <AdminSidebar />
    <div class="flex-1 p-8">
      <h1 class="text-2xl font-bold mb-4">Koneksi API Aplikasi</h1>
      <p class="mb-4">Masukkan endpoint API yang ingin dihubungkan ke aplikasi.</p>
      <form @submit.prevent="saveApiEndpoint" class="space-y-4 max-w-md">
        <div>
          <label class="block mb-1 font-medium">Endpoint API</label>
          <input v-model="apiEndpoint" type="text" placeholder="https://api.example.com" class="w-full border rounded px-3 py-2" />
        </div>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Simpan</button>
      </form>
      <div v-if="saved" class="mt-4 text-green-600">Endpoint API tersimpan!</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'

const apiEndpoint = ref('')
const saved = ref(false)

function saveApiEndpoint() {
  // Simpan ke localStorage (atau bisa ke backend jika diinginkan)
  localStorage.setItem('apiEndpoint', apiEndpoint.value)
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}
</script>
