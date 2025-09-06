import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'crm.nanosync.com.br',
      'www.crm.nanosync.com.br',
      'www.nanosync.com.br',
      'nanosync.com.br',
      'localhost',
      '127.0.0.1'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'crm.nanosync.com.br',
      'www.crm.nanosync.com.br',
      'www.nanosync.com.br',
      'nanosync.com.br',
      'localhost',
      '127.0.0.1'
    ]
  }
})
