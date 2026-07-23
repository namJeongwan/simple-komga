import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // Offline caching is Phase 2. For now ship a self-destroying service
      // worker so any previously-installed SW unregisters and clears its
      // stale cache (otherwise old app shells keep getting served after deploy).
      // The manifest below still makes the app installable ("add to home screen").
      selfDestroying: true,
      manifest: {
        id: '/',
        name: 'simple-komga',
        short_name: 'simple-komga',
        description: 'A simple mobile-first Komga reader',
        lang: 'ko',
        theme_color: '#0e0e10',
        background_color: '#0e0e10',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'simple-komga-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'simple-komga-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'simple-komga-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://macmini.tail993f0c.ts.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
