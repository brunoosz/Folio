import { create } from 'zustand';
import type { HabitoModelo, HabitoRegistro } from '../data/rotina';
import { habitosDefault } from '../data/rotina';

const LS_HABITOS = 'folio_habitos';
const LS_REGISTROS = 'folio_registros';

function read<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function write<T>(key: string, d: T) { localStorage.setItem(key, JSON.stringify(d)); }

function hoje() { return new Date().toISOString().slice(0, 10); }

interface RotinaState {
  habitos: HabitoModelo[];
  registros: HabitoRegistro[];
  load: () => void;
  incrementar: (habitoId: string) => void;
  decrementar: (habitoId: string) => void;
  setValor: (habitoId: string, valor: number) => void;
  setNotas: (habitoId: string, notas: string) => void;
  getRegistroHoje: (habitoId: string) => HabitoRegistro;
  getHistorico: (habitoId: string, dias: number) => { data: string; valor: number }[];
}

export const useRotinaStore = create<RotinaState>((set, get) => ({
  habitos: read(LS_HABITOS, habitosDefault),
  registros: read(LS_REGISTROS, [] as HabitoRegistro[]),

  load() {
    set({
      habitos: read(LS_HABITOS, habitosDefault),
      registros: read(LS_REGISTROS, []),
    });
  },

  getRegistroHoje(habitoId) {
    const h = hoje();
    return get().registros.find(r => r.habitoId === habitoId && r.data === h)
      ?? { habitoId, data: h, valor: 0, notas: '' };
  },

  getHistorico(habitoId, dias) {
    const result: { data: string; valor: number }[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const reg = get().registros.find(r => r.habitoId === habitoId && r.data === ds);
      result.push({ data: ds, valor: reg?.valor ?? 0 });
    }
    return result;
  },

  incrementar(habitoId) {
    const h = hoje();
    let registros = [...get().registros];
    const idx = registros.findIndex(r => r.habitoId === habitoId && r.data === h);
    if (idx >= 0) {
      registros[idx] = { ...registros[idx], valor: registros[idx].valor + 1 };
    } else {
      registros.push({ habitoId, data: h, valor: 1, notas: '' });
    }
    write(LS_REGISTROS, registros);
    set({ registros });
  },

  decrementar(habitoId) {
    const h = hoje();
    let registros = [...get().registros];
    const idx = registros.findIndex(r => r.habitoId === habitoId && r.data === h);
    if (idx >= 0 && registros[idx].valor > 0) {
      registros[idx] = { ...registros[idx], valor: registros[idx].valor - 1 };
      write(LS_REGISTROS, registros);
      set({ registros });
    }
  },

  setValor(habitoId, valor) {
    const h = hoje();
    let registros = [...get().registros];
    const idx = registros.findIndex(r => r.habitoId === habitoId && r.data === h);
    if (idx >= 0) {
      registros[idx] = { ...registros[idx], valor };
    } else {
      registros.push({ habitoId, data: h, valor, notas: '' });
    }
    write(LS_REGISTROS, registros);
    set({ registros });
  },

  setNotas(habitoId, notas) {
    const h = hoje();
    let registros = [...get().registros];
    const idx = registros.findIndex(r => r.habitoId === habitoId && r.data === h);
    if (idx >= 0) {
      registros[idx] = { ...registros[idx], notas };
    } else {
      registros.push({ habitoId, data: h, valor: 0, notas });
    }
    write(LS_REGISTROS, registros);
    set({ registros });
  },
}));
