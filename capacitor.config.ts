import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.folio.app',
  appName: 'Folio',
  webDir: 'dist',
  backgroundColor: '#f6f5f4',
  android: {
    backgroundColor: '#f6f5f4',
    allowMixedContent: false,
  },
  plugins: {
    // Encaminha fetch/XHR pelo HTTP nativo: chamadas à API da Groq sem CORS no Android.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
