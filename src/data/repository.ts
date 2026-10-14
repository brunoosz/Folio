import type {
  Exercicio, ExercicioMusculo, FichaModelo, GrupoMuscular, GrupoMuscularId, HomeBlocoConfig, Musculo, MusculoPapel, SessaoDodia,
} from './types';
import { musculos, exercicios as exerciciosBase, exercicioMusculos as relacoesBase, gruposMusculares, fichasModelo, getSessaoHoje } from './seed';
import { hojeLocal } from './date';

const LS_HOME = 'folio_home_blocos';
const LS_SESSAO = 'folio_sessao_hoje';
const LS_FICHAS = 'folio_fichas';
const LS_CATALOGO = 'folio_catalogo';

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

/** Alterações do admin sobre o catálogo base (mock local; vira tabela no Supabase). */
interface CatalogoLocal {
  extras: Exercicio[];
  relacoesExtras: ExercicioMusculo[];
  /** Campos editados de exercícios do catálogo base. */
  editados: Record<string, Partial<Exercicio>>;
  /** Relações substituídas de exercícios do catálogo base. */
  relacoesEditadas: Record<string, ExercicioMusculo[]>;
}

const CATALOGO_VAZIO: CatalogoLocal = { extras: [], relacoesExtras: [], editados: {}, relacoesEditadas: {} };

let cache: { exercicios: Exercicio[]; relacoes: ExercicioMusculo[] } | null = null;

function catalogoLocal(): CatalogoLocal {
  const c = read<CatalogoLocal>(LS_CATALOGO, CATALOGO_VAZIO);
  return { ...CATALOGO_VAZIO, ...c };
}

function montarCatalogo() {
  if (cache) return cache;
  const c = catalogoLocal();
  const exercicios = [
    ...exerciciosBase.map(e => (c.editados[e.id] ? { ...e, ...c.editados[e.id], id: e.id } : e)),
    ...c.extras,
  ];
  const editadas = new Set(Object.keys(c.relacoesEditadas));
  const relacoes = [
    ...relacoesBase.filter(r => !editadas.has(r.exercicioId)),
    ...Object.values(c.relacoesEditadas).flat(),
    ...c.relacoesExtras,
  ];
  cache = { exercicios, relacoes };
  return cache;
}

function salvarCatalogo(c: CatalogoLocal) {
  write(LS_CATALOGO, c);
  cache = null;
}

const ORDEM_PAPEL: Record<MusculoPapel, number> = { primario: 0, secundario: 1, estabilizador: 2 };

/**
 * Repositório de dados (mock em localStorage).
 * Interface estável para trocar por Supabase depois sem mexer nas telas.
 */
export const repo = {
  getGrupos(): GrupoMuscular[] { return gruposMusculares; },
  getGrupo(id: string): GrupoMuscular | undefined { return gruposMusculares.find(g => g.id === id); },
  getMusculos(): Musculo[] { return musculos; },
  getMusculo(id: string): Musculo | undefined { return musculos.find(m => m.id === id); },
  getMusculosDoGrupo(grupo: GrupoMuscularId): Musculo[] { return musculos.filter(m => m.grupo === grupo); },

  getExercicios(): Exercicio[] { return montarCatalogo().exercicios; },
  getExercicio(id: string): Exercicio | undefined { return montarCatalogo().exercicios.find(e => e.id === id); },

  getMusculosDoExercicio(exId: string): (ExercicioMusculo & { musculo: Musculo })[] {
    return montarCatalogo().relacoes
      .filter(em => em.exercicioId === exId)
      .map(em => ({ ...em, musculo: musculos.find(m => m.id === em.musculoId) }))
      .filter((em): em is ExercicioMusculo & { musculo: Musculo } => !!em.musculo)
      .sort((a, b) => ORDEM_PAPEL[a.papel] - ORDEM_PAPEL[b.papel]);
  },

  /** Grupos trabalhados pelo exercício, com o papel mais forte em cada grupo. */
  getGruposDoExercicio(exId: string): { grupo: GrupoMuscularId; papel: MusculoPapel }[] {
    const melhor = new Map<GrupoMuscularId, MusculoPapel>();
    for (const em of repo.getMusculosDoExercicio(exId)) {
      const atual = melhor.get(em.musculo.grupo);
      if (!atual || ORDEM_PAPEL[em.papel] < ORDEM_PAPEL[atual]) melhor.set(em.musculo.grupo, em.papel);
    }
    return [...melhor.entries()].map(([grupo, papel]) => ({ grupo, papel }));
  },

  getExerciciosDoMusculo(mId: string): (ExercicioMusculo & { exercicio: Exercicio })[] {
    const { exercicios, relacoes } = montarCatalogo();
    return relacoes
      .filter(em => em.musculoId === mId)
      .map(em => ({ ...em, exercicio: exercicios.find(e => e.id === em.exercicioId) }))
      .filter((em): em is ExercicioMusculo & { exercicio: Exercicio } => !!em.exercicio)
      .sort((a, b) => ORDEM_PAPEL[a.papel] - ORDEM_PAPEL[b.papel]);
  },

  /** Exercícios de um grupo (papel mais forte entre as sub-regiões do grupo). */
  getExerciciosDoGrupo(grupo: GrupoMuscularId): { exercicio: Exercicio; papel: MusculoPapel; musculoIds: string[] }[] {
    const ids = new Set(musculos.filter(m => m.grupo === grupo).map(m => m.id));
    const { exercicios, relacoes } = montarCatalogo();
    const mapa = new Map<string, { papel: MusculoPapel; musculoIds: string[] }>();
    for (const r of relacoes) {
      if (!ids.has(r.musculoId)) continue;
      const atual = mapa.get(r.exercicioId);
      if (!atual) mapa.set(r.exercicioId, { papel: r.papel, musculoIds: [r.musculoId] });
      else {
        atual.musculoIds.push(r.musculoId);
        if (ORDEM_PAPEL[r.papel] < ORDEM_PAPEL[atual.papel]) atual.papel = r.papel;
      }
    }
    const out: { exercicio: Exercicio; papel: MusculoPapel; musculoIds: string[] }[] = [];
    for (const [exId, v] of mapa) {
      const exercicio = exercicios.find(e => e.id === exId);
      if (exercicio) out.push({ exercicio, ...v });
    }
    return out.sort((a, b) => ORDEM_PAPEL[a.papel] - ORDEM_PAPEL[b.papel] || a.exercicio.nome.localeCompare(b.exercicio.nome, 'pt-BR'));
  },

  /* ---- Edição do catálogo (admin) ---- */
  salvarExercicio(ex: Exercicio, relacoes: Omit<ExercicioMusculo, 'exercicioId'>[]) {
    const c = catalogoLocal();
    const rel = relacoes.map(r => ({ ...r, exercicioId: ex.id }));
    if (exerciciosBase.some(e => e.id === ex.id)) {
      c.editados = { ...c.editados, [ex.id]: ex };
      c.relacoesEditadas = { ...c.relacoesEditadas, [ex.id]: rel };
    } else {
      c.extras = [...c.extras.filter(e => e.id !== ex.id), { ...ex, personalizado: true }];
      c.relacoesExtras = [...c.relacoesExtras.filter(r => r.exercicioId !== ex.id), ...rel];
    }
    salvarCatalogo(c);
  },
  marcarRevisado(id: string, revisado: boolean) {
    const c = catalogoLocal();
    if (exerciciosBase.some(e => e.id === id)) {
      c.editados = { ...c.editados, [id]: { ...(c.editados[id] ?? {}), revisado } };
    } else {
      c.extras = c.extras.map(e => (e.id === id ? { ...e, revisado } : e));
    }
    salvarCatalogo(c);
  },
  /** Remove um exercício criado pelo admin, ou desfaz as edições de um exercício base. */
  removerOuRestaurarExercicio(id: string) {
    const c = catalogoLocal();
    if (exerciciosBase.some(e => e.id === id)) {
      const editados = { ...c.editados };
      const relacoesEditadas = { ...c.relacoesEditadas };
      delete editados[id];
      delete relacoesEditadas[id];
      c.editados = editados;
      c.relacoesEditadas = relacoesEditadas;
    } else {
      c.extras = c.extras.filter(e => e.id !== id);
      c.relacoesExtras = c.relacoesExtras.filter(r => r.exercicioId !== id);
    }
    salvarCatalogo(c);
  },
  ehExercicioBase(id: string) { return exerciciosBase.some(e => e.id === id); },
  exercicioFoiEditado(id: string) { return !!catalogoLocal().editados[id]; },

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
