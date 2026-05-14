<template>
  <div class="flex">
    <AdminSidebar />
    <div class="flex-1 p-8">
      <h1 class="text-2xl font-bold mb-4">Upload CSV ke Qdrant</h1>
      <p class="mb-4">(Fitur upload CSV bisa kamu tambahkan di sini.)</p>
      <div class="bg-gray-50 p-4 rounded border text-gray-500">Belum ada fitur upload CSV.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminSidebar from '~/components/AdminSidebar.vue'
</script>
