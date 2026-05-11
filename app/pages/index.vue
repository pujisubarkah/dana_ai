<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')
const chatResponse = ref('')
const isLoading = ref(false)

const sendMessage = async () => {
  if (!message.value.trim() || isLoading.value) return

  isLoading.value = true
  chatResponse.value = ''

  try {
    const res = await $fetch<{ message: string }>('/api/chat', {
      method: 'POST',
      body: { message: message.value }
    })

    chatResponse.value = res.message
  } catch (error) {
    console.error(error)
    chatResponse.value = 'Maaf, terjadi kesalahan saat menghubungi Dana AI.'
  } finally {
    isLoading.value = false
    message.value = ''
  }
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center">
    <div class="relative flex items-center justify-center">
      <div class="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="orb"></div>
    </div>

    <h1 class="text-4xl font-bold mt-10">
      Dana AI
    </h1>

    <p class="text-zinc-400 mt-2">
      Your personal AI assistant
    </p>

    <div class="mt-10 w-full max-w-xl px-4">
      <input
        v-model="message"
        @keyup.enter="sendMessage"
        :disabled="isLoading"
        type="text"
        placeholder="Talk to Dana..."
        class="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
      >

      <div v-if="isLoading || chatResponse" class="mt-8 p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
        <div v-if="isLoading" class="flex gap-2 items-center text-zinc-400">
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
        </div>
        <p v-else class="text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {{ chatResponse }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orb {
  width: 180px;
  height: 180px;
  border-radius: 9999px;
  background: radial-gradient(circle, #60a5fa, #2563eb, #1e1b4b);
  box-shadow:
    0 0 60px rgba(59,130,246,0.7),
    0 0 120px rgba(37,99,235,0.4);
  animation: pulse 4s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
</style>
