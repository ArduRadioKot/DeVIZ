import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    allowedHosts: ['ecocheck.space'],
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 8000,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app/index.html'),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg'],
      manifest: {
        name: 'DeVIZ — HubNear',
        short_name: 'DeVIZ',
        description: 'Мобильный сервис для быстрых сборов на активности рядом',
        start_url: '/app/',
        display: 'standalone',
        background_color: '#116F5F',
        theme_color: '#116F5F',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/app/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/app/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
