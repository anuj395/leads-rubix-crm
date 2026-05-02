import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const devApiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080'
const port = Number(process.env.PORT || 5173)

// BASE_PATH is provided by the Replit artifact runtime (e.g. "/__mockup").
// Default to "/" so plain `vite dev` outside Replit also works.
const basePath = (() => {
  const raw = process.env.BASE_PATH || '/'
  const trimmed = raw.replace(/\/+$/g, '')
  return trimmed === '' ? '/' : `${trimmed}/`
})()

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port,
    allowedHosts: true,
  },
})
