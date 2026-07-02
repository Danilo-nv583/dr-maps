import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { branding } from './src/config/branding.js';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: branding.nombreSistema,
        short_name: branding.nombreCorto,
        description: branding.subtitulo,
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',

        icons: [
  {
    src: '/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: '/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
  },
]
      
      },
    }),
  ],
})