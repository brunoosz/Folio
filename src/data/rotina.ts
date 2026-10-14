import type { IconName } from '../components/ui/Icon';

export type HabitoTipo = 'agua' | 'sono' | 'suplemento' | 'refeicao' | 'alongamento' | 'custom';

export interface HabitoModelo {
  id: string;
  nome: string;
  tipo: HabitoTipo;
  meta?: number;
  unidade?: string;
  /** Nome do ícone compartilhado (ver components/ui/Icon). */
  icone: IconName;
  cor: string;
}

export interface HabitoRegistro {
  habitoId: string;
  data: string;
  valor: number;
  notas: string;
}

export const habitosDefault: HabitoModelo[] = [
  { id: 'hab_agua', nome: 'Água', tipo: 'agua', meta: 8, unidade: 'copos', icone: 'droplet', cor: 'var(--color-muscle-secondary)' },
  { id: 'hab_sono', nome: 'Sono', tipo: 'sono', meta: 8, unidade: 'horas', icone: 'moon', cor: 'var(--color-science)' },
  { id: 'hab_creatina', nome: 'Creatina', tipo: 'suplemento', meta: 1, unidade: 'dose', icone: 'pill', cor: 'var(--color-routine)' },
  { id: 'hab_proteina', nome: 'Whey Protein', tipo: 'suplemento', meta: 1, unidade: 'dose', icone: 'cup', cor: 'var(--color-mocha)' },
  { id: 'hab_refeicao', nome: 'Refeições', tipo: 'refeicao', meta: 5, unidade: 'refeições', icone: 'utensils', cor: 'var(--color-saffron)' },
  { id: 'hab_along', nome: 'Alongamento', tipo: 'alongamento', meta: 1, unidade: 'sessão', icone: 'stretch', cor: 'var(--color-muscle)' },
];

/** Ícone padrão por tipo (usado para migrar dados antigos com emoji). */
export const iconePorTipo: Record<HabitoTipo, IconName> = {
  agua: 'droplet',
  sono: 'moon',
  suplemento: 'pill',
  refeicao: 'utensils',
  alongamento: 'stretch',
  custom: 'check',
};
