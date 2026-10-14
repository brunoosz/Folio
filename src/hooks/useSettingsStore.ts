import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const GROQ_MODELS: { id: string; label: string; hint: string }[] = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', hint: 'Mais completo (recomendado)' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', hint: 'Mais rápido e econômico' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', hint: 'Modelo aberto da OpenAI' },
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', hint: 'Aberto, leve' },
];

export const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

/** Classe aplicada em <html> quando o usuário pede menos animações. */
export const REDUCE_MOTION_CLASS = 'reduce-motion';

export type AiStatus = 'ativa' | 'nao_configurada' | 'erro';

interface SettingsState {
  groqApiKey: string;
  groqModel: string;
  /** Resultado do último teste de conexão (null = nunca testado após salvar). */
  aiLastError: string | null;
  reduceMotion: boolean;
  setGroq: (key: string, model: string) => void;
  setAiError: (err: string | null) => void;
  setReduceMotion: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      groqApiKey: '',
      groqModel: DEFAULT_GROQ_MODEL,
      aiLastError: null,
      reduceMotion: false,
      setGroq: (key, model) => set({ groqApiKey: key.trim(), groqModel: model || DEFAULT_GROQ_MODEL, aiLastError: null }),
      setAiError: (err) => set({ aiLastError: err }),
      setReduceMotion: (v) => {
        applyReduceMotion(v);
        set({ reduceMotion: v });
      },
    }),
    {
      name: 'folio_settings',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) applyReduceMotion(state.reduceMotion);
      },
    },
  ),
);

export function applyReduceMotion(v: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, v);
}

// Aplica já na carga do módulo (o persist com localStorage reidrata de forma síncrona).
applyReduceMotion(useSettingsStore.getState().reduceMotion);

export function getAiStatus(s: Pick<SettingsState, 'groqApiKey' | 'aiLastError'>): AiStatus {
  if (!s.groqApiKey) return 'nao_configurada';
  return s.aiLastError ? 'erro' : 'ativa';
}

/** Apaga todos os dados locais do Folio (chaves "folio_*") e recarrega o app. */
export function clearAllLocalData() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('folio')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch { /* ignore */ }
  window.location.hash = '#/';
  window.location.reload();
}
