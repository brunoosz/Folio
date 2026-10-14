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
    // Lembretes locais (água, sono, remédios, treino).
    LocalNotifications: { smallIcon: 'ic_stat_folio', iconColor: '#0075de' },
  },
};

export default config;
