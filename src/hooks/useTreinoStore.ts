import { create } from 'zustand';
import type { SessaoDodia, SessaoItem } from '../data/types';
import { repo } from '../data/repository';
import { criarSessao, fichaDoDia, sessaoVazia } from '../data/seed';
import { hojeLocal } from '../data/date';
import { useHistoricoStore } from './useHistoricoStore';

/** Mesma chave usada por repo.salvarSessao. */
const LS_SESSAO = 'folio_sessao_hoje';

/**
 * Lê a sessão salva e garante que ela é de HOJE no fuso local.
 * (repo.getSessaoHoje compara com a data UTC, o que vira o dia às 21h no Brasil;
 * por isso a virada de dia é resolvida aqui.)
 */
function carregarSessaoHoje(): SessaoDodia {
  const hoje = hojeLocal();
  try {
    const raw = localStorage.getItem(LS_SESSAO);
    if (raw) {
      const saved = JSON.parse(raw) as SessaoDodia;
      if (saved && saved.data === hoje && Array.isArray(saved.itens)) {
        // Migração: itens antigos sem vínculo com a ficha / descanso.
        const ficha = repo.getFichas().find(f => f.id === saved.fichaModeloId);
        if (ficha) {
          const ordenados = [...ficha.itens].sort((a, b) => a.ordem - b.ordem);
          saved.itens = saved.itens.map((it, i) => {
            if (it.fichaItemId && it.descansoSeg !== undefined) return it;
            const fi = ficha.itens.find(f => f.id === it.fichaItemId) ?? ordenados[i];
            return { ...it, fichaItemId: it.fichaItemId ?? fi?.id, descansoSeg: it.descansoSeg ?? fi?.descansoSeg };
          });
        }
        return saved;
      }
    }
  } catch { /* sessão corrompida: recria */ }

  const ficha = fichaDoDia(repo.getFichas());
  const nova = ficha ? criarSessao(ficha, hoje) : sessaoVazia(hoje);
  repo.salvarSessao(nova);
  return nova;
}

type ItemPatch = Partial<Pick<SessaoItem, 'series' | 'reps' | 'cargaKg' | 'notas'>>;

interface TreinoState {
  sessao: SessaoDodia;
  modoAtivo: boolean;
  load: () => void;
  iniciar: () => void;
  concluir: () => void;
  toggleItem: (itemId: string) => void;
  updateItem: (itemId: string, patch: ItemPatch) => void;
  reorder: (itens: SessaoItem[]) => void;
  trocarExercicio: (itemId: string, novoExercicioId: string, escopo: 'hoje' | 'padrao') => void;
}

const inicial = carregarSessaoHoje();

export const useTreinoStore = create<TreinoState>((set, get) => {
  const salvar = (sessao: SessaoDodia) => {
    repo.salvarSessao(sessao);
    set({ sessao, modoAtivo: sessao.status === 'em_andamento' });
  };

  return {
    sessao: inicial,
    modoAtivo: inicial.status === 'em_andamento',

    load() {
      const sessao = carregarSessaoHoje();
      set({ sessao, modoAtivo: sessao.status === 'em_andamento' });
    },

    iniciar() {
      const atual = get().sessao;
      if (atual.status !== 'pendente') return;
      salvar({ ...atual, status: 'em_andamento', iniciadaEm: new Date().toISOString() });
    },

    concluir() {
      const atual = get().sessao;
      if (atual.status === 'concluida') return;
      const sessao: SessaoDodia = { ...atual, status: 'concluida', concluidaEm: new Date().toISOString() };
      salvar(sessao);

      const ficha = repo.getFichas().find(f => f.id === sessao.fichaModeloId);
      useHistoricoStore.getState().salvar(sessao, ficha?.nome ?? 'Treino');
    },

    toggleItem(itemId) {
      const atual = get().sessao;
      salvar({
        ...atual,
        itens: atual.itens.map(it => (it.id === itemId ? { ...it, concluido: !it.concluido } : it)),
      });
    },

    updateItem(itemId, patch) {
      const atual = get().sessao;
      salvar({
        ...atual,
        itens: atual.itens.map(it => (it.id === itemId ? { ...it, ...patch } : it)),
      });
    },

    reorder(itens) {
      salvar({ ...get().sessao, itens: itens.map((it, i) => ({ ...it, ordem: i })) });
    },

    trocarExercicio(itemId, novoExercicioId, escopo) {
      const atual = get().sessao;
      const original = atual.itens.find(it => it.id === itemId);
      if (!original) return;

      salvar({
        ...atual,
        itens: atual.itens.map(it => (it.id === itemId ? { ...it, exercicioId: novoExercicioId } : it)),
      });

      if (escopo !== 'padrao') return;
      const fichas = repo.getFichas();
      const ficha = fichas.find(f => f.id === atual.fichaModeloId);
      if (!ficha) return;
      // Casa pelo item de origem na ficha (estável após reordenar);
      // fallback para sessões antigas: o exercício que estava no item.
      const alvo =
        ficha.itens.find(fi => fi.id === original.fichaItemId) ??
        ficha.itens.find(fi => fi.exercicioId === original.exercicioId);
      if (!alvo) return;
      ficha.itens = ficha.itens.map(fi => (fi.id === alvo.id ? { ...fi, exercicioId: novoExercicioId } : fi));
      repo.salvarFichas(fichas);
    },
  };
});
