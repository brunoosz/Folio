import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Refeicao { id: string; nome: string; hora: string; itens: string[] }

export interface RegistroRefeicao {
  id: string;
  data: string;
  hora: string;
  /** Refeição do plano a que se refere (ou null = fora do plano). */
  refeicaoId: string | null;
  nome: string;
  itens: string[];
  analise?: { texto: string; origem: 'ia' | 'offline' };
}

export interface MensagemNutri { id: string; papel: 'user' | 'ia'; texto: string; origem?: 'ia' | 'offline' }

interface NutricaoState {
  refeicoes: Refeicao[];
  /** De onde veio o plano. */
  origem: 'nutricionista' | 'proprio' | null;
  profissional: string;
  /** Alimentos que a pessoa costuma ter em casa. */
  despensa: string[];
  mensagens: MensagemNutri[];
  diario: RegistroRefeicao[];

  registrarRefeicao: (r: Omit<RegistroRefeicao, 'id'>) => string;
  setAnalise: (id: string, analise: RegistroRefeicao['analise']) => void;
  removerRegistro: (id: string) => void;
  salvarRefeicao: (r: Refeicao) => void;
  removerRefeicao: (id: string) => void;
  substituirPlano: (refeicoes: Omit<Refeicao, 'id'>[], origem: 'nutricionista' | 'proprio', profissional?: string) => void;
  setOrigem: (o: 'nutricionista' | 'proprio' | null, profissional?: string) => void;
  alternarDespensa: (alimento: string) => void;
  addMensagem: (m: Omit<MensagemNutri, 'id'>) => void;
  limparConversa: () => void;
}

function limite90() {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const id = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const useNutricaoStore = create<NutricaoState>()(
  persist(
    (set, get) => ({
      refeicoes: [],
      origem: null,
      profissional: '',
      despensa: [],
      mensagens: [],
      diario: [],
      registrarRefeicao: r => {
        const novo = { ...r, id: id() };
        // Mantém ~90 dias de diário.
        set({ diario: [...get().diario.filter(x => x.data >= limite90()), novo] });
        return novo.id;
      },
      setAnalise: (rid, analise) => set({ diario: get().diario.map(x => (x.id === rid ? { ...x, analise } : x)) }),
      removerRegistro: rid => set({ diario: get().diario.filter(x => x.id !== rid) }),
      salvarRefeicao: r => set({ refeicoes: [...get().refeicoes.filter(x => x.id !== r.id), r].sort(ordenar) }),
      removerRefeicao: rid => set({ refeicoes: get().refeicoes.filter(r => r.id !== rid) }),
      substituirPlano: (refeicoes, origem, profissional = '') =>
        set({ refeicoes: refeicoes.map(r => ({ ...r, id: id() })).sort(ordenar), origem, profissional }),
      setOrigem: (origem, profissional) => set({ origem, profissional: profissional ?? get().profissional }),
      alternarDespensa: a => {
        const atual = get().despensa;
        set({ despensa: atual.includes(a) ? atual.filter(x => x !== a) : [...atual, a] });
      },
      addMensagem: m => set({ mensagens: [...get().mensagens, { ...m, id: id() }].slice(-40) }),
      limparConversa: () => set({ mensagens: [] }),
    }),
    { name: 'folio_nutricao', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

function ordenar(a: Refeicao, b: Refeicao) {
  return (a.hora || '99:99').localeCompare(b.hora || '99:99');
}

/** Plano em texto (para o contexto da IA). */
export function planoParaTexto(refeicoes: Refeicao[], origem: NutricaoState['origem'], profissional: string): string {
  if (!refeicoes.length) return '';
  const cab = origem === 'nutricionista' ? `Plano passado por nutricionista${profissional ? ` (${profissional})` : ''}:` : 'Rotina alimentar do usuário:';
  return `${cab}\n${refeicoes.map(r => `- ${r.hora ? `${r.hora} ` : ''}${r.nome}: ${r.itens.join('; ')}`).join('\n')}`;
}

/**
 * Interpreta um plano colado como texto, sem IA.
 * Linhas com horário ou nome de refeição abrem uma nova refeição; as demais viram itens.
 */
export function interpretarPlanoTexto(texto: string): Omit<Refeicao, 'id'>[] {
  const NOMES = /(caf[eé]|desjejum|lanche|almo[cç]o|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o|colaç[aã]o)/i;
  const refeicoes: Omit<Refeicao, 'id'>[] = [];
  let atual: Omit<Refeicao, 'id'> | null = null;
  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.replace(/^[\s•\-*–]+/, '').trim();
    if (!linha) continue;
    const hora = linha.match(/\b(\d{1,2})[:h](\d{2})?\b/);
    const ehTitulo = (NOMES.test(linha) && linha.length < 60) || (hora && linha.length < 40 && !/\d+\s?(g|ml|unid|col|fatia|x[ií]c)/i.test(linha));
    if (ehTitulo) {
      const hh = hora ? `${hora[1].padStart(2, '0')}:${hora[2] ?? '00'}` : '';
      const nome = linha.replace(/\b\d{1,2}[:h]\d{0,2}\b/, '').replace(/[:\-–]+$/, '').replace(/^[:\-–\s]+/, '').trim() || 'Refeição';
      atual = { nome: nome.charAt(0).toUpperCase() + nome.slice(1), hora: hh, itens: [] };
      refeicoes.push(atual);
    } else {
      if (!atual) { atual = { nome: 'Refeição', hora: '', itens: [] }; refeicoes.push(atual); }
      atual.itens.push(linha.slice(0, 120));
    }
  }
  return refeicoes.filter(r => r.itens.length);
}
