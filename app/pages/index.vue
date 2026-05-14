<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import SpeechToText from '~/components/SpeechToText.vue'

const message = ref<string>('')
const chatResponse = ref<string>('')
const isLoading = ref<boolean>(false)
const isSpeaking = ref<boolean>(false)
const showSTT = ref<boolean>(false)

// Used by the TresMesh material in the template.
// If you later want dynamic color, make it a computed.
const sphereColor = computed(() => '#60a5fa')

// Keep handlers in the same script so the template can bind to them.
const defaultGreeting = 'Halo, ada yang bisa saya bantu?'
const sendMessage = async (): Promise<void> => {
  if (!message.value.trim() || isLoading.value) return

  isLoading.value = true
  chatResponse.value = ''

  try {
    const res = await $fetch<{ text: string; audio?: string }>('/api/chat', {
      method: 'POST',
      body: { message: message.value }
    })

    chatResponse.value = res.text

    if (res.audio) {
      const audio = new Audio(res.audio + '?t=' + new Date().getTime())
      isSpeaking.value = true

      audio.onended = () => {
        isSpeaking.value = false
      }

      audio.play().catch((e) => {
        console.error('Error memutar audio:', e)
        isSpeaking.value = false
      })
    }
  } catch (error) {
    console.error(error)
    chatResponse.value = 'Maaf, terjadi kesalahan saat menghubungi MakartiGPT. Saya adalah asisten AI untuk pertanyaan seputar Lembaga Administrasi Negara. Silakan ajukan pertanyaan Anda!'
  } finally {
    isLoading.value = false
    message.value = ''
  }
}

const onSTTResult = async (result: string): Promise<void> => {
  message.value = result
  showSTT.value = false
  await sendMessage()
}

// Nuxt/SSR safety: keep these on window for any child component integration that relies on it.
if (process.client) {
  ;(window as any).sendMessage = sendMessage
  ;(window as any).onSTTResult = onSTTResult
}

onMounted(() => {
  if (!message.value) {
    message.value = defaultGreeting
    sendMessage()
  }
})
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center">
    <!-- Hologram Container -->
    <div class="relative flex flex-col items-center justify-center mt-12 group">
      <!-- Hologram base glow -->
      <div
        :class="[
          'absolute w-72 h-72 rounded-full blur-[60px] transition-all duration-300',
          isSpeaking ? 'bg-blue-500/40 animate-pulse-fast scale-110' : 'bg-cyan-500/20 animate-pulse'
        ]"
      ></div>

      <!-- Hologram face element -->
      <div
        :class="[
          'relative w-64 h-64 overflow-hidden rounded-full border-2 shadow-[0_0_40px_rgba(0,0,0,0.7)] z-10 transition-all duration-700 backdrop-blur-sm group-hover:scale-105',
          isSpeaking
            ? 'border-zinc-200/90 shadow-[0_0_80px_rgba(59,130,246,0.7)] bg-black/80'
            : 'border-zinc-400/60 group-hover:shadow-[0_0_70px_rgba(6,182,212,0.6)] bg-black/70'
        ]"
      >
        <div
          :class="[
            'w-full h-full flex items-center justify-center transition-all duration-300',
            isSpeaking ? 'animate-hologram-speak' : ''
          ]"
        >
          <div class="w-56 h-56 rounded-full bg-black/60 flex items-center justify-center shadow-inner">
            <img
              src="/lanri.png"
              alt="MakartiGPT Face"
              class="object-contain w-48 h-48 rounded-full select-none pointer-events-none bg-black/80 border border-zinc-300"
              draggable="false"
            />
          </div>
        </div>

        <!-- Scanlines overlay -->
        <div class="absolute inset-0 pointer-events-none hologram-scanlines opacity-50 z-20"></div>

        <!-- Moving Scanner effect -->
        <div
          class="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent hologram-scanner z-20"
        ></div>
      </div>

      <!-- Base projection base/pedestal -->
      <div class="absolute -bottom-8 w-40 h-10 bg-cyan-500/30 rounded-[100%] blur-xl"></div>
      <div class="absolute -bottom-8 w-20 h-4 bg-cyan-400/60 rounded-[100%] blur-md"></div>

      <!-- Tres / sphere glow (kept minimal so it doesn't break when components are not present) -->
      <!--
        If your @tresjs/nuxt setup provides TresCanvas/TresMesh/TresSphereGeometry automatically,
        this block will render. Otherwise, comment it out.
      -->
      <div class="absolute inset-0 pointer-events-none z-0">
        <TresCanvas>
          <TresMesh :scale="[0.9, 0.9, 0.9]">
            <TresSphereGeometry :args="[2.5, 64, 64]" />
            <TresMeshBasicMaterial :color="sphereColor" :transparent="true" :opacity="0.15" />
          </TresMesh>
        </TresCanvas>
      </div>

      <!-- CSS glowing overlay for extra effect -->
      <div
        class="absolute w-80 h-80 rounded-full pointer-events-none"
        :class="isSpeaking ? 'animate-catchyGlow z-10' : 'animate-catchyIdle z-10'"
        style="background: radial-gradient(circle at 60% 40%, #93c5fd 60%, #3b82f6 80%, #1d4ed8 100%); opacity: 0.5; filter: blur(16px);"
      ></div>
      <div
        v-if="isSpeaking"
        class="absolute w-96 h-96 rounded-full pointer-events-none animate-catchyPulse"
        style="background: radial-gradient(circle, #3b82f6 0%, #93c5fd 60%, transparent 100%); opacity: 0.3; filter: blur(32px);"
      ></div>
    </div>

    <h1 class="text-4xl font-bold mt-10">MakartiGPT</h1>
    <p class="text-zinc-400 mt-2">Your personal AI assistant</p>

    <div class="mt-10 w-full max-w-xl px-4">
      <input
        v-model="message"
        @keyup.enter="sendMessage"
        :disabled="isLoading"
        type="text"
        placeholder="Talk to MakartiGPT..."
        class="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
      />

      <div class="mt-2 flex items-center justify-end">
        <button
          type="button"
          class="p-2 rounded-full hover:bg-blue-500/20 transition-colors"
          @click="showSTT = !showSTT"
          :aria-label="showSTT ? 'Tutup mikrofon' : 'Aktifkan mikrofon'"
        >
          <svg
            v-if="!showSTT"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-blue-400"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 18.75v1.5m0 0h3m-3 0H9m3-1.5a6 6 0 0 0 6-6V9m-6 9a6 6 0 0 1-6-6V9m6 6a3 3 0 0 1-3-3V6a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3z"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 text-red-400 animate-pulse"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 18.75v1.5m0 0h3m-3 0H9m3-1.5a6 6 0 0 0 6-6V9m-6 9a6 6 0 0 1-6-6V9m6 6a3 3 0 0 1-3-3V6a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3z"
            />
          </svg>
        </button>
      </div>

      <div v-if="showSTT" class="mt-2">
        <SpeechToText @result="onSTTResult" />
      </div>

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

.hologram-scanlines {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0) 50%,
    rgba(6, 182, 212, 0.2) 50%,
    rgba(6, 182, 212, 0.2)
  );
  background-size: 100% 4px;
}

.hologram-scanner {
  animation: scan 3s ease-in-out infinite;
}

@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  50% {
    transform: translateY(600%);
  }
  100% {
    transform: translateY(-100%);
  }
}

@keyframes hologram-speak {
  0% {
    filter: brightness(1) contrast(1);
  }
  25% {
    filter: brightness(1.2) contrast(1.1);
  }
  50% {
    filter: brightness(0.9) contrast(1);
  }
  75% {
    filter: brightness(1.3) contrast(1.2);
  }
  100% {
    filter: brightness(1) contrast(1);
  }
}

.animate-hologram-speak {
  animation: hologram-speak 0.4s ease-in-out infinite alternate;
}

.animate-pulse-fast {
  animation: pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Keep these class names to match your template; define simple brutalist-friendly fallbacks. */
@keyframes catchyGlow {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50% { opacity: 0.65; transform: scale(1.05); }
}
.animate-catchyGlow {
  animation: catchyGlow 1s ease-in-out infinite;
}

@keyframes catchyIdle {
  0%, 100% { opacity: 0.25; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(1.03); }
}
.animate-catchyIdle {
  animation: catchyIdle 1.2s ease-in-out infinite;
}

@keyframes catchyPulse {
  0%, 100% { opacity: 0.25; transform: scale(0.98); }
  50% { opacity: 0.5; transform: scale(1.05); }
}
.animate-catchyPulse {
  animation: catchyPulse 0.8s ease-in-out infinite;
}
</style>
