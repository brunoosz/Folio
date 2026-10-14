import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TipoExame } from '../data/exames';

export interface ResultadoExame {
  id: string;
  nome: string;
  /** Valor numérico (null quando o resultado é textual, ex.: "Negativo"). */
  valor: number | null;
  valorTexto?: string;
  unidade: string;
  refMin?: number;
  refMax?: number;
  refTexto?: string;
  /** ID do catálogo, quando reconhecido. */
  analitoId?: string;
}

export interface Exame {
  id: string;
  data: string;
  tipo: TipoExame;
  titulo: string;
  laboratorio: string;
  resultados: ResultadoExame[];
  /** Texto livre (laudos de imagem, observações). */
  notas: string;
  analise?: { texto: string; em: string; origem: 'ia' | 'offline' };
}

interface ExamesState {
  exames: Exame[];
  adicionar: (e: Omit<Exame, 'id'>) => string;
  atualizar: (id: string, patch: Partial<Omit<Exame, 'id'>>) => void;
  remover: (id: string) => void;
  salvarResultado: (exameId: string, r: ResultadoExame) => void;
  removerResultado: (exameId: string, resultadoId: string) => void;
}

export const novoId = (p = 'x') => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useExamesStore = create<ExamesState>()(
  persist(
    (set, get) => ({
      exames: [],
      adicionar: e => {
        const id = novoId('e');
        set({ exames: [...get().exames, { ...e, id }] });
        return id;
      },
      atualizar: (id, patch) => set({ exames: get().exames.map(e => (e.id === id ? { ...e, ...patch } : e)) }),
      remover: id => set({ exames: get().exames.filter(e => e.id !== id) }),
      salvarResultado: (exameId, r) =>
        set({
          exames: get().exames.map(e => {
            if (e.id !== exameId) return e;
            const existe = e.resultados.some(x => x.id === r.id);
            // Resultados mudaram: a análise anterior deixa de valer.
            return { ...e, analise: undefined, resultados: existe ? e.resultados.map(x => (x.id === r.id ? r : x)) : [...e.resultados, r] };
          }),
        }),
      removerResultado: (exameId, rid) =>
        set({ exames: get().exames.map(e => (e.id === exameId ? { ...e, analise: undefined, resultados: e.resultados.filter(x => x.id !== rid) } : e)) }),
    }),
    { name: 'folio_exames', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);
