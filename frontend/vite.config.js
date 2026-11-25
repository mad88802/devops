import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The UI talks to /api. In dev, Vite proxies /api to the Python Flask back-end
// on port 5000 (or to the Node mock API on port 4000 if configured via VITE_API_BASE_URL).
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
