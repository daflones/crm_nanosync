import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              }
            }
          }
        ]
      },
      includeAssets: ['Logo.ico', 'LogoNanoSyncBranca.png', 'vite.svg'],
      manifest: {
        name: 'NanoSync CRM - Automação com IA WhatsApp Integrada',
        short_name: 'NanoSync CRM',
        description: 'Plataforma de CRM com automação inteligente via WhatsApp. Capture leads 24h por dia com IA avançada',
        theme_color: '#25D366',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'Logo.ico',
            sizes: '16x16 32x32 48x48',
            type: 'image/x-icon'
          },
          {
            src: 'LogoNanoSyncBranca.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'LogoNanoSyncBranca.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
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
