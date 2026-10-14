import { hojeLocal } from './date';
import type { EsquemaSeries, FichaModelo, FichaModeloItem, SessaoDodia, SessaoItem } from './types';

export { musculos, exercicios, exercicioMusculos, gruposMusculares } from './catalogo';

function it(
  fichaId: string, id: string, exercicioId: string, ordem: number, series: number, reps: string,
  descansoSeg: number, esquema: EsquemaSeries, notas = '',
): FichaModeloItem {
  return { id, fichaId, exercicioId, ordem, series, reps, descansoSeg, notas, esquema };
}

const fichaAId = 'ficha_a';
const fichaBId = 'ficha_b';

export const fichasModelo: FichaModelo[] = [
  {
    id: fichaAId,
    nome: 'Treino A — Pernas e Glúteos',
    sigla: 'A',
    diaSemana: 1,
    itens: [
      it(fichaAId, 'fmi01', 'ex01', 0, 3, '12/10/8', 120, 'piramide'),
      it(fichaAId, 'fmi02', 'ex02', 1, 3, '12/10/8', 90, 'piramide'),
      it(fichaAId, 'fmi03', 'ex03', 2, 3, '10', 90, 'fixo', 'Cada perna'),
      it(fichaAId, 'fmi04', 'ex04', 3, 3, '12/10/8', 60, 'piramide'),
      it(fichaAId, 'fmi05', 'ex05', 4, 3, '12/10/8', 60, 'piramide'),
      it(fichaAId, 'fmi06', 'ex14', 5, 3, '12/10/8', 90, 'piramide'),
      it(fichaAId, 'fmi07', 'ex15', 6, 4, '15', 45, 'fixo'),
    ],
  },
  {
    id: fichaBId,
    nome: 'Treino B — Peito, Costas e Braços',
    sigla: 'B',
    diaSemana: 3,
    itens: [
      it(fichaBId, 'fmi08', 'ex06', 0, 3, '12/10/8', 120, 'piramide'),
      it(fichaBId, 'fmi09', 'ex07', 1, 3, '12/10/8', 90, 'piramide'),
      it(fichaBId, 'fmi10', 'ex08', 2, 3, '12/10/8', 90, 'piramide'),
      it(fichaBId, 'fmi11', 'ex09', 3, 3, '12/10/8', 90, 'piramide'),
      it(fichaBId, 'fmi12', 'ex10', 4, 3, '12/10/8', 90, 'piramide'),
      it(fichaBId, 'fmi13', 'ex11', 5, 3, '12/10/8', 60, 'piramide'),
      it(fichaBId, 'fmi14', 'ex12', 6, 3, '12/10/8', 60, 'piramide'),
      it(fichaBId, 'fmi15', 'ex13', 7, 3, '12/10/8', 60, 'piramide'),
    ],
  },
];

/** Letra curta da ficha para a linha do tempo (robusto a nomes livres). */
export function siglaDaFicha(ficha: Pick<FichaModelo, 'nome' | 'sigla'>): string {
  if (ficha.sigla?.trim()) return ficha.sigla.trim().slice(0, 2).toUpperCase();
  const m = ficha.nome.match(/treino\s+([a-z0-9]{1,2})\b/i);
  if (m) return m[1].toUpperCase();
  const first = ficha.nome.trim().charAt(0);
  return first ? first.toUpperCase() : 'T';
}

/**
 * Ficha do dia da semana; se não houver ficha agendada para hoje,
 * usa a próxima agendada na semana (ou a primeira cadastrada).
 */
export function fichaDoDia(fichas: FichaModelo[], dow: number = new Date().getDay()): FichaModelo | undefined {
  if (!fichas.length) return undefined;
  for (let k = 0; k < 7; k++) {
    const f = fichas.find(fi => fi.diaSemana === (dow + k) % 7);
    if (f) return f;
  }
  return fichas[0];
}

export function criarSessao(ficha: FichaModelo, data: string = hojeLocal()): SessaoDodia {
  const sessaoId = `sessao_${ficha.id}_${data}`;
  const itens: SessaoItem[] = [...ficha.itens]
    .sort((a, b) => a.ordem - b.ordem)
    .map((item: FichaModeloItem, i) => ({
      id: `si_${item.id}`,
      sessaoId,
      exercicioId: item.exercicioId,
      ordem: i,
      series: item.series,
      reps: item.reps,
      cargaKg: null,
      notas: item.notas,
      concluido: false,
      fichaItemId: item.id,
      descansoSeg: item.descansoSeg,
      esquema: item.esquema,
    }));
  return { id: sessaoId, fichaModeloId: ficha.id, data, status: 'pendente', itens };
}

/** Sessão vazia (quando não há nenhuma ficha cadastrada). */
export function sessaoVazia(data: string = hojeLocal()): SessaoDodia {
  return { id: `sessao_vazia_${data}`, fichaModeloId: '', data, status: 'pendente', itens: [] };
}

export function getSessaoHoje(fichas: FichaModelo[] = fichasModelo): SessaoDodia {
  const ficha = fichaDoDia(fichas);
  return ficha ? criarSessao(ficha) : sessaoVazia();
}

/* ---------------- Modelos prontos de ficha ---------------- */

export interface ModeloFicha {
  id: string;
  nome: string;
  descricao: string;
  fichas: { nome: string; sigla: string; diaSemana: number | null; itens: [string, number, string, number, EsquemaSeries][] }[];
}

/** [exercicioId, séries, reps, descanso (s), esquema] */
export const modelosFicha: ModeloFicha[] = [
  {
    id: 'fullbody',
    nome: 'Corpo inteiro (iniciante)',
    descricao: '1 treino para repetir 2–3x por semana, com exercícios em máquinas e halteres.',
    fichas: [
      { nome: 'Corpo inteiro', sigla: 'F', diaSemana: 1, itens: [
        ['ex55', 3, '12/10/8', 90, 'piramide'], ['ex25', 3, '12/10/8', 90, 'piramide'], ['ex09', 3, '12/10/8', 90, 'piramide'],
        ['ex56', 3, '12/10/8', 60, 'piramide'], ['ex34', 3, '12/10/8', 60, 'piramide'], ['ex27', 3, '12/10/8', 60, 'piramide'],
        ['ex66', 3, '30', 45, 'fixo'],
      ] },
    ],
  },
  {
    id: 'ab',
    nome: 'AB (superiores e inferiores)',
    descricao: '2 treinos alternados, 4x por semana.',
    fichas: [
      { nome: 'Treino A — Superiores', sigla: 'A', diaSemana: 1, itens: [
        ['ex18', 3, '12/10/8', 90, 'piramide'], ['ex27', 3, '12/10/8', 90, 'piramide'], ['ex07', 3, '12/10/8', 90, 'piramide'],
        ['ex09', 3, '12/10/8', 90, 'piramide'], ['ex11', 3, '12/10/8', 60, 'piramide'], ['ex41', 3, '12/10/8', 60, 'piramide'],
        ['ex48', 3, '12/10/8', 60, 'piramide'],
      ] },
      { nome: 'Treino B — Inferiores', sigla: 'B', diaSemana: 2, itens: [
        ['ex53', 3, '12/10/8', 120, 'piramide'], ['ex57', 3, '12/10/8', 90, 'piramide'], ['ex04', 3, '12/10/8', 60, 'piramide'],
        ['ex56', 3, '12/10/8', 60, 'piramide'], ['ex58', 3, '12/10/8', 60, 'piramide'], ['ex15', 4, '15', 45, 'fixo'],
        ['ex64', 3, '15', 45, 'fixo'],
      ] },
    ],
  },
  {
    id: 'abc',
    nome: 'ABC (empurrar, puxar, pernas)',
    descricao: '3 treinos em sequência, para quem já treina regularmente.',
    fichas: [
      { nome: 'Treino A — Peito, ombros e tríceps', sigla: 'A', diaSemana: 1, itens: [
        ['ex06', 3, '12/10/8', 120, 'piramide'], ['ex07', 3, '12/10/8', 90, 'piramide'], ['ex22', 3, '12/10/8', 60, 'piramide'],
        ['ex10', 3, '12/10/8', 90, 'piramide'], ['ex11', 3, '12/10/8', 60, 'piramide'], ['ex13', 3, '12/10/8', 60, 'piramide'],
        ['ex46', 3, '12/10/8', 60, 'piramide'],
      ] },
      { nome: 'Treino B — Costas e bíceps', sigla: 'B', diaSemana: 3, itens: [
        ['ex09', 3, '12/10/8', 90, 'piramide'], ['ex08', 3, '12/10/8', 120, 'piramide'], ['ex28', 3, '12/10/8', 90, 'piramide'],
        ['ex38', 3, '12/10/8', 60, 'piramide'], ['ex12', 3, '12/10/8', 60, 'piramide'], ['ex42', 3, '12/10/8', 60, 'piramide'],
      ] },
      { nome: 'Treino C — Pernas e abdômen', sigla: 'C', diaSemana: 5, itens: [
        ['ex01', 3, '12/10/8', 120, 'piramide'], ['ex02', 3, '12/10/8', 90, 'piramide'], ['ex04', 3, '12/10/8', 60, 'piramide'],
        ['ex05', 3, '12/10/8', 60, 'piramide'], ['ex57', 3, '12/10/8', 90, 'piramide'], ['ex15', 4, '15', 45, 'fixo'],
        ['ex65', 3, '12', 45, 'fixo'],
      ] },
    ],
  },
];

/** Cria fichas reais (com ids novos) a partir de um modelo. */
export function instanciarModelo(modelo: ModeloFicha, sufixo: string): FichaModelo[] {
  return modelo.fichas.map((f, fi) => {
    const fichaId = `ficha_${modelo.id}_${fi}_${sufixo}`;
    return {
      id: fichaId,
      nome: f.nome,
      sigla: f.sigla,
      diaSemana: f.diaSemana,
      itens: f.itens.map(([exercicioId, series, reps, descansoSeg, esquema], i) =>
        it(fichaId, `${fichaId}_i${i}`, exercicioId, i, series, reps, descansoSeg, esquema)),
    };
  });
}
