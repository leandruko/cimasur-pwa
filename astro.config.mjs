import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import tailwindv4 from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Mantenemos SSR para Auth y manejo de datos
  output: 'server',
  
  // Adaptador de Vercel con configuración estándar
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
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
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],

  vite: {
    plugins: [tailwindv4()],
    build: {
      cssCodeSplit: true,
      // Evita que Rollup se confunda con las librerías de navegador
      rollupOptions: {
        external: ['jspdf', 'xlsx'],
      }
    },
    // ESTA PARTE ES CRÍTICA:
    // Evita que Astro intente procesar estas librerías en el lado del servidor (SSR)
    ssr: {
      external: ['jspdf', 'xlsx', 'dexie'],
      noExternal: ['dayjs', 'lucide-react']
    },
    optimizeDeps: {
      exclude: ['jspdf', 'xlsx']
    }
  },
});