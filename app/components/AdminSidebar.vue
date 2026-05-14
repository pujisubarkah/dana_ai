<template>
  <aside class="w-56 min-h-screen bg-gray-100 border-r flex flex-col py-6 px-4">
    <nav class="flex flex-col gap-2">
      <NuxtLink to="/admin/upload" class="sidebar-link" active-class="active">Upload PDF</NuxtLink>
      <NuxtLink to="/admin/api" class="sidebar-link" active-class="active">Koneksi API</NuxtLink>
      <NuxtLink to="/admin/csv" class="sidebar-link" active-class="active">Upload CSV</NuxtLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
// No logic needed for static sidebar
</script>

<style scoped>
.sidebar-link {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s;
}
.sidebar-link:hover {
  background: #e5e7eb;
}
.active {
  background: #2563eb;
  color: #fff;
}
</style>
