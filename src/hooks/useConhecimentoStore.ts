import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TipoDoc = 'artigo' | 'livro' | 'apostila' | 'video' | 'site' | 'nota';

export const tipoDocLabels: Record<TipoDoc, string> = {
  artigo: 'Artigo científico',
  livro: 'Livro',
  apostila: 'Apostila',
  video: 'Vídeo',
  site: 'Site',
  nota: 'Anotação',
};

/** Metadados do documento. O texto (dividido em trechos) fica no IndexedDB. */
export interface DocConhecimento {
  id: string;
  titulo: string;
  tipo: TipoDoc;
  autor: string;
  ano: string;
  url: string;
  tags: string[];
  /** Quantidade de trechos indexados. */
  trechos: number;
  caracteres: number;
  /** Documentos inativos não entram nas respostas da IA. */
  ativo: boolean;
  criadoEm: string;
}

interface ConhecimentoState {
  docs: DocConhecimento[];
  adicionar: (d: DocConhecimento) => void;
  atualizar: (id: string, patch: Partial<DocConhecimento>) => void;
  remover: (id: string) => void;
  limpar: () => void;
}

export const useConhecimentoStore = create<ConhecimentoState>()(
  persist(
    (set, get) => ({
      docs: [],
      adicionar: d => set({ docs: [d, ...get().docs.filter(x => x.id !== d.id)] }),
      atualizar: (id, patch) => set({ docs: get().docs.map(d => (d.id === id ? { ...d, ...patch } : d)) }),
      remover: id => set({ docs: get().docs.filter(d => d.id !== id) }),
      limpar: () => set({ docs: [] }),
    }),
    { name: 'folio_conhecimento', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
