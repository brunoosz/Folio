import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IconName } from '../components/ui/Icon';
import { addDiasISO, hojeLocal } from '../data/date';

export type TipoAtividade = 'acordar' | 'refeicao' | 'trabalho' | 'estudo' | 'treino' | 'deslocamento' | 'lazer' | 'dormir' | 'outro';

export interface AtividadeRotina {
  id: string;
  hora: string;
  titulo: string;
  tipo: TipoAtividade;
  /** Dias da semana (0 = domingo). Vazio = todos os dias. */
  dias: number[];
}

export const tipoAtividade: Record<TipoAtividade, { label: string; icone: IconName; cor: string }> = {
  acordar: { label: 'Acordar', icone: 'sparkle', cor: 'var(--color-routine)' },
  refeicao: { label: 'Refeição', icone: 'utensils', cor: 'var(--color-saffron)' },
  trabalho: { label: 'Trabalho', icone: 'target', cor: 'var(--color-brand)' },
  estudo: { label: 'Estudo', icone: 'book', cor: 'var(--color-science)' },
  treino: { label: 'Treino', icone: 'dumbbell', cor: 'var(--color-muscle)' },
  deslocamento: { label: 'Deslocamento', icone: 'activity', cor: 'var(--color-mocha)' },
  lazer: { label: 'Lazer', icone: 'heart', cor: 'var(--color-muscle-secondary)' },
  dormir: { label: 'Dormir', icone: 'moon', cor: 'var(--color-science)' },
  outro: { label: 'Outro', icone: 'check', cor: 'var(--color-ink-body)' },
};

export const diasCurtos = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface MinhaRotinaState {
  atividades: AtividadeRotina[];
  /** "data|id" das tarefas marcadas como feitas. */
  feitas: string[];
  /** Texto livre sobre o dia a dia, para dar contexto à IA. */
  sobreMim: string;
  salvarAtividade: (a: AtividadeRotina) => void;
  removerAtividade: (id: string) => void;
  alternarFeita: (id: string, data?: string) => void;
  setSobreMim: (t: string) => void;
  usarModelo: () => void;
}

const MODELO: Omit<AtividadeRotina, 'id'>[] = [
  { hora: '06:30', titulo: 'Acordar e beber água', tipo: 'acordar', dias: [] },
  { hora: '07:00', titulo: 'Café da manhã', tipo: 'refeicao', dias: [] },
  { hora: '08:00', titulo: 'Trabalho / estudo', tipo: 'trabalho', dias: [1, 2, 3, 4, 5] },
  { hora: '12:00', titulo: 'Almoço', tipo: 'refeicao', dias: [] },
  { hora: '16:00', titulo: 'Lanche', tipo: 'refeicao', dias: [] },
  { hora: '18:30', titulo: 'Treino', tipo: 'treino', dias: [1, 2, 3, 4, 5] },
  { hora: '20:00', titulo: 'Jantar', tipo: 'refeicao', dias: [] },
  { hora: '22:30', titulo: 'Dormir', tipo: 'dormir', dias: [] },
];

export const useMinhaRotinaStore = create<MinhaRotinaState>()(
  persist(
    (set, get) => ({
      atividades: [],
      feitas: [],
      sobreMim: '',
      salvarAtividade: a => set({ atividades: [...get().atividades.filter(x => x.id !== a.id), a].sort((x, y) => x.hora.localeCompare(y.hora)) }),
      removerAtividade: id => set({ atividades: get().atividades.filter(a => a.id !== id) }),
      alternarFeita: (id, data = hojeLocal()) => {
        const chave = `${data}|${id}`;
        const limite = addDiasISO(hojeLocal(), -30);
        const feitas = get().feitas.filter(f => f.split('|')[0] >= limite);
        set({ feitas: feitas.includes(chave) ? feitas.filter(f => f !== chave) : [...feitas, chave] });
      },
      setSobreMim: t => set({ sobreMim: t.slice(0, 1200) }),
      usarModelo: () => set({
        atividades: MODELO.map((a, i) => ({ ...a, id: `r${Date.now().toString(36)}${i}` })),
      }),
    }),
    { name: 'folio_minha_rotina', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/** Atividades do dia (pelo dia da semana), em ordem de horário. */
export function atividadesDoDia(atividades: AtividadeRotina[], d: Date = new Date()): AtividadeRotina[] {
  const dow = d.getDay();
  return atividades.filter(a => a.dias.length === 0 || a.dias.includes(dow)).sort((a, b) => a.hora.localeCompare(b.hora));
}

export function rotinaParaTexto(atividades: AtividadeRotina[], sobreMim: string): string {
  const hoje = atividadesDoDia(atividades);
  const partes: string[] = [];
  if (hoje.length) partes.push(`rotina de hoje: ${hoje.map(a => `${a.hora} ${a.titulo}`).join(', ')}`);
  if (sobreMim.trim()) partes.push(`sobre o dia a dia (relato do usuário): ${sobreMim.trim()}`);
  return partes.join('; ');
}
