import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  output: 'server',
  integrations: [
    react(),
    tailwind(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        // Cacheamos todos los recursos estáticos para modo offline
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Estrategia para la API de Supabase: Intenta red, si falla, usa caché
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Cimasur Trazabilidad',
        short_name: 'Cimasur',
        description: 'Sistema de trazabilidad Offline-First para laboratorios',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});