import type { Musculo, Exercicio, ExercicioMusculo, FichaModelo, SessaoDodia, SessaoItem, HomeBlocoConfig } from './types';
import { musculos, exercicios, exercicioMusculos, fichasModelo, getSessaoHoje } from './seed';

const LS_HOME = 'folio_home_blocos';
const LS_SESSAO = 'folio_sessao_hoje';
const LS_FICHAS = 'folio_fichas';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function write<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export const repo = {
  getMusculos(): Musculo[] { return musculos; },
  getExercicios(): Exercicio[] { return exercicios; },
  getExercicio(id: string): Exercicio | undefined { return exercicios.find(e => e.id === id); },
  getMusculosDoExercicio(exId: string): (ExercicioMusculo & { musculo: Musculo })[] {
    return exercicioMusculos
      .filter(em => em.exercicioId === exId)
      .map(em => ({ ...em, musculo: musculos.find(m => m.id === em.musculoId)! }));
  },
  getExerciciosDoMusculo(mId: string): (ExercicioMusculo & { exercicio: Exercicio })[] {
    return exercicioMusculos
      .filter(em => em.musculoId === mId)
      .map(em => ({ ...em, exercicio: exercicios.find(e => e.id === em.exercicioId)! }));
  },

  getFichas(): FichaModelo[] {
    return read(LS_FICHAS, fichasModelo);
  },
  salvarFichas(fichas: FichaModelo[]) {
    write(LS_FICHAS, fichas);
  },

  getSessaoHoje(): SessaoDodia {
    const saved = read<SessaoDodia | null>(LS_SESSAO, null);
    if (saved && saved.data === new Date().toISOString().slice(0, 10)) return saved;
    const nova = getSessaoHoje();
    write(LS_SESSAO, nova);
    return nova;
  },
  salvarSessao(sessao: SessaoDodia) {
    write(LS_SESSAO, sessao);
  },

  getHomeBlocos(): HomeBlocoConfig[] {
    return read<HomeBlocoConfig[]>(LS_HOME, [
      { tipo: 'treino_do_dia', visivel: true },
      { tipo: 'linha_do_tempo', visivel: true },
      { tipo: 'pilula_cientifica', visivel: true },
      { tipo: 'atalhos_mapa', visivel: true },
    ]);
  },
  salvarHomeBlocos(blocos: HomeBlocoConfig[]) {
    write(LS_HOME, blocos);
  },
};
