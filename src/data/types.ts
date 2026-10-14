export type MusculoPapel = 'primario' | 'secundario' | 'estabilizador';
export type Equipamento = 'barra_livre' | 'maquina' | 'haltere' | 'cabo' | 'peso_corporal';
export type Dificuldade = 'basico' | 'intermediario' | 'avancado';
export type SessaoStatus = 'pendente' | 'em_andamento' | 'concluida';

export interface Musculo {
  id: string;
  nome: string;
  grupo: string;
  regiao: 'anterior' | 'posterior';
}

export interface Exercicio {
  id: string;
  nome: string;
  equipamento: Equipamento;
  dificuldade: Dificuldade;
  notasSeguranca: string;
  revisado: boolean;
}

export interface ExercicioMusculo {
  exercicioId: string;
  musculoId: string;
  papel: MusculoPapel;
}

export interface FichaModeloItem {
  id: string;
  fichaId: string;
  exercicioId: string;
  ordem: number;
  series: number;
  reps: string;
  descansoSeg: number;
  notas: string;
}

export interface FichaModelo {
  id: string;
  nome: string;
  /** Letra/código curto exibido na linha do tempo (ex.: "A"). */
  sigla?: string;
  diaSemana: number | null;
  itens: FichaModeloItem[];
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
