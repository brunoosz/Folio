import { create } from 'zustand';
import type { HomeBlocoConfig, HomeBlocoTipo } from '../data/types';
import { repo } from '../data/repository';

const TIPOS: HomeBlocoTipo[] = ['treino_do_dia', 'linha_do_tempo', 'pilula_cientifica', 'atalhos_mapa'];

/** Remove tipos desconhecidos/duplicados e acrescenta blocos novos que faltarem. */
function normalizar(blocos: HomeBlocoConfig[]): HomeBlocoConfig[] {
  const vistos = new Set<HomeBlocoTipo>();
  const ok = (Array.isArray(blocos) ? blocos : []).filter(b => {
    if (!b || !TIPOS.includes(b.tipo) || vistos.has(b.tipo)) return false;
    vistos.add(b.tipo);
    return true;
  }).map(b => ({ tipo: b.tipo, visivel: b.visivel !== false }));
  for (const t of TIPOS) if (!vistos.has(t)) ok.push({ tipo: t, visivel: true });
  return ok;
}

interface HomeState {
  blocos: HomeBlocoConfig[];
  editando: boolean;
  load: () => void;
  toggleEditar: () => void;
  setEditando: (v: boolean) => void;
  toggleBloco: (tipo: HomeBlocoTipo) => void;
  reorder: (blocos: HomeBlocoConfig[]) => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  blocos: normalizar(repo.getHomeBlocos()),
  editando: false,

  load() { set({ blocos: normalizar(repo.getHomeBlocos()) }); },

  toggleEditar() { set({ editando: !get().editando }); },

  setEditando(v) { set({ editando: v }); },

  toggleBloco(tipo) {
    const blocos = get().blocos.map(b => (b.tipo === tipo ? { ...b, visivel: !b.visivel } : b));
    repo.salvarHomeBlocos(blocos);
    set({ blocos });
  },

  reorder(blocos) {
    repo.salvarHomeBlocos(blocos);
    set({ blocos });
  },
}));
