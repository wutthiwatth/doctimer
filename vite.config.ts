import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'CPR Cycle Timer',
        short_name: 'CPR Timer',
        description: 'เครื่องมือจับเวลาและแจ้งเตือนสำหรับการทำ CPR',
        theme_color: '#991b1b',
        background_color: '#fff7ed',
        display: 'standalone',
        lang: 'th',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,png,woff2}'] },
    }),
  ],
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'] },
})
