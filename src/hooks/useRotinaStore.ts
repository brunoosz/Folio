import { create } from 'zustand';
import type { HabitoModelo, HabitoRegistro } from '../data/rotina';
import { habitosDefault, iconePorTipo } from '../data/rotina';
import { iconNames } from '../components/ui/Icon';
import { addDiasISO, hojeLocal } from '../data/date';

const LS_HABITOS = 'folio_habitos';
const LS_REGISTROS = 'folio_registros';

function read<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function write<T>(key: string, d: T) {
  try { localStorage.setItem(key, JSON.stringify(d)); } catch { /* armazenamento cheio/bloqueado */ }
}

/** Garante ícones válidos (dados antigos usavam emoji). */
function lerHabitos(): HabitoModelo[] {
  // Lista vazia é válida: a pessoa pode ter removido tudo na personalização.
  const lista = read<HabitoModelo[]>(LS_HABITOS, habitosDefault);
  if (!Array.isArray(lista)) return habitosDefault;
  return lista.map(h => ({
    ...h,
    icone: (iconNames as string[]).includes(h.icone) ? h.icone : iconePorTipo[h.tipo] ?? 'check',
  }));
}

function lerRegistros(): HabitoRegistro[] {
  const r = read<HabitoRegistro[]>(LS_REGISTROS, []);
  return Array.isArray(r) ? r : [];
}

/** Meta mínima para considerar o dia cumprido (hábitos sem meta contam com valor ≥ 1). */
function metaDe(h: HabitoModelo | undefined) {
  return Math.max(1, h?.meta ?? 1);
}

interface RotinaState {
  habitos: HabitoModelo[];
  registros: HabitoRegistro[];
  load: () => void;
  incrementar: (habitoId: string) => void;
  decrementar: (habitoId: string) => void;
  setValor: (habitoId: string, valor: number) => void;
  setNotas: (habitoId: string, notas: string) => void;
  salvarHabito: (h: HabitoModelo) => void;
  removerHabito: (habitoId: string) => void;
  restaurarPadrao: () => void;
  getRegistroHoje: (habitoId: string) => HabitoRegistro;
  getHistorico: (habitoId: string, dias: number) => { data: string; valor: number }[];
  /** Dias consecutivos batendo a meta do hábito (hoje conta se já cumprido). */
  getSequencia: (habitoId: string) => number;
  /** Dias consecutivos em que TODOS os hábitos bateram a meta. */
  getSequenciaGeral: () => number;
}

export const useRotinaStore = create<RotinaState>((set, get) => {
  const valorEm = (habitoId: string, data: string) =>
    get().registros.find(r => r.habitoId === habitoId && r.data === data)?.valor ?? 0;

  const upsert = (habitoId: string, fn: (r: HabitoRegistro) => HabitoRegistro) => {
    const h = hojeLocal();
    const registros = [...get().registros];
    const idx = registros.findIndex(r => r.habitoId === habitoId && r.data === h);
    const atual = idx >= 0 ? registros[idx] : { habitoId, data: h, valor: 0, notas: '' };
    const novo = fn(atual);
    if (idx >= 0) registros[idx] = novo; else registros.push(novo);
    write(LS_REGISTROS, registros);
    set({ registros });
  };

  /** Conta dias seguidos a partir de hoje; se hoje ainda não cumpriu, começa de ontem. */
  const contarSequencia = (cumpriu: (data: string) => boolean) => {
    let dia = hojeLocal();
    if (!cumpriu(dia)) dia = addDiasISO(dia, -1);
    let n = 0;
    while (n < 3650 && cumpriu(dia)) { n++; dia = addDiasISO(dia, -1); }
    return n;
  };

  return {
    habitos: lerHabitos(),
    registros: lerRegistros(),

    load() {
      set({ habitos: lerHabitos(), registros: lerRegistros() });
    },

    getRegistroHoje(habitoId) {
      const h = hojeLocal();
      return get().registros.find(r => r.habitoId === habitoId && r.data === h)
        ?? { habitoId, data: h, valor: 0, notas: '' };
    },

    getHistorico(habitoId, dias) {
      const hoje = hojeLocal();
      const result: { data: string; valor: number }[] = [];
      for (let i = dias - 1; i >= 0; i--) {
        const ds = addDiasISO(hoje, -i);
        result.push({ data: ds, valor: valorEm(habitoId, ds) });
      }
      return result;
    },

    getSequencia(habitoId) {
      const meta = metaDe(get().habitos.find(h => h.id === habitoId));
      return contarSequencia(d => valorEm(habitoId, d) >= meta);
    },

    getSequenciaGeral() {
      const habitos = get().habitos;
      if (!habitos.length) return 0;
      return contarSequencia(d => habitos.every(h => valorEm(h.id, d) >= metaDe(h)));
    },

    incrementar(habitoId) {
      upsert(habitoId, r => ({ ...r, valor: r.valor + 1 }));
    },

    decrementar(habitoId) {
      if (get().getRegistroHoje(habitoId).valor <= 0) return;
      upsert(habitoId, r => ({ ...r, valor: Math.max(0, r.valor - 1) }));
    },

    setValor(habitoId, valor) {
      const v = Number.isFinite(valor) ? Math.max(0, valor) : 0;
      upsert(habitoId, r => ({ ...r, valor: v }));
    },

    setNotas(habitoId, notas) {
      upsert(habitoId, r => ({ ...r, notas }));
    },

    salvarHabito(h) {
      const atual = get().habitos;
      const habitos = atual.some(x => x.id === h.id) ? atual.map(x => (x.id === h.id ? h : x)) : [...atual, h];
      write(LS_HABITOS, habitos);
      set({ habitos });
    },

    removerHabito(habitoId) {
      const habitos = get().habitos.filter(h => h.id !== habitoId);
      write(LS_HABITOS, habitos);
      set({ habitos });
    },

    restaurarPadrao() {
      // Mantém hábitos personalizados e devolve os padrões que faltam.
      const atual = get().habitos;
      const habitos = [...habitosDefault.filter(d => !atual.some(h => h.id === d.id)), ...atual];
      const ordem = (h: HabitoModelo) => { const i = habitosDefault.findIndex(d => d.id === h.id); return i < 0 ? 99 : i; };
      habitos.sort((a, b) => ordem(a) - ordem(b));
      write(LS_HABITOS, habitos);
      set({ habitos });
    },
  };
});
