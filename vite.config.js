import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Make sure environment variables are properly passed to the client
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  },
  build: {
    // Configure build options
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Proxy API requests during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})