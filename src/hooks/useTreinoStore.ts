import { create } from 'zustand';
import type { SessaoDodia, SessaoItem } from '../data/types';
import { repo } from '../data/repository';
import { useHistoricoStore } from './useHistoricoStore';

interface TreinoState {
  sessao: SessaoDodia;
  modoAtivo: boolean;
  load: () => void;
  iniciar: () => void;
  concluir: () => void;
  toggleItem: (itemId: string) => void;
  updateItem: (itemId: string, patch: Partial<Pick<SessaoItem, 'series' | 'reps' | 'cargaKg' | 'notas'>>) => void;
  reorder: (itens: SessaoItem[]) => void;
  trocarExercicio: (itemId: string, novoExercicioId: string, escopo: 'hoje' | 'padrao') => void;
}

export const useTreinoStore = create<TreinoState>((set, get) => ({
  sessao: repo.getSessaoHoje(),
  modoAtivo: false,

  load() {
    set({ sessao: repo.getSessaoHoje() });
  },

  iniciar() {
    const sessao = { ...get().sessao, status: 'em_andamento' as const };
    repo.salvarSessao(sessao);
    set({ sessao, modoAtivo: true });
  },

  concluir() {
    const sessao = { ...get().sessao, status: 'concluida' as const };
    repo.salvarSessao(sessao);
    set({ sessao, modoAtivo: false });

    const fichas = repo.getFichas();
    const ficha = fichas.find(f => f.id === sessao.fichaModeloId);
    useHistoricoStore.getState().salvar(sessao, ficha?.nome ?? 'Treino');
  },

  toggleItem(itemId) {
    const sessao = { ...get().sessao };
    sessao.itens = sessao.itens.map(it =>
      it.id === itemId ? { ...it, concluido: !it.concluido } : it
    );
    repo.salvarSessao(sessao);
    set({ sessao });
  },

  updateItem(itemId, patch) {
    const sessao = { ...get().sessao };
    sessao.itens = sessao.itens.map(it =>
      it.id === itemId ? { ...it, ...patch } : it
    );
    repo.salvarSessao(sessao);
    set({ sessao });
  },

  reorder(itens) {
    const sessao = { ...get().sessao, itens: itens.map((it, i) => ({ ...it, ordem: i })) };
    repo.salvarSessao(sessao);
    set({ sessao });
  },

  trocarExercicio(itemId, novoExercicioId, escopo) {
    const sessao = { ...get().sessao };
    sessao.itens = sessao.itens.map(it =>
      it.id === itemId ? { ...it, exercicioId: novoExercicioId } : it
    );
    repo.salvarSessao(sessao);
    set({ sessao });

    if (escopo === 'padrao') {
      const fichas = repo.getFichas();
      const ficha = fichas.find(f => f.id === sessao.fichaModeloId);
      if (ficha) {
        const item = get().sessao.itens.find(it => it.id === itemId);
        if (item) {
          ficha.itens = ficha.itens.map(fi =>
            fi.ordem === item.ordem ? { ...fi, exercicioId: novoExercicioId } : fi
          );
          repo.salvarFichas(fichas);
        }
      }
    }
  },
}));
