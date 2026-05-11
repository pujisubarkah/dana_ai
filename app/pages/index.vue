<template>
  <div class="min-h-screen bg-black text-white flex flex-col items-center justify-center">
    <div class="orb"></div>

    <h1 class="text-4xl font-bold mt-10">
      Dana AI
    </h1>

    <p class="text-zinc-400 mt-2">
      Your personal AI assistant
    </p>

    <div class="mt-10 w-full max-w-xl px-4">
      <input
        type="text"
        placeholder="Talk to Dana..."
        class="w-full bg-zinc-900 border border-zinc-700 rounded-full px-6 py-4 outline-none"
      >
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
