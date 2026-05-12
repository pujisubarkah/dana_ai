// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '@idds/vue/index.css',
    './app/main.css'
  ],
  modules: ['@tresjs/nuxt'],
  vite: {
    plugins: [tailwindcss()]
  }
})
