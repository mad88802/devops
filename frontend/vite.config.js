import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The UI talks to /api by default. In dev, Vite proxies that to the Node mock
// API on :4000. Point VITE_API_BASE_URL at the real back-end whenever it lands.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
