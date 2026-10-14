import type { Musculo, Exercicio, ExercicioMusculo, FichaModelo, SessaoDodia, HomeBlocoConfig } from './types';
import { musculos, exercicios, exercicioMusculos, fichasModelo, getSessaoHoje } from './seed';
import { hojeLocal } from './date';

const LS_HOME = 'folio_home_blocos';
const LS_SESSAO = 'folio_sessao_hoje';
const LS_FICHAS = 'folio_fichas';

const HOME_PADRAO: HomeBlocoConfig[] = [
  { tipo: 'treino_do_dia', visivel: true },
  { tipo: 'linha_do_tempo', visivel: true },
  { tipo: 'pilula_cientifica', visivel: true },
  { tipo: 'atalhos_mapa', visivel: true },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function write<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* armazenamento cheio ou bloqueado: segue só em memória */ }
}

/**
 * Repositório de dados (mock em localStorage).
 * Interface estável para trocar por Supabase depois sem mexer nas telas.
 */
export const repo = {
  getMusculos(): Musculo[] { return musculos; },
  getExercicios(): Exercicio[] { return exercicios; },
  getExercicio(id: string): Exercicio | undefined { return exercicios.find(e => e.id === id); },
  getMusculosDoExercicio(exId: string): (ExercicioMusculo & { musculo: Musculo })[] {
    return exercicioMusculos
      .filter(em => em.exercicioId === exId)
      .map(em => ({ ...em, musculo: musculos.find(m => m.id === em.musculoId) }))
      .filter((em): em is ExercicioMusculo & { musculo: Musculo } => !!em.musculo);
  },
  getExerciciosDoMusculo(mId: string): (ExercicioMusculo & { exercicio: Exercicio })[] {
    return exercicioMusculos
      .filter(em => em.musculoId === mId)
      .map(em => ({ ...em, exercicio: exercicios.find(e => e.id === em.exercicioId) }))
      .filter((em): em is ExercicioMusculo & { exercicio: Exercicio } => !!em.exercicio);
  },

  getFichas(): FichaModelo[] {
    const fichas = read<FichaModelo[]>(LS_FICHAS, fichasModelo);
    return Array.isArray(fichas) ? fichas : fichasModelo;
  },
  salvarFichas(fichas: FichaModelo[]) {
    write(LS_FICHAS, fichas);
  },

  /** Sessão de hoje — compara com a data LOCAL (não UTC). */
  getSessaoHoje(): SessaoDodia {
    const saved = read<SessaoDodia | null>(LS_SESSAO, null);
    if (saved && Array.isArray(saved.itens) && saved.data === hojeLocal()) return saved;
    const nova = getSessaoHoje(repo.getFichas());
    write(LS_SESSAO, nova);
    return nova;
  },
  salvarSessao(sessao: SessaoDodia) {
    write(LS_SESSAO, sessao);
  },

  getHomeBlocos(): HomeBlocoConfig[] {
    const blocos = read<HomeBlocoConfig[]>(LS_HOME, HOME_PADRAO);
    return Array.isArray(blocos) ? blocos : HOME_PADRAO;
  },
  salvarHomeBlocos(blocos: HomeBlocoConfig[]) {
    write(LS_HOME, blocos);
  },
};
