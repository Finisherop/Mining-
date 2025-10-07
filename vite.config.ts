import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // ensures correct relative paths for Vercel
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
    minify: false, // FIX: Disable minification for better error messages
    sourcemap: true, // FIX: Enable sourcemaps for debugging
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  define: {
    // FIX: Enable React dev mode for better error messages
    __DEV__: JSON.stringify(true)
  }
})