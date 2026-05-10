import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import tailwindv4 from '@tailwindcss/vite';
import vercel from '@astrojs/vercel'; // Solo necesitamos este

export default defineConfig({
  // 'server' es necesario para Auth y SSR
  output: 'server',
  
  // Usamos el adaptador oficial de Vercel
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    // Si tienes problemas con imágenes, puedes añadir:
    // imagesConfig: { sizes: [320, 480, 640, 750, 828, 1080, 1200] }
  }),

  integrations: [
    react(), 
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
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
        start_url: '/', // Importante para PWA
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindv4()],
    // Recomendado para evitar problemas con dependencias grandes en Vercel
    build: {
      cssCodeSplit: true,
    }
  },
});