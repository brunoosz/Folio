export type MusculoPapel = 'primario' | 'secundario' | 'estabilizador';
export type Equipamento = 'barra_livre' | 'maquina' | 'haltere' | 'cabo' | 'peso_corporal';
export type Dificuldade = 'basico' | 'intermediario' | 'avancado';
export type SessaoStatus = 'pendente' | 'em_andamento' | 'concluida';

/** Grupos musculares (nível exibido no mapa). IDs estáveis para a migração ao 3D. */
export type GrupoMuscularId =
  | 'peito' | 'ombros' | 'trapezio' | 'costas' | 'lombar'
  | 'biceps' | 'triceps' | 'antebraco' | 'abdomen'
  | 'gluteos' | 'quadriceps' | 'posteriores' | 'adutores' | 'panturrilha';

export interface GrupoMuscular {
  id: GrupoMuscularId;
  nome: string;
}

/** Músculo / sub-região anatômica (ex.: peitoral — porção clavicular = "peito superior"). */
export interface Musculo {
  id: string;
  nome: string;
  grupo: GrupoMuscularId;
  regiao: 'anterior' | 'posterior';
  /** Nome anatômico, quando o nome de uso comum for diferente. */
  anatomico?: string;
}

/** Padrão de movimento: define a animação do boneco na ficha do exercício. */
export type PadraoMovimento =
  | 'agachamento' | 'leg_press' | 'avanco' | 'extensao_joelho' | 'flexao_joelho_deitado' | 'flexao_joelho_sentado'
  | 'hinge' | 'elevacao_pelvica' | 'panturrilha_em_pe' | 'panturrilha_sentado' | 'abducao_quadril' | 'aducao_quadril' | 'coice'
  | 'supino' | 'supino_inclinado' | 'supino_declinado' | 'crucifixo' | 'crossover' | 'peck_deck' | 'flexao_bracos' | 'mergulho' | 'chest_press'
  | 'remada_curvada' | 'remada_sentada' | 'remada_unilateral' | 'puxada' | 'barra_fixa' | 'pulldown_estendido' | 'hiperextensao'
  | 'desenvolvimento' | 'elevacao_lateral' | 'elevacao_frontal' | 'crucifixo_inverso' | 'face_pull' | 'encolhimento' | 'rotacao_externa'
  | 'rosca' | 'rosca_scott' | 'rosca_inclinada' | 'triceps_polia' | 'triceps_testa' | 'triceps_frances' | 'triceps_banco' | 'rosca_punho'
  | 'abdominal' | 'elevacao_pernas' | 'prancha' | 'prancha_lateral' | 'rotacao_tronco';

export type Postura = 'em_pe' | 'sentado' | 'deitado' | 'inclinado' | 'apoiado' | 'suspenso';

/** 0 = baixo · 1 = moderado · 2 = alto. Usado no filtro de proteção articular. */
export type NivelEstresse = 0 | 1 | 2;
export interface EstresseArticular {
  lombar: NivelEstresse;
  joelho: NivelEstresse;
  ombro: NivelEstresse;
  cotovelo: NivelEstresse;
}
export type Articulacao = keyof EstresseArticular;

export interface Exercicio {
  id: string;
  nome: string;
  equipamento: Equipamento;
  dificuldade: Dificuldade;
  notasSeguranca: string;
  revisado: boolean;
  padrao: PadraoMovimento;
  postura: Postura;
  /** Passo a passo da execução. */
  execucao: string[];
  estresse: EstresseArticular;
  /**
   * 1RM de referência para um praticante iniciante, como múltiplo do peso corporal
   * [masculino, feminino]. Em halteres, por halter. Estimativa grosseira, só para a 1ª sugestão.
   */
  ref1RM?: [number, number];
  unilateral?: boolean;
  /** Isométrico (prancha): séries em segundos, sem carga. */
  isometrico?: boolean;
  /** Exercício criado pelo admin (não faz parte do catálogo base). */
  personalizado?: boolean;
}

export interface ExercicioMusculo {
  exercicioId: string;
  musculoId: string;
  papel: MusculoPapel;
}

/** Pirâmide 12/10/8 (padrão do Folio) ou repetições fixas em todas as séries. */
export type EsquemaSeries = 'piramide' | 'fixo';

export interface FichaModeloItem {
  id: string;
  fichaId: string;
  exercicioId: string;
  ordem: number;
  series: number;
  reps: string;
  descansoSeg: number;
  notas: string;
  esquema?: EsquemaSeries;
}

export interface FichaModelo {
  id: string;
  nome: string;
  /** Letra/código curto exibido na linha do tempo (ex.: "A"). */
  sigla?: string;
  diaSemana: number | null;
  itens: FichaModeloItem[];
}

/** Percepção de esforço da série: leve = sobraram 3+ reps; limite = 1–2; falha = nenhuma. */
export type Esforco = 'leve' | 'limite' | 'falha';

export interface SerieLog {
  /** Repetições-alvo (ou segundos, em isométricos). */
  alvo: number;
  reps: number | null;
  cargaKg: number | null;
  esforco: Esforco | null;
  feita: boolean;
}

export interface SessaoItem {
  id: string;
  sessaoId: string;
  exercicioId: string;
  ordem: number;
  series: number;
  reps: string;
  cargaKg: number | null;
  notas: string;
  concluido: boolean;
  /** Item da ficha modelo que originou este item (para "atualizar na ficha padrão"). */
  fichaItemId?: string;
  /** Descanso sugerido entre séries, em segundos. */
  descansoSeg?: number;
  esquema?: EsquemaSeries;
  /** Registro série a série (carga, reps feitas, esforço). */
  seriesLog?: SerieLog[];
}

export interface SessaoDodia {
  id: string;
  fichaModeloId: string;
  data: string;
  status: SessaoStatus;
  itens: SessaoItem[];
  /** ISO (com hora) de quando o treino foi iniciado/concluído. */
  iniciadaEm?: string;
  concluidaEm?: string;
}

export type HomeBlocoTipo = 'treino_do_dia' | 'linha_do_tempo' | 'pilula_cientifica' | 'atalhos_mapa';

export interface HomeBlocoConfig {
  tipo: HomeBlocoTipo;
  visivel: boolean;
}
