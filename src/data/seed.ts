import { hojeLocal } from './date';
import type { Musculo, Exercicio, ExercicioMusculo, FichaModelo, FichaModeloItem, SessaoDodia, SessaoItem } from './types';

export const musculos: Musculo[] = [
  { id: 'quadriceps', nome: 'Quadríceps', grupo: 'pernas', regiao: 'anterior' },
  { id: 'gluteos', nome: 'Glúteos', grupo: 'pernas', regiao: 'posterior' },
  { id: 'isquiotibiais', nome: 'Isquiotibiais', grupo: 'pernas', regiao: 'posterior' },
  { id: 'adutores', nome: 'Adutores', grupo: 'pernas', regiao: 'anterior' },
  { id: 'panturrilha', nome: 'Panturrilha', grupo: 'pernas', regiao: 'posterior' },
  { id: 'peitoral_maior', nome: 'Peitoral Maior', grupo: 'peito', regiao: 'anterior' },
  { id: 'deltoide_anterior', nome: 'Deltóide Anterior', grupo: 'ombros', regiao: 'anterior' },
  { id: 'deltoide_lateral', nome: 'Deltóide Lateral', grupo: 'ombros', regiao: 'anterior' },
  { id: 'deltoide_posterior', nome: 'Deltóide Posterior', grupo: 'ombros', regiao: 'posterior' },
  { id: 'trapezio', nome: 'Trapézio', grupo: 'costas', regiao: 'posterior' },
  { id: 'grande_dorsal', nome: 'Grande Dorsal', grupo: 'costas', regiao: 'posterior' },
  { id: 'romboides', nome: 'Rombóides', grupo: 'costas', regiao: 'posterior' },
  { id: 'biceps', nome: 'Bíceps', grupo: 'bracos', regiao: 'anterior' },
  { id: 'triceps', nome: 'Tríceps', grupo: 'bracos', regiao: 'posterior' },
  { id: 'abdominais', nome: 'Abdominais', grupo: 'core', regiao: 'anterior' },
  { id: 'eretores_espinha', nome: 'Eretores da Espinha', grupo: 'core', regiao: 'posterior' },
  { id: 'obliquos', nome: 'Oblíquos', grupo: 'core', regiao: 'anterior' },
];

export const exercicios: Exercicio[] = [
  { id: 'ex01', nome: 'Agachamento Livre', equipamento: 'barra_livre', dificuldade: 'avancado', notasSeguranca: 'Manter coluna neutra. Joelhos alinhados com os pés. A revisar por profissional.', revisado: false },
  { id: 'ex02', nome: 'Leg Press 45°', equipamento: 'maquina', dificuldade: 'basico', notasSeguranca: 'Não travar os joelhos na extensão. Costas apoiadas no encosto. A revisar por profissional.', revisado: false },
  { id: 'ex03', nome: 'Agachamento Búlgaro', equipamento: 'haltere', dificuldade: 'intermediario', notasSeguranca: 'Manter o tronco ereto. Pé de trás elevado em banco. A revisar por profissional.', revisado: false },
  { id: 'ex04', nome: 'Cadeira Extensora', equipamento: 'maquina', dificuldade: 'basico', notasSeguranca: 'Ajustar eixo da máquina ao joelho. Movimento controlado. A revisar por profissional.', revisado: false },
  { id: 'ex05', nome: 'Mesa Flexora', equipamento: 'maquina', dificuldade: 'basico', notasSeguranca: 'Quadris apoiados. Não usar impulso. A revisar por profissional.', revisado: false },
  { id: 'ex06', nome: 'Supino Reto com Barra', equipamento: 'barra_livre', dificuldade: 'intermediario', notasSeguranca: 'Escápulas retraídas. Pés firmes no chão. Usar safety bars. A revisar por profissional.', revisado: false },
  { id: 'ex07', nome: 'Supino Inclinado com Halteres', equipamento: 'haltere', dificuldade: 'intermediario', notasSeguranca: 'Inclinação de 30–45°. Cotovelos a ~75°. A revisar por profissional.', revisado: false },
  { id: 'ex08', nome: 'Remada Curvada', equipamento: 'barra_livre', dificuldade: 'intermediario', notasSeguranca: 'Coluna neutra com leve flexão de quadril. Puxar em direção ao umbigo. A revisar por profissional.', revisado: false },
  { id: 'ex09', nome: 'Puxada Frontal', equipamento: 'cabo', dificuldade: 'basico', notasSeguranca: 'Não puxar atrás da nuca. Controlar a fase excêntrica. A revisar por profissional.', revisado: false },
  { id: 'ex10', nome: 'Desenvolvimento com Halteres', equipamento: 'haltere', dificuldade: 'intermediario', notasSeguranca: 'Não arquear as costas. Subir até extensão sem travar. A revisar por profissional.', revisado: false },
  { id: 'ex11', nome: 'Elevação Lateral', equipamento: 'haltere', dificuldade: 'basico', notasSeguranca: 'Cotovelos levemente flexionados. Não elevar acima da linha do ombro. A revisar por profissional.', revisado: false },
  { id: 'ex12', nome: 'Rosca Direta com Barra', equipamento: 'barra_livre', dificuldade: 'basico', notasSeguranca: 'Cotovelos fixos ao lado do corpo. Sem balanço. A revisar por profissional.', revisado: false },
  { id: 'ex13', nome: 'Tríceps Corda no Cabo', equipamento: 'cabo', dificuldade: 'basico', notasSeguranca: 'Cotovelos fixos. Abrir a corda no final do movimento. A revisar por profissional.', revisado: false },
  { id: 'ex14', nome: 'Stiff', equipamento: 'barra_livre', dificuldade: 'avancado', notasSeguranca: 'Coluna neutra obrigatória. Joelhos levemente flexionados. Não arredondar as costas. A revisar por profissional.', revisado: false },
  { id: 'ex15', nome: 'Panturrilha em Pé na Máquina', equipamento: 'maquina', dificuldade: 'basico', notasSeguranca: 'Amplitude completa. Não quicar no final do movimento. A revisar por profissional.', revisado: false },
];

export const exercicioMusculos: ExercicioMusculo[] = [
  { exercicioId: 'ex01', musculoId: 'quadriceps', papel: 'primario' },
  { exercicioId: 'ex01', musculoId: 'gluteos', papel: 'primario' },
  { exercicioId: 'ex01', musculoId: 'isquiotibiais', papel: 'secundario' },
  { exercicioId: 'ex01', musculoId: 'eretores_espinha', papel: 'estabilizador' },
  { exercicioId: 'ex01', musculoId: 'abdominais', papel: 'estabilizador' },

  { exercicioId: 'ex02', musculoId: 'quadriceps', papel: 'primario' },
  { exercicioId: 'ex02', musculoId: 'gluteos', papel: 'secundario' },
  { exercicioId: 'ex02', musculoId: 'isquiotibiais', papel: 'secundario' },

  { exercicioId: 'ex03', musculoId: 'quadriceps', papel: 'primario' },
  { exercicioId: 'ex03', musculoId: 'gluteos', papel: 'primario' },
  { exercicioId: 'ex03', musculoId: 'abdominais', papel: 'estabilizador' },

  { exercicioId: 'ex04', musculoId: 'quadriceps', papel: 'primario' },

  { exercicioId: 'ex05', musculoId: 'isquiotibiais', papel: 'primario' },
  { exercicioId: 'ex05', musculoId: 'gluteos', papel: 'secundario' },

  { exercicioId: 'ex06', musculoId: 'peitoral_maior', papel: 'primario' },
  { exercicioId: 'ex06', musculoId: 'triceps', papel: 'secundario' },
  { exercicioId: 'ex06', musculoId: 'deltoide_anterior', papel: 'secundario' },

  { exercicioId: 'ex07', musculoId: 'peitoral_maior', papel: 'primario' },
  { exercicioId: 'ex07', musculoId: 'deltoide_anterior', papel: 'secundario' },
  { exercicioId: 'ex07', musculoId: 'triceps', papel: 'secundario' },

  { exercicioId: 'ex08', musculoId: 'grande_dorsal', papel: 'primario' },
  { exercicioId: 'ex08', musculoId: 'romboides', papel: 'secundario' },
  { exercicioId: 'ex08', musculoId: 'trapezio', papel: 'secundario' },
  { exercicioId: 'ex08', musculoId: 'biceps', papel: 'secundario' },
  { exercicioId: 'ex08', musculoId: 'eretores_espinha', papel: 'estabilizador' },

  { exercicioId: 'ex09', musculoId: 'grande_dorsal', papel: 'primario' },
  { exercicioId: 'ex09', musculoId: 'biceps', papel: 'secundario' },
  { exercicioId: 'ex09', musculoId: 'romboides', papel: 'secundario' },

  { exercicioId: 'ex10', musculoId: 'deltoide_anterior', papel: 'primario' },
  { exercicioId: 'ex10', musculoId: 'deltoide_lateral', papel: 'secundario' },
  { exercicioId: 'ex10', musculoId: 'triceps', papel: 'secundario' },

  { exercicioId: 'ex11', musculoId: 'deltoide_lateral', papel: 'primario' },
  { exercicioId: 'ex11', musculoId: 'trapezio', papel: 'estabilizador' },

  { exercicioId: 'ex12', musculoId: 'biceps', papel: 'primario' },
  { exercicioId: 'ex12', musculoId: 'deltoide_anterior', papel: 'estabilizador' },

  { exercicioId: 'ex13', musculoId: 'triceps', papel: 'primario' },

  { exercicioId: 'ex14', musculoId: 'isquiotibiais', papel: 'primario' },
  { exercicioId: 'ex14', musculoId: 'gluteos', papel: 'primario' },
  { exercicioId: 'ex14', musculoId: 'eretores_espinha', papel: 'secundario' },

  { exercicioId: 'ex15', musculoId: 'panturrilha', papel: 'primario' },
];

const fichaAId = 'ficha_a';
const fichaBId = 'ficha_b';

export const fichasModelo: FichaModelo[] = [
  {
    id: fichaAId,
    nome: 'Treino A — Pernas e Glúteos',
    sigla: 'A',
    diaSemana: 1,
    itens: [
      { id: 'fmi01', fichaId: fichaAId, exercicioId: 'ex01', ordem: 0, series: 4, reps: '8-10', descansoSeg: 120, notas: '' },
      { id: 'fmi02', fichaId: fichaAId, exercicioId: 'ex02', ordem: 1, series: 3, reps: '12', descansoSeg: 90, notas: '' },
      { id: 'fmi03', fichaId: fichaAId, exercicioId: 'ex03', ordem: 2, series: 3, reps: '10 (cada perna)', descansoSeg: 90, notas: '' },
      { id: 'fmi04', fichaId: fichaAId, exercicioId: 'ex04', ordem: 3, series: 3, reps: '12-15', descansoSeg: 60, notas: '' },
      { id: 'fmi05', fichaId: fichaAId, exercicioId: 'ex05', ordem: 4, series: 3, reps: '12', descansoSeg: 60, notas: '' },
      { id: 'fmi06', fichaId: fichaAId, exercicioId: 'ex14', ordem: 5, series: 3, reps: '10', descansoSeg: 90, notas: '' },
      { id: 'fmi07', fichaId: fichaAId, exercicioId: 'ex15', ordem: 6, series: 4, reps: '15', descansoSeg: 45, notas: '' },
    ],
  },
  {
    id: fichaBId,
    nome: 'Treino B — Peito, Costas e Braços',
    sigla: 'B',
    diaSemana: 3,
    itens: [
      { id: 'fmi08', fichaId: fichaBId, exercicioId: 'ex06', ordem: 0, series: 4, reps: '8-10', descansoSeg: 120, notas: '' },
      { id: 'fmi09', fichaId: fichaBId, exercicioId: 'ex07', ordem: 1, series: 3, reps: '10-12', descansoSeg: 90, notas: '' },
      { id: 'fmi10', fichaId: fichaBId, exercicioId: 'ex08', ordem: 2, series: 4, reps: '8-10', descansoSeg: 90, notas: '' },
      { id: 'fmi11', fichaId: fichaBId, exercicioId: 'ex09', ordem: 3, series: 3, reps: '10-12', descansoSeg: 90, notas: '' },
      { id: 'fmi12', fichaId: fichaBId, exercicioId: 'ex10', ordem: 4, series: 3, reps: '10', descansoSeg: 90, notas: '' },
      { id: 'fmi13', fichaId: fichaBId, exercicioId: 'ex11', ordem: 5, series: 3, reps: '12-15', descansoSeg: 60, notas: '' },
      { id: 'fmi14', fichaId: fichaBId, exercicioId: 'ex12', ordem: 6, series: 3, reps: '10-12', descansoSeg: 60, notas: '' },
      { id: 'fmi15', fichaId: fichaBId, exercicioId: 'ex13', ordem: 7, series: 3, reps: '12', descansoSeg: 60, notas: '' },
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
