export type HabitoTipo = 'agua' | 'sono' | 'suplemento' | 'refeicao' | 'alongamento' | 'custom';

export interface HabitoModelo {
  id: string;
  nome: string;
  tipo: HabitoTipo;
  meta?: number;
  unidade?: string;
  icone: string;
  cor: string;
}

export interface HabitoRegistro {
  habitoId: string;
  data: string;
  valor: number;
  notas: string;
}

export const habitosDefault: HabitoModelo[] = [
  { id: 'hab_agua', nome: 'Água', tipo: 'agua', meta: 8, unidade: 'copos', icone: '💧', cor: 'var(--color-muscle-secondary)' },
  { id: 'hab_sono', nome: 'Sono', tipo: 'sono', meta: 8, unidade: 'horas', icone: '🌙', cor: 'var(--color-science)' },
  { id: 'hab_creatina', nome: 'Creatina', tipo: 'suplemento', meta: 1, unidade: 'dose', icone: '💊', cor: 'var(--color-routine)' },
  { id: 'hab_proteina', nome: 'Whey Protein', tipo: 'suplemento', meta: 1, unidade: 'dose', icone: '🥤', cor: 'var(--color-mocha)' },
  { id: 'hab_refeicao', nome: 'Refeições', tipo: 'refeicao', meta: 5, unidade: 'refeições', icone: '🍽️', cor: 'var(--color-saffron)' },
  { id: 'hab_along', nome: 'Alongamento', tipo: 'alongamento', meta: 1, unidade: 'sessão', icone: '🧘', cor: 'var(--color-muscle)' },
];
