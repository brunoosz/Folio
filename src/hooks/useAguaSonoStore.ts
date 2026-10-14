import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDiasISO, hojeLocal } from '../data/date';

/* ---------------- Tipos ---------------- */

export interface AguaRegistro { id: string; data: string; hora: string; ml: number }

export interface Despertar { hora: string; minutos: number }

export interface SonoRegistro {
  /** Data em que a pessoa ACORDOU (a noite anterior a esta data). */
  data: string;
  dormiu: string;
  acordou: string;
  despertares: Despertar[];
  /** 1 (muito ruim) a 5 (ótimo). */
  qualidade: number | null;
  notas: string;
}

interface AguaSonoState {
  garrafaMl: number;
  /** Garrafa diferente só hoje. */
  garrafaHoje: { data: string; ml: number } | null;
  /** Meta manual (ml). null = automática pelo peso. */
  metaAguaMl: number | null;
  agua: AguaRegistro[];
  metaSonoH: number;
  sono: SonoRegistro[];

  setGarrafa: (ml: number) => void;
  setGarrafaHoje: (ml: number | null) => void;
  setMetaAgua: (ml: number | null) => void;
  beber: (ml: number) => void;
  removerAgua: (id: string) => void;
  setMetaSono: (h: number) => void;
  salvarSono: (r: SonoRegistro) => void;
  removerSono: (data: string) => void;
}

const agoraHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const useAguaSonoStore = create<AguaSonoState>()(
  persist(
    (set, get) => ({
      garrafaMl: 500,
      garrafaHoje: null,
      metaAguaMl: null,
      agua: [],
      metaSonoH: 8,
      sono: [],

      setGarrafa: ml => set({ garrafaMl: Math.max(50, Math.round(ml)) }),
      setGarrafaHoje: ml => set({ garrafaHoje: ml ? { data: hojeLocal(), ml: Math.max(50, Math.round(ml)) } : null }),
      setMetaAgua: ml => set({ metaAguaMl: ml ? Math.round(ml) : null }),
      beber: ml => {
        if (!ml || ml <= 0) return;
        const r: AguaRegistro = { id: `a${Date.now().toString(36)}`, data: hojeLocal(), hora: agoraHHMM(), ml: Math.round(ml) };
        // Mantém só os últimos 120 dias.
        const limite = addDiasISO(hojeLocal(), -120);
        set({ agua: [...get().agua.filter(a => a.data >= limite), r] });
      },
      removerAgua: id => set({ agua: get().agua.filter(a => a.id !== id) }),
      setMetaSono: h => set({ metaSonoH: Math.min(12, Math.max(4, h)) }),
      salvarSono: r => set({ sono: [...get().sono.filter(s => s.data !== r.data), r].sort((a, b) => a.data.localeCompare(b.data)) }),
      removerSono: data => set({ sono: get().sono.filter(s => s.data !== data) }),
    }),
    { name: 'folio_agua_sono', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

/* ---------------- Derivações puras ---------------- */

export function garrafaDoDia(s: Pick<AguaSonoState, 'garrafaMl' | 'garrafaHoje'>, data = hojeLocal()): number {
  return s.garrafaHoje?.data === data ? s.garrafaHoje.ml : s.garrafaMl;
}

/** Meta de água: manual, ou ~35 ml por kg (arredondada a 50 ml), ou 2 L sem peso informado. */
export function metaAgua(metaManual: number | null, pesoKg: number | null): number {
  if (metaManual) return metaManual;
  if (pesoKg) return Math.round((pesoKg * 35) / 50) * 50;
  return 2000;
}

export function aguaDoDia(agua: AguaRegistro[], data = hojeLocal()): number {
  return agua.reduce((acc, a) => (a.data === data ? acc + a.ml : acc), 0);
}

export function historicoAgua(agua: AguaRegistro[], dias: number): { x: string; y: number }[] {
  const hoje = hojeLocal();
  return Array.from({ length: dias }, (_, i) => {
    const data = addDiasISO(hoje, i - dias + 1);
    return { x: data, y: aguaDoDia(agua, data) };
  });
}

const minutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Minutos na cama (atravessa a meia-noite). */
export function minutosNaCama(r: Pick<SonoRegistro, 'dormiu' | 'acordou'>): number {
  let d = minutos(r.acordou) - minutos(r.dormiu);
  if (d <= 0) d += 24 * 60;
  return d;
}

/** Sono efetivo: tempo na cama menos o tempo acordado durante a noite. */
export function minutosDormidos(r: SonoRegistro): number {
  const acordado = r.despertares.reduce((a, d) => a + (d.minutos || 0), 0);
  return Math.max(0, minutosNaCama(r) - acordado);
}

export function fmtHoras(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function historicoSono(sono: SonoRegistro[], dias: number): { x: string; y: number }[] {
  const hoje = hojeLocal();
  return Array.from({ length: dias }, (_, i) => {
    const data = addDiasISO(hoje, i - dias + 1);
    const r = sono.find(s => s.data === data);
    return { x: data, y: r ? Math.round((minutosDormidos(r) / 60) * 10) / 10 : 0 };
  });
}

export type NivelInsight = 'bom' | 'atencao' | 'alerta';
export interface Insight { nivel: NivelInsight; titulo: string; texto: string }

/** Leitura da noite passada para orientar o dia (informativo, não clínico). */
export function insightSono(sono: SonoRegistro[], metaH: number, data = hojeLocal()): Insight | null {
  const r = sono.find(s => s.data === data);
  if (!r) return null;
  const min = minutosDormidos(r);
  const horas = fmtHoras(min);
  const ruim = (r.qualidade ?? 3) <= 2;
  const fragmentado = r.despertares.length >= 3;
  if (min < 5 * 60 || (min < 6 * 60 && ruim)) {
    return {
      nivel: 'alerta',
      titulo: `Noite curta: ${horas}`,
      texto: 'Hoje, priorize técnica: aqueça bem, mantenha as cargas da última sessão e evite buscar recordes. Se sentir tontura ou muito cansaço, descanse.',
    };
  }
  if (min < 6.5 * 60 || ruim || fragmentado) {
    return {
      nivel: 'atencao',
      titulo: `Sono abaixo do ideal: ${horas}${fragmentado ? `, ${r.despertares.length} despertares` : ''}`,
      texto: 'O rendimento pode cair um pouco. Mantenha as cargas e ouça o corpo; tente dormir mais cedo hoje.',
    };
  }
  if (min >= metaH * 60 - 30 && (r.qualidade ?? 4) >= 4) {
    return { nivel: 'bom', titulo: `Boa noite de sono: ${horas}`, texto: 'Bom dia para buscar a progressão de carga com segurança.' };
  }
  return null;
}

/** Resumo para o contexto da IA. */
export function aguaSonoParaTexto(s: Pick<AguaSonoState, 'agua' | 'sono' | 'metaSonoH'>, metaAguaMl: number): string {
  const partes: string[] = [];
  const hoje = hojeLocal();
  partes.push(`água hoje: ${aguaDoDia(s.agua, hoje)} de ${metaAguaMl} ml`);
  const r = s.sono.find(x => x.data === hoje);
  if (r) {
    partes.push(`sono da última noite: ${fmtHoras(minutosDormidos(r))} (dormiu ${r.dormiu}, acordou ${r.acordou}, ${r.despertares.length} despertares${r.qualidade ? `, qualidade ${r.qualidade}/5` : ''})`);
  }
  const ult7 = historicoSono(s.sono, 7).filter(d => d.y > 0);
  if (ult7.length >= 3) {
    const media = ult7.reduce((a, d) => a + d.y, 0) / ult7.length;
    partes.push(`média de sono em 7 dias: ${String(Math.round(media * 10) / 10).replace('.', ',')} h`);
  }
  return partes.join('; ');
}
