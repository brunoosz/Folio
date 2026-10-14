import { create } from 'zustand';
import type { SessaoDodia } from '../data/types';

const LS_KEY = 'folio_historico';

export interface SessaoHistorico extends SessaoDodia {
  fichaModeloNome: string;
}

function read(): SessaoHistorico[] {
  try {
    const r = localStorage.getItem(LS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function write(d: SessaoHistorico[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(d));
}

interface HistoricoState {
  sessoes: SessaoHistorico[];
  load: () => void;
  salvar: (sessao: SessaoDodia, fichaNome: string) => void;
  getProgressaoExercicio: (exercicioId: string, dias: number) => { data: string; cargaMax: number; volumeTotal: number }[];
  getSessoesPorPeriodo: (dias: number) => SessaoHistorico[];
  getResumoSemanal: () => { semana: string; sessoes: number; volumeTotal: number }[];
}

export const useHistoricoStore = create<HistoricoState>((set, get) => ({
  sessoes: read(),

  load() {
    set({ sessoes: read() });
  },

  salvar(sessao, fichaNome) {
    const hist = read();
    const idx = hist.findIndex(s => s.id === sessao.id && s.data === sessao.data);
    const entry: SessaoHistorico = { ...sessao, fichaModeloNome: fichaNome };
    if (idx >= 0) {
      hist[idx] = entry;
    } else {
      hist.push(entry);
    }
    write(hist);
    set({ sessoes: hist });
  },

  getProgressaoExercicio(exercicioId, dias) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const limiteStr = limite.toISOString().slice(0, 10);

    const pontos: { data: string; cargaMax: number; volumeTotal: number }[] = [];
    const sessoes = get().sessoes
      .filter(s => s.data >= limiteStr)
      .sort((a, b) => a.data.localeCompare(b.data));

    for (const s of sessoes) {
      const itens = s.itens.filter(i => i.exercicioId === exercicioId && i.concluido);
      if (itens.length === 0) continue;

      const cargaMax = Math.max(...itens.map(i => i.cargaKg ?? 0));
      const volumeTotal = itens.reduce((acc, i) => {
        const repsNum = parseInt(i.reps) || 0;
        return acc + (i.series * repsNum * (i.cargaKg ?? 0));
      }, 0);

      pontos.push({ data: s.data, cargaMax, volumeTotal });
    }
    return pontos;
  },

  getSessoesPorPeriodo(dias) {
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const limiteStr = limite.toISOString().slice(0, 10);
    return get().sessoes
      .filter(s => s.data >= limiteStr)
      .sort((a, b) => b.data.localeCompare(a.data));
  },

  getResumoSemanal() {
    const sessoes = get().sessoes.sort((a, b) => a.data.localeCompare(b.data));
    const semanas: Map<string, { sessoes: number; volumeTotal: number }> = new Map();

    for (const s of sessoes) {
      const d = new Date(s.data + 'T00:00:00');
      const inicio = new Date(d);
      inicio.setDate(d.getDate() - d.getDay());
      const chave = inicio.toISOString().slice(0, 10);

      const vol = s.itens.reduce((acc, i) => {
        if (!i.concluido) return acc;
        const repsNum = parseInt(i.reps) || 0;
        return acc + (i.series * repsNum * (i.cargaKg ?? 0));
      }, 0);

      const atual = semanas.get(chave) ?? { sessoes: 0, volumeTotal: 0 };
      semanas.set(chave, { sessoes: atual.sessoes + 1, volumeTotal: atual.volumeTotal + vol });
    }

    return [...semanas.entries()]
      .map(([semana, dados]) => ({ semana, ...dados }))
      .slice(-8);
  },
}));
