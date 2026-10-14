import type { EsquemaSeries, Exercicio, SerieLog, SessaoItem } from '../data/types';
import { incrementoCarga } from '../data/catalogo';
import type { PerfilFisico } from '../hooks/usePerfilStore';

/*
 * Progressão de carga do Folio.
 * Esquema padrão: pirâmide 12 / 10 / 8 repetições, aumentando a carga a cada série,
 * levando cada série até perto da falha. Quando a série de 12 fica "leve"
 * (sobram 3+ repetições), o app sugere subir a carga — dupla progressão.
 * Todas as estimativas são referências gerais, não prescrição.
 */

export const PIRAMIDE = [12, 10, 8];

/** Esquema efetivo de um item (padrão: pirâmide; isométricos usam fixo). */
export function esquemaDe(item: Pick<SessaoItem, 'esquema'>, ex?: Exercicio): EsquemaSeries {
  if (ex?.isometrico) return 'fixo';
  return item.esquema ?? 'piramide';
}

/** Repetições-alvo de cada série. */
export function alvosDe(series: number, reps: string, esquema: EsquemaSeries): number[] {
  const n = Math.max(1, Math.min(10, Math.round(series) || 1));
  if (esquema === 'piramide') {
    return Array.from({ length: n }, (_, i) => PIRAMIDE[Math.min(i, PIRAMIDE.length - 1)]);
  }
  const m = String(reps ?? '').match(/\d+/);
  const alvo = m ? Math.max(1, parseInt(m[0], 10)) : 12;
  return Array.from({ length: n }, () => alvo);
}

/** Texto curto de reps para listas: "12/10/8" ou "15". */
export function repsResumo(series: number, reps: string, esquema: EsquemaSeries): string {
  const alvos = alvosDe(series, reps, esquema);
  return esquema === 'piramide' ? alvos.join('/') : String(alvos[0]);
}

/** Garante um registro por série, preservando o que já foi anotado. */
export function garantirLog(item: SessaoItem, ex?: Exercicio): SerieLog[] {
  const alvos = alvosDe(item.series, item.reps, esquemaDe(item, ex));
  const atual = item.seriesLog ?? [];
  return alvos.map((alvo, i) => {
    const s = atual[i];
    return s ? { ...s, alvo } : { alvo, reps: null, cargaKg: i === 0 ? item.cargaKg : null, esforco: null, feita: false };
  });
}

/** 1RM estimado (Epley). Limitado a 15 reps para não superestimar. */
export function e1rm(carga: number, reps: number): number {
  if (!carga || !reps) return 0;
  const r = Math.min(15, reps);
  return r === 1 ? carga : carga * (1 + r / 30);
}

/** Carga para fazer `reps` repetições a partir de um 1RM estimado. */
export function cargaParaReps(rm: number, reps: number): number {
  return rm / (1 + Math.min(15, reps) / 30);
}

export function arredondar(carga: number, inc: number, modo: 'baixo' | 'perto' = 'perto'): number {
  if (inc <= 0) return Math.round(carga * 2) / 2;
  const f = modo === 'baixo' ? Math.floor : Math.round;
  return Math.max(inc, f(carga / inc) * inc);
}

export type TipoSugestao = 'subir' | 'manter' | 'reduzir' | 'estimada' | 'perfil' | 'nenhuma';
export interface Sugestao { cargaKg: number | null; tipo: TipoSugestao; texto: string }

const kg = (n: number) => `${String(Math.round(n * 10) / 10).replace('.', ',')} kg`;

const FATOR_EXPERIENCIA: Record<NonNullable<PerfilFisico['experiencia']>, number> = {
  nunca: 0.6, iniciante: 0.8, voltando: 0.9, treina: 1.15,
};

function fatorIdade(idade: number | null): number {
  if (!idade) return 1;
  if (idade < 18) return 0.8;
  if (idade >= 70) return 0.65;
  if (idade >= 60) return 0.75;
  if (idade >= 50) return 0.85;
  return 1;
}

/** 1RM de referência pelo perfil (peso corporal × razão do exercício). Grosseiro de propósito. */
export function rmPeloPerfil(ex: Exercicio, perfil: PerfilFisico): number | null {
  if (!ex.ref1RM || !perfil.pesoKg) return null;
  const [m, f] = ex.ref1RM;
  const razao = perfil.sexo === 'masculino' ? m : perfil.sexo === 'feminino' ? f : (m + f) / 2;
  const exp = perfil.experiencia ? FATOR_EXPERIENCIA[perfil.experiencia] : 0.8;
  return perfil.pesoKg * razao * exp * fatorIdade(perfil.idade);
}

/**
 * Sugere a carga de uma série.
 * @param anteriores logs das sessões anteriores deste exercício (mais recente primeiro)
 * @param hoje       séries já anotadas hoje
 */
export function sugerirCarga(
  ex: Exercicio, idx: number, alvo: number, anteriores: SerieLog[][], hoje: SerieLog[], perfil: PerfilFisico,
): Sugestao {
  const inc = incrementoCarga[ex.equipamento];
  if (ex.isometrico) return { cargaKg: null, tipo: 'nenhuma', texto: `Segure ${alvo} segundos com boa postura. Quando ficar fácil, aumente o tempo.` };
  if (inc === 0) {
    return { cargaKg: null, tipo: 'nenhuma', texto: 'Peso corporal: quando completar as repetições com folga, faça mais repetições ou uma variação mais difícil.' };
  }

  // 1) Mesma série na última sessão em que houve carga registrada.
  for (const sessao of anteriores) {
    const s = sessao[idx] ?? sessao.find(x => x.alvo === alvo);
    if (!s || !s.feita || !s.cargaKg) continue;
    const reps = s.reps ?? s.alvo;
    const c = s.cargaKg;
    if (reps >= s.alvo && s.esforco === 'leve') {
      const nova = arredondar(c + inc, inc);
      return { cargaKg: nova, tipo: 'subir', texto: `Na última vez ${reps} reps com ${kg(c)} ficaram leves. Suba para ${kg(nova)}.` };
    }
    if (reps >= s.alvo) {
      return { cargaKg: c, tipo: 'manter', texto: `Repita ${kg(c)} levando a série até perto da falha. Quando ficar leve, o Folio sugere subir.` };
    }
    if (reps < s.alvo - 2) {
      const nova = Math.max(inc, arredondar(c - inc, inc));
      return { cargaKg: nova, tipo: 'reduzir', texto: `Você fez ${reps} de ${s.alvo} reps com ${kg(c)}. Reduza para ${kg(nova)} e complete as ${s.alvo}.` };
    }
    return { cargaKg: c, tipo: 'manter', texto: `Quase lá: mantenha ${kg(c)} até completar as ${s.alvo} reps.` };
  }

  // 2) Estimativa a partir de outras séries (de hoje ou da última sessão).
  const fontes = [...hoje.filter((s, i) => i !== idx), ...(anteriores[0] ?? [])]
    .filter(s => s.feita && s.cargaKg && (s.reps ?? s.alvo) > 0);
  if (fontes.length) {
    const rm = Math.max(...fontes.map(s => e1rm(s.cargaKg!, s.reps ?? s.alvo)));
    const carga = arredondar(cargaParaReps(rm, alvo), inc, 'baixo');
    return { cargaKg: carga, tipo: 'estimada', texto: `Estimativa pelas outras séries para ${alvo} reps.` };
  }

  // 3) Primeira vez: estimativa pelo perfil.
  const rmPerfil = rmPeloPerfil(ex, perfil);
  if (rmPerfil) {
    const carga = arredondar(cargaParaReps(rmPerfil, alvo) * 0.9, inc, 'baixo');
    return { cargaKg: carga, tipo: 'perfil', texto: 'Sugestão inicial pelo seu perfil. Comece leve e ajuste conforme a execução.' };
  }
  return { cargaKg: null, tipo: 'nenhuma', texto: `Escolha uma carga que permita ${alvo} repetições com boa técnica, chegando perto da falha.` };
}

/* ---------------- Histórico, recordes e projeção ---------------- */

export interface PontoCarga { data: string; rm: number; cargaMax: number; carga12: number }

/** Séries feitas de um item (registro novo ou formato antigo de carga única). */
export function seriesFeitas(item: SessaoItem): SerieLog[] {
  if (item.seriesLog?.length) return item.seriesLog.filter(s => s.feita);
  if (item.concluido && item.cargaKg) {
    const m = String(item.reps).match(/\d+/);
    const reps = m ? parseInt(m[0], 10) : 10;
    return Array.from({ length: item.series }, () => ({ alvo: reps, reps, cargaKg: item.cargaKg, esforco: null, feita: true }));
  }
  return [];
}

export function pontoDaSessao(data: string, series: SerieLog[]): PontoCarga | null {
  const validas = series.filter(s => s.cargaKg && (s.reps ?? s.alvo) > 0);
  if (!validas.length) return null;
  const rm = Math.max(...validas.map(s => e1rm(s.cargaKg!, s.reps ?? s.alvo)));
  return {
    data,
    rm,
    cargaMax: Math.max(...validas.map(s => s.cargaKg!)),
    carga12: cargaParaReps(rm, 12),
  };
}

export interface Recordes { cargaMax: number; rm: number; dataCarga: string; dataRm: string }

export function recordes(pontos: PontoCarga[]): Recordes | null {
  if (!pontos.length) return null;
  let r: Recordes = { cargaMax: 0, rm: 0, dataCarga: '', dataRm: '' };
  for (const p of pontos) {
    if (p.cargaMax > r.cargaMax) r = { ...r, cargaMax: p.cargaMax, dataCarga: p.data };
    if (p.rm > r.rm) r = { ...r, rm: p.rm, dataRm: p.data };
  }
  return r;
}

/** Ganho semanal típico (fração) pela experiência, idade e tempo de projeção. */
function taxaSemanal(perfil: PerfilFisico, semana: number): number {
  const base = perfil.experiencia === 'treina' ? 0.0075
    : perfil.experiencia === 'voltando' ? 0.025
    : perfil.experiencia === 'nunca' ? 0.03
    : perfil.experiencia === 'iniciante' ? 0.02
    : 0.015;
  const idade = perfil.idade ?? 30;
  const fIdade = idade >= 55 ? 0.6 : idade >= 40 ? 0.8 : 1;
  // Ganhos iniciais são mais rápidos e desaceleram com o tempo.
  const desacel = semana > 8 ? 0.5 : 1;
  return base * fIdade * desacel;
}

/** Projeção da carga para 12 repetições nas próximas semanas (estimativa, não meta). */
export function projecao(carga12Atual: number, perfil: PerfilFisico, semanas = 12): { semana: number; carga12: number }[] {
  const out = [{ semana: 0, carga12: carga12Atual }];
  let c = carga12Atual;
  for (let s = 1; s <= semanas; s++) {
    c = c * (1 + taxaSemanal(perfil, s));
    out.push({ semana: s, carga12: c });
  }
  return out;
}
