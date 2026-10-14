import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// base './' => caminhos relativos: funciona na web, no Electron (file://) e no WebView do Capacitor.
export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registro manual e condicional em src/main.tsx (só em origens http/https da web).
      injectRegister: null,
      includeAssets: ['favicon.ico', 'favicon.svg', 'logo-mark.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Folio',
        short_name: 'Folio',
        description: 'Corpo, rotina e ciência',
        lang: 'pt-BR',
        theme_color: '#f6f5f4',
        background_color: '#f6f5f4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
