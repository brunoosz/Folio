import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Sexo = 'masculino' | 'feminino' | 'outro';
export type Experiencia = 'nunca' | 'iniciante' | 'treina' | 'voltando';
export type Objetivo = 'hipertrofia' | 'forca' | 'emagrecimento' | 'saude' | 'condicionamento';
export type Lesao = 'lombar' | 'joelho' | 'ombro' | 'cotovelo' | 'quadril' | 'cervical';
export type LocalTreino = 'academia' | 'casa_halteres' | 'peso_corporal';

/** Base de conhecimento do usuário (respostas da pesquisa inicial). Tudo opcional. */
export interface PerfilFisico {
  alturaCm: number | null;
  pesoKg: number | null;
  sexo: Sexo | null;
  idade: number | null;
  experiencia: Experiencia | null;
  objetivo: Objetivo | null;
  lesoes: Lesao[];
  local: LocalTreino | null;
}

interface PerfilState extends PerfilFisico {
  /** A pesquisa inicial já foi respondida ou pulada. */
  pesquisaFeita: boolean;
  /** Consentimento para guardar dados de saúde neste aparelho (LGPD, dado sensível). */
  consentimentoSaude: boolean;
  atualizadoEm: string | null;
  atualizar: (p: Partial<PerfilFisico>) => void;
  concluirPesquisa: () => void;
  setConsentimento: (v: boolean) => void;
  refazerPesquisa: () => void;
}

const VAZIO: PerfilFisico = {
  alturaCm: null, pesoKg: null, sexo: null, idade: null, experiencia: null, objetivo: null, lesoes: [], local: null,
};

export const usePerfilStore = create<PerfilState>()(
  persist(
    set => ({
      ...VAZIO,
      pesquisaFeita: false,
      consentimentoSaude: false,
      atualizadoEm: null,
      atualizar: p => set({ ...p, atualizadoEm: new Date().toISOString() }),
      concluirPesquisa: () => set({ pesquisaFeita: true, atualizadoEm: new Date().toISOString() }),
      setConsentimento: v => set({ consentimentoSaude: v }),
      refazerPesquisa: () => set({ pesquisaFeita: false }),
    }),
    { name: 'folio_perfil', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
);

export const sexoLabels: Record<Sexo, string> = { masculino: 'Masculino', feminino: 'Feminino', outro: 'Prefiro não dizer' };
export const experienciaLabels: Record<Experiencia, string> = {
  nunca: 'Nunca treinei',
  iniciante: 'Comecei há pouco (menos de 6 meses)',
  treina: 'Já treino regularmente',
  voltando: 'Estou voltando a treinar',
};
export const objetivoLabels: Record<Objetivo, string> = {
  hipertrofia: 'Ganhar massa muscular',
  forca: 'Ganhar força',
  emagrecimento: 'Perder gordura',
  saude: 'Saúde e qualidade de vida',
  condicionamento: 'Condicionamento físico',
};
export const lesaoLabels: Record<Lesao, string> = {
  lombar: 'Lombar',
  joelho: 'Joelhos',
  ombro: 'Ombros',
  cotovelo: 'Cotovelos ou punhos',
  quadril: 'Quadril',
  cervical: 'Pescoço (cervical)',
};
export const localLabels: Record<LocalTreino, string> = {
  academia: 'Academia completa',
  casa_halteres: 'Em casa, com halteres',
  peso_corporal: 'Em casa, sem equipamento',
};

/** IMC (informativo). */
export function imc(p: Pick<PerfilFisico, 'alturaCm' | 'pesoKg'>): number | null {
  if (!p.alturaCm || !p.pesoKg) return null;
  const m = p.alturaCm / 100;
  return Math.round((p.pesoKg / (m * m)) * 10) / 10;
}

/** Resumo em texto para o contexto da IA (só o que foi respondido). */
export function perfilParaTexto(p: PerfilFisico): string {
  const partes: string[] = [];
  if (p.sexo && p.sexo !== 'outro') partes.push(`sexo ${p.sexo}`);
  if (p.idade) partes.push(`${p.idade} anos`);
  if (p.alturaCm) partes.push(`${p.alturaCm} cm`);
  if (p.pesoKg) partes.push(`${p.pesoKg} kg`);
  if (p.experiencia) partes.push(`experiência: ${experienciaLabels[p.experiencia].toLowerCase()}`);
  if (p.objetivo) partes.push(`objetivo: ${objetivoLabels[p.objetivo].toLowerCase()}`);
  if (p.lesoes.length) partes.push(`restrições/lesões relatadas: ${p.lesoes.map(l => lesaoLabels[l].toLowerCase()).join(', ')}`);
  if (p.local) partes.push(`treina em: ${localLabels[p.local].toLowerCase()}`);
  return partes.join('; ');
}

export function getPerfil(): PerfilFisico {
  const s = usePerfilStore.getState();
  return {
    alturaCm: s.alturaCm, pesoKg: s.pesoKg, sexo: s.sexo, idade: s.idade,
    experiencia: s.experiencia, objetivo: s.objetivo, lesoes: s.lesoes ?? [], local: s.local,
  };
}
