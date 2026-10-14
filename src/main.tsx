/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import './styles.css';
// Aplica a preferência "Reduzir animações" antes do primeiro render.
import './hooks/useSettingsStore';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/**
 * Service worker só na web (http/https). No Electron (file://) e dentro do app
 * Android (Capacitor) os arquivos já são locais — registrar um SW ali só causaria
 * cache obsoleto entre versões.
 */
function shouldRegisterServiceWorker(): boolean {
  if (import.meta.env.DEV) return false;
  if (!('serviceWorker' in navigator)) return false;
  if (Capacitor.isNativePlatform()) return false;
  if (/electron/i.test(navigator.userAgent)) return false;
  return location.protocol === 'https:' || location.protocol === 'http:';
}

if (shouldRegisterServiceWorker()) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {
      /* sem SW: o app continua funcionando normalmente */
    });
}
