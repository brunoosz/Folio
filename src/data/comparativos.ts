export interface Comparativo {
  exercicioId: string;
  alternativaId: string;
  diferencaRelevante: string;
}

export const comparativos: Comparativo[] = [
  { exercicioId: 'ex01', alternativaId: 'ex02', diferencaRelevante: 'Leg press elimina compressão axial direta na coluna, mas não recruta estabilizadores do tronco.' },
  { exercicioId: 'ex01', alternativaId: 'ex03', diferencaRelevante: 'Búlgaro tem maior demanda unilateral de equilíbrio e recruta mais glúteo médio.' },
  { exercicioId: 'ex02', alternativaId: 'ex01', diferencaRelevante: 'Agachamento livre exige controle motor da coluna e recruta eretores da espinha como estabilizadores.' },
  { exercicioId: 'ex02', alternativaId: 'ex04', diferencaRelevante: 'Cadeira extensora isola quadríceps sem recrutar glúteos nem isquiotibiais.' },
  { exercicioId: 'ex06', alternativaId: 'ex07', diferencaRelevante: 'Inclinado enfatiza porção clavicular do peitoral e exige mais estabilização com halteres.' },
  { exercicioId: 'ex07', alternativaId: 'ex06', diferencaRelevante: 'Supino reto com barra permite maior carga absoluta e enfatiza porção esternal.' },
  { exercicioId: 'ex08', alternativaId: 'ex09', diferencaRelevante: 'Puxada frontal é vertical (ênfase em largura dorsal), remada é horizontal (ênfase em espessura e romboides).' },
  { exercicioId: 'ex09', alternativaId: 'ex08', diferencaRelevante: 'Remada curvada recruta eretores da espinha como estabilizadores; maior demanda lombar.' },
  { exercicioId: 'ex14', alternativaId: 'ex05', diferencaRelevante: 'Mesa flexora isola isquiotibiais sem estresse lombar, mas não trabalha glúteos nem eretores da espinha.' },
  { exercicioId: 'ex05', alternativaId: 'ex14', diferencaRelevante: 'Stiff é multiarticular com alta demanda lombar; requer técnica rigorosa de coluna neutra.' },
  { exercicioId: 'ex12', alternativaId: 'ex13', diferencaRelevante: 'Tríceps corda trabalha grupo oposto (tríceps vs bíceps). Não são equivalentes funcionalmente.' },
];
