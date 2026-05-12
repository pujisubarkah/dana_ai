<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import SpeechToText from '~/components/SpeechToText.vue'
// All TresJS and Cientos components are auto-registered by Nuxt module, no direct import needed
// useRenderLoop is auto-imported by @tresjs/nuxt (Nuxt auto-import)
const renderLoop = (globalThis as any).useRenderLoop ? (globalThis as any).useRenderLoop() : { onLoop: () => {} }
const { onLoop } = renderLoop
const onLoopTyped = onLoop as unknown as (callback: (state: { elapsed: number }) => void) => void

const message = ref('')
const chatResponse = ref('')

const isLoading = ref(false)
const showSTT = ref(false)
const isSpeaking = ref(false)

// Sphere Glow color
const sphereColor = ref('#93c5fd')

// Audio & Web Audio API Analyzer for Reactive Light
let audioPlayer: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
const audioLightRef = shallowRef<any>(null)

onLoopTyped(({ elapsed }: { elapsed: number }) => {

  if (audioLightRef.value) {
    if (isSpeaking.value && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray as any)
      const avgVolume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      // Base intensity + Audio reactive spike
      audioLightRef.value.intensity = 0.5 + (avgVolume / 30)
    } else {
      // Idle breathing pulse
      audioLightRef.value.intensity = 0.5 + Math.sin(elapsed * 2) * 0.3
    }
  }
})

const sendMessage = async () => {
  if (!message.value.trim() || isLoading.value) return

  isLoading.value = true
  chatResponse.value = ''

  try {
    const res = await $fetch<{ text: string, audio?: string }>('/api/chat', {
      method: 'POST',
      body: { message: message.value }
    })

    chatResponse.value = res.text

    // Memutar audio secara otomatis
    if (res.audio) {
      if (!audioPlayer) {
        audioPlayer = new Audio()
        audioPlayer.crossOrigin = 'anonymous'

        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        dataArray = new Uint8Array(analyser.frequencyBinCount)

        const source = audioContext.createMediaElementSource(audioPlayer)
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        audioPlayer.onended = () => { isSpeaking.value = false }
      }

      if (audioContext?.state === 'suspended') {
        audioContext.resume()
      }

      audioPlayer.src = res.audio + '?t=' + new Date().getTime()
      isSpeaking.value = true
      audioPlayer.play().catch(e => {
        console.error('Error memutar audio:', e)
        isSpeaking.value = false
      })
    }
  } catch (error) {
    console.error(error)
    chatResponse.value = 'Maaf, terjadi kesalahan saat menghubungi makartigpt.'
  } finally {
    isLoading.value = false
    message.value = ''
  }
}

async function onSTTResult(result: string) {
  message.value = result
  showSTT.value = false
  await sendMessage()
}

// Make methods available for template binding (Nuxt workaround)
if (process.client) {
  (window as any).sendMessage = sendMessage;
  (window as any).onSTTResult = onSTTResult;
}
</script>

<template>
  <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center">
    <div class="relative flex items-center justify-center mt-8 w-[400px] h-[400px]">
      <TresCanvas clear-color="#000" class="absolute w-full h-full" :camera="{ position: [0, 0, 7], fov: 45 }">
        <TresAmbientLight :intensity="0.3" />
        <TresDirectionalLight :position="[2, 4, 6]" :intensity="1.2" color="#fff" cast-shadow />

        <!-- Audio Reactive Light -->
        <TresPointLight ref="audioLightRef" :position="[0, 0, 3]" color="#3b82f6" :intensity="0.5" />

        <!-- Postprocessing Bloom -->
        <Suspense>
          <EffectComposer>
            <Bloom :intensity="isSpeaking ? 2.0 : 0.8" :luminance-threshold="0.2" :luminance-smoothing="0.9" />
          </EffectComposer>
        </Suspense>

        <!-- Orb Animation (SVG) -->
        <foreignObject x="-2.5" y="-2.5" width="5" height="5">
          <div class="flex items-center justify-center w-full h-full relative">
            <!-- Orb -->
            <svg :class="isSpeaking ? 'orb-talking' : 'orb-idle'" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" :stop-color="sphereColor" stop-opacity="1"/>
                  <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.7"/>
                </radialGradient>
              </defs>
              <ellipse :cy="isSpeaking ? 100 + Math.sin(Date.now()/200)*8 : 100" cx="100" rx="80" :ry="isSpeaking ? 80 + Math.abs(Math.sin(Date.now()/300))*18 : 80" fill="url(#orbGradient)"/>
              <ellipse v-if="isSpeaking" :cy="120 + Math.sin(Date.now()/120)*6" cx="100" rx="30" :ry="18 + Math.abs(Math.sin(Date.now()/150))*8" fill="#fff" fill-opacity="0.08"/>
            </svg>
            <!-- Semi-face Hologram -->
            <svg class="semi-face-holo pointer-events-none absolute top-0 left-0" width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style="z-index:2;">
              <!-- Outline wajah -->
              <path d="M60,60 Q50,100 100,180 Q150,100 140,60" stroke="#67e8f9" stroke-width="3" fill="none" opacity="0.35" />
              <!-- Mata kiri -->
              <ellipse cx="80" cy="100" rx="12" ry="6" fill="#67e8f9" opacity="0.18" />
              <!-- Mata kanan -->
              <ellipse cx="120" cy="100" rx="12" ry="6" fill="#67e8f9" opacity="0.18" />
              <!-- Mulut -->
              <path d="M85,135 Q100,145 115,135" stroke="#67e8f9" stroke-width="2" fill="none" opacity="0.22" />
              <!-- Hidung -->
              <path d="M100,110 Q102,120 98,120" stroke="#67e8f9" stroke-width="1.5" fill="none" opacity="0.18" />
            </svg>
          </div>
        </foreignObject>

        <!-- Particles -->
        <Stars :radius="10" :depth="50" :count="3000" :size="0.1" :size-attenuation="true" />

        <!-- Original Sphere Glow (Scaled as a background aura) -->
        <TresMesh :scale="[0.9, 0.9, 0.9]">
          <TresSphereGeometry :args="[2.5, 64, 64]" />
          <TresMeshBasicMaterial :color="sphereColor" :transparent="true" :opacity="0.15" />
        </TresMesh>
      </TresCanvas>
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

    <h1 class="text-4xl font-bold mt-10">
      makartigpt
    </h1>

    <p class="text-zinc-400 mt-2">
      Asisten AI pribadi Anda
    </p>


    <div class="mt-10 w-full max-w-xl px-4">
      <div class="relative flex items-center">
        <input
          v-model="message"
          @keyup.enter="sendMessage()"
          :disabled="isLoading"
          type="text"
          placeholder="Ngobrol dengan makartigpt..."
          class="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 pr-12 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        >
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-blue-500/20 transition-colors"
          @click="showSTT = !showSTT"
          :aria-label="showSTT ? 'Tutup mikrofon' : 'Aktifkan mikrofon'"
        >
          <svg v-if="!showSTT" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-blue-400">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75v1.5m0 0h3m-3 0H9m3-1.5a6 6 0 0 0 6-6V9m-6 9a6 6 0 0 1-6-6V9m6 6a3 3 0 0 1-3-3V6a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-red-400 animate-pulse">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75v1.5m0 0h3m-3 0H9m3-1.5a6 6 0 0 0 6-6V9m-6 9a6 6 0 0 1-6-6V9m6 6a3 3 0 0 1-3-3V6a3 3 0 1 1 6 0v6a3 3 0 0 1-3 3z" />
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

@keyframes catchyGlow {
  0%, 100% {
    box-shadow: 0 0 60px 20px #93c5fd, 0 0 120px 40px #3b82f6, 0 0 180px 60px #1d4ed8;
    filter: blur(8px);
    opacity: 1;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 120px 40px #1d4ed8, 0 0 180px 80px #93c5fd, 0 0 240px 120px #3b82f6;
    filter: blur(16px);
    opacity: 1;
    transform: scale(1.08);
  }
}

@keyframes catchyIdle {
  0%, 100% {
    box-shadow: 0 0 40px 10px #93c5fd, 0 0 80px 20px #3b82f6, 0 0 120px 30px #1d4ed8;
    filter: blur(8px);
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 60px 20px #3b82f6, 0 0 100px 30px #93c5fd, 0 0 140px 40px #1d4ed8;
    filter: blur(12px);
    opacity: 0.9;
    transform: scale(1.04);
  }
}

@keyframes catchyPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.12);
  }
}

.animate-catchyGlow {
  animation: catchyGlow 1.2s infinite cubic-bezier(0.4,0,0.2,1);
}
.animate-catchyIdle {
  animation: catchyIdle 2.2s infinite cubic-bezier(0.4,0,0.2,1);
}
.animate-catchyPulse {
  animation: catchyPulse 1.4s infinite cubic-bezier(0.4,0,0.2,1);
}
</style>

/* Semi-face hologram style */
.semi-face-holo {
  filter: drop-shadow(0 0 8px #67e8f9cc) blur(0.5px);
  transition: opacity 0.3s;
}

/* Orb SVG Animation */
.orb-idle {
  animation: orbIdleAnim 2.2s infinite cubic-bezier(0.4,0,0.2,1);
}
.orb-talking {
  animation: orbTalkAnim 0.7s infinite cubic-bezier(0.4,0,0.2,1);
}
@keyframes orbIdleAnim {
  0%, 100% { filter: blur(0px) brightness(1); }
  50% { filter: blur(2px) brightness(1.08); }
}
@keyframes orbTalkAnim {
  0%, 100% { filter: blur(1px) brightness(1.1); }
  50% { filter: blur(4px) brightness(1.25); }
}
