import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LembretesConfig {
  /** Chave geral: desligada, nada é agendado. */
  ativo: boolean;
  agua: { ativo: boolean; intervaloMin: number; inicio: string; fim: string };
  dormir: { ativo: boolean; hora: string };
  remedios: { ativo: boolean };
  treino: { ativo: boolean; hora: string; dias: number[] };
}

interface LembretesState extends LembretesConfig {
  set: (patch: Partial<LembretesConfig>) => void;
  setAgua: (patch: Partial<LembretesConfig['agua']>) => void;
  setDormir: (patch: Partial<LembretesConfig['dormir']>) => void;
  setRemedios: (patch: Partial<LembretesConfig['remedios']>) => void;
  setTreino: (patch: Partial<LembretesConfig['treino']>) => void;
}

export const useLembretesStore = create<LembretesState>()(
  persist(
    (set, get) => ({
      ativo: false,
      agua: { ativo: true, intervaloMin: 120, inicio: '08:00', fim: '21:00' },
      dormir: { ativo: true, hora: '22:30' },
      remedios: { ativo: true },
      treino: { ativo: false, hora: '18:00', dias: [1, 2, 3, 4, 5] },
      set: patch => set(patch),
      setAgua: p => set({ agua: { ...get().agua, ...p } }),
      setDormir: p => set({ dormir: { ...get().dormir, ...p } }),
      setRemedios: p => set({ remedios: { ...get().remedios, ...p } }),
      setTreino: p => set({ treino: { ...get().treino, ...p } }),
    }),
    {
      name: 'folio_lembretes',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: s => ({ ativo: s.ativo, agua: s.agua, dormir: s.dormir, remedios: s.remedios, treino: s.treino }),
    },
  ),
);
