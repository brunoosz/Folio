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
export type Tema = 'claro' | 'escuro' | 'sistema';

interface SettingsState {
  groqApiKey: string;
  groqModel: string;
  /** Resultado do último teste de conexão (null = nunca testado após salvar). */
  aiLastError: string | null;
  reduceMotion: boolean;
  tema: Tema;
  setTema: (t: Tema) => void;
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
      tema: 'claro',
      setTema: t => { applyTema(t); set({ tema: t }); },
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
        if (state) { applyReduceMotion(state.reduceMotion); applyTema(state.tema ?? 'claro'); }
      },
    },
  ),
);

export function applyReduceMotion(v: boolean) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle(REDUCE_MOTION_CLASS, v);
}

let mqTema: MediaQueryList | null = null;
const onMudancaSistema = () => applyTema(useSettingsStore.getState().tema);

/** Aplica o tema em <html data-theme> ("sistema" segue o aparelho). */
export function applyTema(t: Tema) {
  if (typeof document === 'undefined') return;
  const escuroSistema = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const efetivo = t === 'sistema' ? (escuroSistema ? 'escuro' : 'claro') : t;
  document.documentElement.dataset.theme = efetivo;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', efetivo === 'escuro' ? '#141312' : '#f6f5f4');
  if (!mqTema && window.matchMedia) {
    mqTema = window.matchMedia('(prefers-color-scheme: dark)');
    mqTema.addEventListener?.('change', onMudancaSistema);
  }
}

// Aplica já na carga do módulo (o persist com localStorage reidrata de forma síncrona).
applyReduceMotion(useSettingsStore.getState().reduceMotion);
applyTema(useSettingsStore.getState().tema ?? 'claro');

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
  // Trechos da base de conhecimento (IndexedDB).
  const recarregar = () => { window.location.hash = '#/'; window.location.reload(); };
  try {
    const req = indexedDB.deleteDatabase('folio_conhecimento');
    req.onsuccess = req.onerror = req.onblocked = recarregar;
  } catch { recarregar(); }
}
