import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // FIX: Allow external connections from all devices
    strictPort: false,
    cors: true, // FIX: Enable CORS for cross-device access
  },
  preview: {
    port: 3000,
    host: '0.0.0.0', // FIX: Allow preview server to be accessed from other devices
    strictPort: false,
    cors: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
})