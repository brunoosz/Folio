import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDiasISO, hojeLocal, parseLocalISODate } from '../data/date';

export interface Medicamento {
  id: string;
  nome: string;
  /** Texto livre, como está na receita (ex.: "1 comprimido de 50 mg"). */
  dose: string;
  /** Horários "HH:MM", ordenados. */
  horarios: string[];
  /** Dias da semana (0=dom..6=sáb). Vazio = todos os dias. */
  dias: number[];
  obs: string;
  ativo: boolean;
}

export interface Tomada { medId: string; data: string; hora: string; em: string }

interface MedicamentosState {
  medicamentos: Medicamento[];
  tomadas: Tomada[];
  /** Mostrar o cartão de remédios na aba Hoje da Rotina. */
  mostrarNaRotina: boolean;
  setMostrarNaRotina: (v: boolean) => void;
  salvar: (m: Medicamento) => void;
  remover: (id: string) => void;
  alternarTomada: (medId: string, data: string, hora: string) => void;
}

export const useMedicamentosStore = create<MedicamentosState>()(
  persist(
    (set, get) => ({
      medicamentos: [],
      tomadas: [],
      mostrarNaRotina: true,
      setMostrarNaRotina: v => set({ mostrarNaRotina: v }),
      salvar: m => {
        const horarios = [...new Set(m.horarios.filter(h => /^\d{2}:\d{2}$/.test(h)))].sort();
        set({ medicamentos: [...get().medicamentos.filter(x => x.id !== m.id), { ...m, horarios }].sort((a, b) => a.nome.localeCompare(b.nome)) });
      },
      remover: id => set({ medicamentos: get().medicamentos.filter(m => m.id !== id), tomadas: get().tomadas.filter(t => t.medId !== id) }),
      alternarTomada: (medId, data, hora) => {
        const atual = get().tomadas;
        const existe = atual.some(t => t.medId === medId && t.data === data && t.hora === hora);
        const limite = addDiasISO(hojeLocal(), -90);
        set({
          tomadas: existe
            ? atual.filter(t => !(t.medId === medId && t.data === data && t.hora === hora))
            : [...atual.filter(t => t.data >= limite), { medId, data, hora, em: new Date().toISOString() }],
        });
      },
    }),
    { name: 'folio_medicamentos', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export function tomaNoDia(m: Medicamento, data: string) {
  return m.ativo && m.horarios.length > 0 && (!m.dias.length || m.dias.includes(parseLocalISODate(data).getDay()));
}

export interface DoseDoDia { med: Medicamento; hora: string; tomada: boolean }

export function dosesDoDia(meds: Medicamento[], tomadas: Tomada[], data: string): DoseDoDia[] {
  return meds
    .filter(m => tomaNoDia(m, data))
    .flatMap(m => m.horarios.map(hora => ({ med: m, hora, tomada: tomadas.some(t => t.medId === m.id && t.data === data && t.hora === hora) })))
    .sort((a, b) => a.hora.localeCompare(b.hora) || a.med.nome.localeCompare(b.med.nome));
}

export const diasSemanaCurto = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function medicamentosParaTexto(meds: Medicamento[]): string {
  const ativos = meds.filter(m => m.ativo);
  if (!ativos.length) return '';
  return `usa medicamentos (informado pelo usuário): ${ativos.map(m => `${m.nome}${m.dose ? ` (${m.dose})` : ''}`).join(', ')}`;
}
