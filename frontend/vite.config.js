import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react'
            }
            if (id.includes('react-icons')) {
              return 'vendor-icons'
            }
            if (
              id.includes('axios') ||
              id.includes('qrcode') ||
              id.includes('canvas-confetti') ||
              id.includes('react-hot-toast')
            ) {
              return 'vendor-utils'
            }
          }
        },
      },
    },
  },
})
