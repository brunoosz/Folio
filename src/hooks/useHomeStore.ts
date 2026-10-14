import { create } from 'zustand';
import type { HomeBlocoConfig } from '../data/types';
import { repo } from '../data/repository';

interface HomeState {
  blocos: HomeBlocoConfig[];
  editando: boolean;
  load: () => void;
  toggleEditar: () => void;
  toggleBloco: (tipo: string) => void;
  reorder: (blocos: HomeBlocoConfig[]) => void;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  blocos: repo.getHomeBlocos(),
  editando: false,

  load() { set({ blocos: repo.getHomeBlocos() }); },

  toggleEditar() { set({ editando: !get().editando }); },

  toggleBloco(tipo) {
    const blocos = get().blocos.map(b =>
      b.tipo === tipo ? { ...b, visivel: !b.visivel } : b
    );
    repo.salvarHomeBlocos(blocos);
    set({ blocos });
  },

  reorder(blocos) {
    repo.salvarHomeBlocos(blocos);
    set({ blocos });
  },
}));
