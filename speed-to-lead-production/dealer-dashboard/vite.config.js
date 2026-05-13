import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dealer-pulse/',
  server: {
    port: 5174,
    host: true
  },
  build: {
    outDir: '../server/agency-public/dealer-pulse',
    emptyOutDir: true
  }
})

