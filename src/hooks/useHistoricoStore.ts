import { create } from 'zustand';
import type { SessaoDodia, SessaoItem } from '../data/types';
import { addDiasISO, hojeLocal, parseLocalISODate, toLocalISODate } from '../data/date';

const LS_KEY = 'folio_historico';

export interface SessaoHistorico extends SessaoDodia {
  fichaModeloNome: string;
}

export interface PontoProgressao { data: string; cargaMax: number; volumeTotal: number }
export interface ResumoSemana { semana: string; sessoes: number; volumeTotal: number }

function read(): SessaoHistorico[] {
  try {
    const r = localStorage.getItem(LS_KEY);
    const lista = r ? JSON.parse(r) : [];
    return Array.isArray(lista) ? lista.filter(s => s && typeof s.data === 'string' && Array.isArray(s.itens)) : [];
  } catch { return []; }
}

function write(d: SessaoHistorico[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch { /* armazenamento cheio/bloqueado */ }
}

/* ------------------------------------------------------------------
 * Funções puras de derivação. Use-as com useMemo sobre `s.sessoes`:
 * selecionar o resultado direto no seletor do Zustand cria um array
 * novo a cada render (loop infinito no Zustand 5).
 * ------------------------------------------------------------------ */

/**
 * Converte o texto de repetições em número para cálculo de volume.
 * Faixas como "8-10" ou "8 a 10" usam o PRIMEIRO valor (estimativa conservadora).
 * Textos sem número (ex.: "até a falha") contam 0.
 */
export function repsNumero(reps: string): number {
  const m = String(reps ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Volume de um item: séries × repetições × carga (kg). */
export function volumeItem(i: SessaoItem): number {
  return (i.series || 0) * repsNumero(i.reps) * (i.cargaKg ?? 0);
}

export function volumeSessao(s: SessaoDodia): number {
  return s.itens.reduce((acc, i) => (i.concluido ? acc + volumeItem(i) : acc), 0);
}

/** Sessões dos últimos `dias` dias (local), mais recentes primeiro. Não altera a entrada. */
export function sessoesNoPeriodo(sessoes: SessaoHistorico[], dias: number): SessaoHistorico[] {
  const limite = addDiasISO(hojeLocal(), -dias);
  return sessoes
    .filter(s => s.data >= limite)
    .sort((a, b) => b.data.localeCompare(a.data));
}

/** IDs de exercícios com ao menos um registro concluído. */
export function exerciciosComHistorico(sessoes: SessaoHistorico[]): Set<string> {
  const ids = new Set<string>();
  for (const s of sessoes) for (const i of s.itens) if (i.concluido) ids.add(i.exercicioId);
  return ids;
}

export function progressaoExercicio(sessoes: SessaoHistorico[], exercicioId: string, dias: number): PontoProgressao[] {
  const limite = addDiasISO(hojeLocal(), -dias);
  const pontos: PontoProgressao[] = [];
  const ordenadas = sessoes
    .filter(s => s.data >= limite)
    .sort((a, b) => a.data.localeCompare(b.data));

  for (const s of ordenadas) {
    const itens = s.itens.filter(i => i.exercicioId === exercicioId && i.concluido);
    if (itens.length === 0) continue;
    const cargaMax = Math.max(...itens.map(i => i.cargaKg ?? 0));
    const volumeTotal = itens.reduce((acc, i) => acc + volumeItem(i), 0);
    pontos.push({ data: s.data, cargaMax, volumeTotal });
  }
  return pontos;
}

/** Início da semana (segunda-feira) em AAAA-MM-DD local. */
export function inicioSemana(iso: string): string {
  const d = parseLocalISODate(iso);
  const offset = (d.getDay() + 6) % 7; // segunda = 0
  d.setDate(d.getDate() - offset);
  return toLocalISODate(d);
}

/** Resumo das últimas `semanas` semanas (inclui semanas sem treino, com zero). */
export function resumoSemanal(sessoes: SessaoHistorico[], semanas = 8): ResumoSemana[] {
  const mapa = new Map<string, { sessoes: number; volumeTotal: number }>();
  for (const s of sessoes) {
    const chave = inicioSemana(s.data);
    const atual = mapa.get(chave) ?? { sessoes: 0, volumeTotal: 0 };
    mapa.set(chave, { sessoes: atual.sessoes + 1, volumeTotal: atual.volumeTotal + volumeSessao(s) });
  }
  const atual = inicioSemana(hojeLocal());
  const out: ResumoSemana[] = [];
  for (let k = semanas - 1; k >= 0; k--) {
    const semana = addDiasISO(atual, -7 * k);
    out.push({ semana, ...(mapa.get(semana) ?? { sessoes: 0, volumeTotal: 0 }) });
  }
  return out;
}

/** Quantidade de semanas distintas com pelo menos um treino. */
export function semanasAtivas(sessoes: SessaoHistorico[]): number {
  return new Set(sessoes.map(s => inicioSemana(s.data))).size;
}

interface HistoricoState {
  sessoes: SessaoHistorico[];
  load: () => void;
  salvar: (sessao: SessaoDodia, fichaNome: string) => void;
  /** Use apenas fora de seletores (ex.: em handlers). Em componentes, prefira as funções puras + useMemo. */
  getProgressaoExercicio: (exercicioId: string, dias: number) => PontoProgressao[];
  getSessoesPorPeriodo: (dias: number) => SessaoHistorico[];
  getResumoSemanal: () => ResumoSemana[];
}

export const useHistoricoStore = create<HistoricoState>((set, get) => ({
  sessoes: read(),

  load() {
    set({ sessoes: read() });
  },

  salvar(sessao, fichaNome) {
    const hist = [...read()];
    const idx = hist.findIndex(s => s.id === sessao.id && s.data === sessao.data);
    const entry: SessaoHistorico = { ...sessao, fichaModeloNome: fichaNome };
    if (idx >= 0) hist[idx] = entry; else hist.push(entry);
    write(hist);
    set({ sessoes: hist });
  },

  getProgressaoExercicio: (exercicioId, dias) => progressaoExercicio(get().sessoes, exercicioId, dias),
  getSessoesPorPeriodo: dias => sessoesNoPeriodo(get().sessoes, dias),
  getResumoSemanal: () => resumoSemanal(get().sessoes),
}));
