import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base берётся из окружения: на GitHub Pages сайт живёт в подпапке /<repo>/,
// локально — в корне. Задаётся в workflow через VITE_BASE.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
