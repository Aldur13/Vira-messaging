import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Dev proxy — forwards API + WS calls to the local Fastify server.
  // In production, frontend is served by Fastify itself (same origin, no proxy needed).
  server: {
    proxy: {
      '/auth':     { target: 'http://localhost:3001', changeOrigin: true },
      '/servers':  { target: 'http://localhost:3001', changeOrigin: true },
      '/channels': { target: 'http://localhost:3001', changeOrigin: true },
      '/messages': { target: 'http://localhost:3001', changeOrigin: true },
      '/health':   { target: 'http://localhost:3001', changeOrigin: true },
      '/ws':       { target: 'ws://localhost:3001',   ws: true },
    },
  },
})
