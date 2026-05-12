<template>
  <div class="stt-component">
    <button @click="toggleRecognition">
      {{ listening ? 'Berhenti' : 'Mulai Bicara' }}
    </button>
    <p v-if="result">Hasil: {{ result }}</p>
    <p v-if="error" class="error">Error: {{ error }}</p>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from 'vue'

const result = ref('')
const listening = ref(false)
const error = ref('')
let recognition

const emit = defineEmits(['result'])

if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SpeechRecognition()
  recognition.lang = 'id-ID' // Bahasa Indonesia
  recognition.continuous = false
  recognition.interimResults = false

  recognition.onresult = (event) => {
    result.value = event.results[0][0].transcript
    listening.value = false
    emit('result', result.value)
  }
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error, event)
    if (event.error === 'network') {
      error.value = 'Koneksi suara diblokir: Pastikan menggunakan Google Chrome, buka via localhost/HTTPS, atau matikan ekstensi Ad-Blocker.'
    } else {
      error.value = event.error
    }
    
    listening.value = false
  }
  recognition.onend = () => {
    listening.value = false
  }
}

function toggleRecognition() {
  if (!recognition) {
    error.value = 'Web Speech API tidak didukung di browser ini.'
    return
  }
  if (listening.value) {
    recognition.stop()
    listening.value = false
  } else {
    error.value = ''
    result.value = ''
    recognition.start()
    listening.value = true
  }
}

onMounted(() => {
  if (recognition && !listening.value) {
    toggleRecognition()
  }
})

onUnmounted(() => {
  if (recognition && listening.value) {
    recognition.stop()
  }
})
</script>

<style scoped>
.stt-component {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 300px;
}
.error {
  color: red;
}
</style>
