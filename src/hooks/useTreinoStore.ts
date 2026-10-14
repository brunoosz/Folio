import { create } from 'zustand';
import type { EsquemaSeries, FichaModelo, SerieLog, SessaoDodia, SessaoItem } from '../data/types';
import { repo } from '../data/repository';
import { criarSessao, fichaDoDia, sessaoVazia } from '../data/seed';
import { hojeLocal } from '../data/date';
import { garantirLog } from '../lib/progressao';
import { useHistoricoStore } from './useHistoricoStore';

/** Mesma chave usada por repo.salvarSessao. */
const LS_SESSAO = 'folio_sessao_hoje';
const LS_MODO = 'folio_modo_edicao';

/** "Apenas hoje" altera só a sessão do dia; "padrão" também atualiza a ficha-modelo. */
export type ModoEdicao = 'hoje' | 'padrao';

function lerModo(): ModoEdicao {
  try { return localStorage.getItem(LS_MODO) === 'padrao' ? 'padrao' : 'hoje'; } catch { return 'hoje'; }
}

/**
 * Lê a sessão salva e garante que ela é de HOJE no fuso local.
 * Migra itens antigos (sem vínculo com a ficha / descanso / esquema).
 */
function carregarSessaoHoje(): SessaoDodia {
  const hoje = hojeLocal();
  try {
    const raw = localStorage.getItem(LS_SESSAO);
    if (raw) {
      const saved = JSON.parse(raw) as SessaoDodia;
      if (saved && saved.data === hoje && Array.isArray(saved.itens)) {
        const ficha = repo.getFichas().find(f => f.id === saved.fichaModeloId);
        if (ficha) {
          const ordenados = [...ficha.itens].sort((a, b) => a.ordem - b.ordem);
          saved.itens = saved.itens.map((it, i) => {
            if (it.fichaItemId && it.descansoSeg !== undefined) return it;
            const fi = ficha.itens.find(f => f.id === it.fichaItemId) ?? ordenados[i];
            return { ...it, fichaItemId: it.fichaItemId ?? fi?.id, descansoSeg: it.descansoSeg ?? fi?.descansoSeg, esquema: it.esquema ?? fi?.esquema };
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

export type ItemPatch = Partial<Pick<SessaoItem, 'series' | 'reps' | 'cargaKg' | 'notas' | 'descansoSeg' | 'esquema'>>;

/** Campos que, no modo "padrão", também vão para a ficha. */
const CAMPOS_FICHA = ['series', 'reps', 'notas', 'descansoSeg', 'esquema'] as const;

interface TreinoState {
  sessao: SessaoDodia;
  modoAtivo: boolean;
  modo: ModoEdicao;
  load: () => void;
  setModo: (m: ModoEdicao) => void;
  iniciar: () => void;
  concluir: () => void;
  toggleItem: (itemId: string) => void;
  updateItem: (itemId: string, patch: ItemPatch, escopo?: ModoEdicao) => void;
  atualizarSerie: (itemId: string, idx: number, patch: Partial<SerieLog>) => void;
  reorder: (itens: SessaoItem[]) => void;
  trocarExercicio: (itemId: string, novoExercicioId: string, escopo: ModoEdicao) => void;
  adicionarExercicio: (exercicioId: string) => void;
  removerItem: (itemId: string) => void;
  /** Troca a ficha do dia (apenas antes de iniciar). */
  usarFicha: (fichaId: string) => void;
}

const inicial = carregarSessaoHoje();

/** Aplica uma alteração na ficha-modelo de origem da sessão. */
function editarFicha(sessao: SessaoDodia, fn: (ficha: FichaModelo) => FichaModelo) {
  const fichas = repo.getFichas();
  const idx = fichas.findIndex(f => f.id === sessao.fichaModeloId);
  if (idx < 0) return;
  fichas[idx] = fn({ ...fichas[idx], itens: [...fichas[idx].itens] });
  repo.salvarFichas(fichas);
}

export const useTreinoStore = create<TreinoState>((set, get) => {
  const salvar = (sessao: SessaoDodia) => {
    repo.salvarSessao(sessao);
    set({ sessao, modoAtivo: sessao.status === 'em_andamento' });
  };
  const mapItem = (itemId: string, fn: (it: SessaoItem) => SessaoItem) => {
    const atual = get().sessao;
    salvar({ ...atual, itens: atual.itens.map(it => (it.id === itemId ? fn(it) : it)) });
  };

  return {
    sessao: inicial,
    modoAtivo: inicial.status === 'em_andamento',
    modo: lerModo(),

    load() {
      const sessao = carregarSessaoHoje();
      set({ sessao, modoAtivo: sessao.status === 'em_andamento' });
    },

    setModo(m) {
      try { localStorage.setItem(LS_MODO, m); } catch { /* ignore */ }
      set({ modo: m });
    },

    iniciar() {
      const atual = get().sessao;
      if (atual.status !== 'pendente') return;
      salvar({ ...atual, status: 'em_andamento', iniciadaEm: new Date().toISOString() });
    },

    concluir() {
      const atual = get().sessao;
      if (atual.status === 'concluida') return;
      // A carga "resumo" do item passa a ser a maior carga anotada nas séries.
      const itens = atual.itens.map(it => {
        const cargas = (it.seriesLog ?? []).filter(s => s.feita && s.cargaKg).map(s => s.cargaKg as number);
        return cargas.length ? { ...it, cargaKg: Math.max(...cargas) } : it;
      });
      const sessao: SessaoDodia = { ...atual, itens, status: 'concluida', concluidaEm: new Date().toISOString() };
      salvar(sessao);
      const ficha = repo.getFichas().find(f => f.id === sessao.fichaModeloId);
      useHistoricoStore.getState().salvar(sessao, ficha?.nome ?? 'Treino');
    },

    toggleItem(itemId) {
      mapItem(itemId, it => {
        const concluido = !it.concluido;
        // Marcar o exercício inteiro marca as séries; desmarcar não apaga o que foi anotado.
        const ex = repo.getExercicio(it.exercicioId);
        const log = concluido ? garantirLog(it, ex).map(s => ({ ...s, feita: true })) : it.seriesLog;
        return { ...it, concluido, seriesLog: log };
      });
    },

    updateItem(itemId, patch, escopo) {
      const original = get().sessao.itens.find(it => it.id === itemId);
      if (!original) return;
      mapItem(itemId, it => {
        const novo = { ...it, ...patch };
        // Mudou o número de séries/esquema: reconstrói o registro preservando o anotado.
        if ('series' in patch || 'esquema' in patch || 'reps' in patch) {
          novo.seriesLog = garantirLog(novo, repo.getExercicio(it.exercicioId));
        }
        return novo;
      });
      const modo = escopo ?? get().modo;
      const camposFicha = CAMPOS_FICHA.filter(k => k in patch);
      if (modo === 'padrao' && camposFicha.length && original.fichaItemId) {
        editarFicha(get().sessao, f => ({
          ...f,
          itens: f.itens.map(fi => {
            if (fi.id !== original.fichaItemId) return fi;
            const upd = { ...fi };
            for (const k of camposFicha) (upd as Record<string, unknown>)[k] = patch[k];
            return upd;
          }),
        }));
      }
    },

    atualizarSerie(itemId, idx, patch) {
      mapItem(itemId, it => {
        const log = garantirLog(it, repo.getExercicio(it.exercicioId));
        if (!log[idx]) return it;
        log[idx] = { ...log[idx], ...patch };
        const todas = log.every(s => s.feita);
        const cargaKg = idx === 0 && patch.cargaKg !== undefined ? patch.cargaKg : it.cargaKg;
        return { ...it, seriesLog: log, concluido: todas, cargaKg };
      });
    },

    reorder(itens) {
      salvar({ ...get().sessao, itens: itens.map((it, i) => ({ ...it, ordem: i })) });
      if (get().modo === 'padrao') {
        const ordem = itens.map(it => it.fichaItemId).filter(Boolean) as string[];
        editarFicha(get().sessao, f => ({
          ...f,
          itens: [...f.itens]
            .sort((a, b) => {
              const ia = ordem.indexOf(a.id), ib = ordem.indexOf(b.id);
              return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
            })
            .map((fi, i) => ({ ...fi, ordem: i })),
        }));
      }
    },

    trocarExercicio(itemId, novoExercicioId, escopo) {
      const atual = get().sessao;
      const original = atual.itens.find(it => it.id === itemId);
      if (!original) return;
      salvar({
        ...atual,
        itens: atual.itens.map(it => (it.id === itemId ? { ...it, exercicioId: novoExercicioId, seriesLog: undefined, cargaKg: null } : it)),
      });
      if (escopo !== 'padrao') return;
      editarFicha(atual, f => {
        const alvo = f.itens.find(fi => fi.id === original.fichaItemId) ?? f.itens.find(fi => fi.exercicioId === original.exercicioId);
        if (!alvo) return f;
        return { ...f, itens: f.itens.map(fi => (fi.id === alvo.id ? { ...fi, exercicioId: novoExercicioId } : fi)) };
      });
    },

    adicionarExercicio(exercicioId) {
      const atual = get().sessao;
      const esquema: EsquemaSeries = repo.getExercicio(exercicioId)?.isometrico ? 'fixo' : 'piramide';
      const sufixo = Date.now().toString(36);
      const novo: SessaoItem = {
        id: `si_extra_${sufixo}`,
        sessaoId: atual.id,
        exercicioId,
        ordem: atual.itens.length,
        series: 3,
        reps: esquema === 'fixo' ? '30' : '12/10/8',
        cargaKg: null,
        notas: '',
        concluido: false,
        descansoSeg: 90,
        esquema,
      };
      if (get().modo === 'padrao' && atual.fichaModeloId) {
        const fichaItemId = `fi_${sufixo}`;
        novo.fichaItemId = fichaItemId;
        editarFicha(atual, f => ({
          ...f,
          itens: [...f.itens, {
            id: fichaItemId, fichaId: f.id, exercicioId, ordem: f.itens.length, series: 3, reps: novo.reps,
            descansoSeg: 90, notas: '', esquema,
          }],
        }));
      }
      salvar({ ...atual, itens: [...atual.itens, novo] });
    },

    removerItem(itemId) {
      const atual = get().sessao;
      const item = atual.itens.find(it => it.id === itemId);
      salvar({ ...atual, itens: atual.itens.filter(it => it.id !== itemId).map((it, i) => ({ ...it, ordem: i })) });
      if (get().modo === 'padrao' && item?.fichaItemId) {
        editarFicha(atual, f => ({
          ...f,
          itens: f.itens.filter(fi => fi.id !== item.fichaItemId).map((fi, i) => ({ ...fi, ordem: i })),
        }));
      }
    },

    usarFicha(fichaId) {
      const atual = get().sessao;
      if (atual.status !== 'pendente') return;
      const ficha = repo.getFichas().find(f => f.id === fichaId);
      if (!ficha) return;
      salvar(criarSessao(ficha, hojeLocal()));
    },
  };
});
