import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import tailwindv4 from '@tailwindcss/vite'; // Importamos el plugin de Vite
import node from '@astrojs/node';

export default defineConfig({
  // Necesitas un adaptador para usar 'server'
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(), 
    // Eliminamos tailwind() de aquí
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
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  vite: {
    // Tailwind v4 se configura aquí como plugin de Vite
    plugins: [tailwindv4()],
  },
});