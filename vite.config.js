import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pixel-puzzle/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'puzzle-data': ['./src/lib/puzzleData.js'],
          'collections': ['./src/lib/collections.js'],
        },
      },
    },
  },
})
