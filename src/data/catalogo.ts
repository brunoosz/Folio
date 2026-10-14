import type {
  Dificuldade, Equipamento, Exercicio, ExercicioMusculo, GrupoMuscular, Musculo, MusculoPapel, NivelEstresse,
  PadraoMovimento, Postura,
} from './types';

/*
 * Catálogo base do Folio. Todo o conteúdo é informativo e está marcado
 * "a revisar por profissional" (revisado: false) até a validação por um
 * Profissional de Educação Física / fisioterapeuta.
 */

export const gruposMusculares: GrupoMuscular[] = [
  { id: 'peito', nome: 'Peito' },
  { id: 'ombros', nome: 'Ombros' },
  { id: 'trapezio', nome: 'Trapézio' },
  { id: 'costas', nome: 'Costas' },
  { id: 'lombar', nome: 'Lombar' },
  { id: 'biceps', nome: 'Bíceps' },
  { id: 'triceps', nome: 'Tríceps' },
  { id: 'antebraco', nome: 'Antebraço' },
  { id: 'abdomen', nome: 'Abdômen' },
  { id: 'gluteos', nome: 'Glúteos' },
  { id: 'quadriceps', nome: 'Quadríceps' },
  { id: 'posteriores', nome: 'Posteriores da coxa' },
  { id: 'adutores', nome: 'Adutores' },
  { id: 'panturrilha', nome: 'Panturrilha' },
];

export const musculos: Musculo[] = [
  { id: 'peito_superior', nome: 'Peito superior', grupo: 'peito', regiao: 'anterior', anatomico: 'Peitoral maior — porção clavicular' },
  { id: 'peito_medio', nome: 'Peito médio', grupo: 'peito', regiao: 'anterior', anatomico: 'Peitoral maior — porção esternal' },
  { id: 'peito_inferior', nome: 'Peito inferior', grupo: 'peito', regiao: 'anterior', anatomico: 'Peitoral maior — porção abdominal' },

  { id: 'deltoide_anterior', nome: 'Deltoide anterior', grupo: 'ombros', regiao: 'anterior' },
  { id: 'deltoide_lateral', nome: 'Deltoide lateral', grupo: 'ombros', regiao: 'anterior' },
  { id: 'deltoide_posterior', nome: 'Deltoide posterior', grupo: 'ombros', regiao: 'posterior' },
  { id: 'manguito_rotador', nome: 'Manguito rotador', grupo: 'ombros', regiao: 'posterior', anatomico: 'Infraespinal e redondo menor' },

  { id: 'trapezio_superior', nome: 'Trapézio superior', grupo: 'trapezio', regiao: 'posterior' },
  { id: 'trapezio_medio', nome: 'Trapézio médio', grupo: 'trapezio', regiao: 'posterior' },
  { id: 'trapezio_inferior', nome: 'Trapézio inferior', grupo: 'trapezio', regiao: 'posterior' },

  { id: 'latissimo', nome: 'Dorsal', grupo: 'costas', regiao: 'posterior', anatomico: 'Latíssimo do dorso' },
  { id: 'redondo_maior', nome: 'Redondo maior', grupo: 'costas', regiao: 'posterior' },
  { id: 'romboides', nome: 'Romboides', grupo: 'costas', regiao: 'posterior' },

  { id: 'eretores_espinha', nome: 'Eretores da espinha', grupo: 'lombar', regiao: 'posterior' },

  { id: 'biceps_cabeca_longa', nome: 'Bíceps — cabeça longa', grupo: 'biceps', regiao: 'anterior' },
  { id: 'biceps_cabeca_curta', nome: 'Bíceps — cabeça curta', grupo: 'biceps', regiao: 'anterior' },
  { id: 'braquial', nome: 'Braquial', grupo: 'biceps', regiao: 'anterior' },

  { id: 'triceps_cabeca_longa', nome: 'Tríceps — cabeça longa', grupo: 'triceps', regiao: 'posterior' },
  { id: 'triceps_cabeca_lateral', nome: 'Tríceps — cabeça lateral', grupo: 'triceps', regiao: 'posterior' },
  { id: 'triceps_cabeca_medial', nome: 'Tríceps — cabeça medial', grupo: 'triceps', regiao: 'posterior' },

  { id: 'braquiorradial', nome: 'Braquiorradial', grupo: 'antebraco', regiao: 'anterior' },
  { id: 'flexores_antebraco', nome: 'Flexores do punho', grupo: 'antebraco', regiao: 'anterior' },
  { id: 'extensores_antebraco', nome: 'Extensores do punho', grupo: 'antebraco', regiao: 'posterior' },

  { id: 'reto_abdominal_superior', nome: 'Abdômen superior', grupo: 'abdomen', regiao: 'anterior', anatomico: 'Reto abdominal — porção superior' },
  { id: 'reto_abdominal_inferior', nome: 'Abdômen inferior', grupo: 'abdomen', regiao: 'anterior', anatomico: 'Reto abdominal — porção inferior' },
  { id: 'obliquos', nome: 'Oblíquos', grupo: 'abdomen', regiao: 'anterior' },
  { id: 'transverso', nome: 'Transverso do abdômen', grupo: 'abdomen', regiao: 'anterior' },

  { id: 'gluteo_maximo', nome: 'Glúteo máximo', grupo: 'gluteos', regiao: 'posterior' },
  { id: 'gluteo_medio', nome: 'Glúteo médio', grupo: 'gluteos', regiao: 'posterior' },

  { id: 'reto_femoral', nome: 'Reto femoral', grupo: 'quadriceps', regiao: 'anterior' },
  { id: 'vasto_lateral', nome: 'Vasto lateral', grupo: 'quadriceps', regiao: 'anterior' },
  { id: 'vasto_medial', nome: 'Vasto medial', grupo: 'quadriceps', regiao: 'anterior' },

  { id: 'biceps_femoral', nome: 'Bíceps femoral', grupo: 'posteriores', regiao: 'posterior' },
  { id: 'semitendinoso', nome: 'Semitendinoso e semimembranoso', grupo: 'posteriores', regiao: 'posterior' },

  { id: 'adutores', nome: 'Adutores', grupo: 'adutores', regiao: 'anterior' },

  { id: 'gastrocnemio', nome: 'Gastrocnêmio', grupo: 'panturrilha', regiao: 'posterior' },
  { id: 'soleo', nome: 'Sóleo', grupo: 'panturrilha', regiao: 'posterior' },
  { id: 'tibial_anterior', nome: 'Tibial anterior', grupo: 'panturrilha', regiao: 'anterior' },
];

/* ---------------- Exercícios ---------------- */

export const exercicios: Exercicio[] = [];
export const exercicioMusculos: ExercicioMusculo[] = [];

const PAPEL: Record<string, MusculoPapel> = { P: 'primario', S: 'secundario', E: 'estabilizador' };

const QUAD = 'reto_femoral vasto_lateral vasto_medial';
const ISQ = 'biceps_femoral semitendinoso';
const TRI = 'triceps_cabeca_longa triceps_cabeca_lateral triceps_cabeca_medial';
const BIC = 'biceps_cabeca_longa biceps_cabeca_curta';
const CORE = 'transverso reto_abdominal_superior';

/**
 * Registra um exercício.
 * @param mus  "P:id id;S:id;E:id" (primário, secundário, estabilizador)
 * @param est  4 dígitos 0–2: lombar, joelho, ombro, cotovelo/punho
 * @param passos passos da execução separados por "|"
 */
function ex(
  id: string, nome: string, equipamento: Equipamento, dificuldade: Dificuldade,
  padrao: PadraoMovimento, postura: Postura, mus: string, est: string, passos: string,
  seguranca: string, ref1RM?: [number, number], extra: Partial<Exercicio> = {},
) {
  const n = (i: number) => Math.max(0, Math.min(2, Number(est[i]) || 0)) as NivelEstresse;
  exercicios.push({
    id, nome, equipamento, dificuldade, padrao, postura,
    notasSeguranca: `${seguranca} A revisar por profissional.`,
    revisado: false,
    execucao: passos.split('|').map(s => s.trim()).filter(Boolean),
    estresse: { lombar: n(0), joelho: n(1), ombro: n(2), cotovelo: n(3) },
    ref1RM,
    ...extra,
  });
  const vistos = new Set<string>();
  for (const bloco of mus.split(';')) {
    const [p, ids] = bloco.split(':');
    for (const m of (ids ?? '').split(/\s+/).filter(Boolean)) {
      if (vistos.has(m)) continue;
      vistos.add(m);
      exercicioMusculos.push({ exercicioId: id, musculoId: m, papel: PAPEL[p.trim()] });
    }
  }
}

/* ---- Pernas ---- */
ex('ex01', 'Agachamento Livre', 'barra_livre', 'avancado', 'agachamento', 'em_pe',
  `P:${QUAD} gluteo_maximo;S:adutores ${ISQ};E:eretores_espinha ${CORE}`, '2200',
  'Barra apoiada no trapézio, pés na largura dos ombros e levemente abertos.|Inspire, contraia o abdômen e desça empurrando o quadril para trás e os joelhos para fora.|Desça até onde mantiver a coluna neutra e suba empurrando o chão.',
  'Manter coluna neutra e joelhos alinhados com a ponta dos pés. Usar suportes de segurança.', [0.9, 0.6]);
ex('ex02', 'Leg Press 45°', 'maquina', 'basico', 'leg_press', 'inclinado',
  `P:vasto_lateral vasto_medial reto_femoral;S:gluteo_maximo adutores`, '1200',
  'Costas e quadril apoiados no encosto, pés no meio da plataforma.|Destrave e desça controlando até cerca de 90° de joelho.|Empurre a plataforma sem travar os joelhos no final.',
  'Não deixar o quadril sair do encosto na descida. Não travar os joelhos na extensão.', [1.8, 1.3]);
ex('ex03', 'Agachamento Búlgaro', 'haltere', 'intermediario', 'avanco', 'em_pe',
  `P:vasto_lateral vasto_medial reto_femoral gluteo_maximo;S:adutores;E:gluteo_medio ${CORE}`, '1200',
  'Pé de trás apoiado em um banco, halteres ao lado do corpo.|Desça o joelho de trás em direção ao chão mantendo o tronco firme.|Suba empurrando o calcanhar da perna da frente.',
  'Joelho da frente alinhado ao pé. Comece sem carga até dominar o equilíbrio.', [0.2, 0.12], { unilateral: true });
ex('ex04', 'Cadeira Extensora', 'maquina', 'basico', 'extensao_joelho', 'sentado',
  `P:${QUAD}`, '0200',
  'Ajuste o eixo da máquina na linha do joelho e o rolo acima do tornozelo.|Estenda os joelhos até quase esticar, contraindo a coxa.|Volte devagar, sem deixar o peso bater.',
  'Movimento controlado, sem impulso. Reduzir amplitude se houver desconforto no joelho.', [0.6, 0.4]);
ex('ex05', 'Mesa Flexora', 'maquina', 'basico', 'flexao_joelho_deitado', 'deitado',
  `P:${ISQ};S:gastrocnemio`, '0100',
  'Deite de bruços com o rolo logo acima dos calcanhares.|Flexione os joelhos trazendo o rolo em direção ao glúteo.|Volte de forma lenta e controlada.',
  'Quadril colado no banco, sem usar impulso.', [0.45, 0.3]);
ex('ex14', 'Stiff', 'barra_livre', 'avancado', 'hinge', 'em_pe',
  `P:${ISQ} gluteo_maximo;S:eretores_espinha;E:trapezio_medio ${CORE}`, '2100',
  'Em pé, barra à frente das coxas e joelhos levemente flexionados.|Leve o quadril para trás deslizando a barra rente às pernas.|Desça até sentir alongar a parte de trás da coxa e volte contraindo o glúteo.',
  'Coluna neutra obrigatória: não arredondar as costas. Não recomendado sem orientação para iniciantes.', [0.7, 0.5]);
ex('ex15', 'Panturrilha em Pé na Máquina', 'maquina', 'basico', 'panturrilha_em_pe', 'em_pe',
  'P:gastrocnemio;S:soleo', '1000',
  'Ombros sob as almofadas e a ponta dos pés na plataforma.|Desça os calcanhares até alongar bem.|Suba na ponta dos pés e segure 1 segundo no topo.',
  'Amplitude completa, sem quicar no final do movimento.', [1.0, 0.7]);
ex('ex53', 'Agachamento Hack', 'maquina', 'intermediario', 'agachamento', 'inclinado',
  `P:vasto_lateral vasto_medial reto_femoral;S:gluteo_maximo adutores`, '1200',
  'Costas apoiadas no encosto, pés no centro da plataforma.|Desça controlando até a coxa ficar paralela à plataforma.|Suba empurrando com o pé inteiro, sem travar os joelhos.',
  'Manter as costas apoiadas durante todo o movimento.', [1.1, 0.75]);
ex('ex54', 'Afundo com Halteres', 'haltere', 'intermediario', 'avanco', 'em_pe',
  `P:vasto_lateral vasto_medial reto_femoral gluteo_maximo;S:adutores;E:gluteo_medio ${CORE}`, '1200',
  'Em pé com um halter em cada mão.|Dê um passo à frente e desça até os dois joelhos formarem cerca de 90°.|Empurre o pé da frente para voltar à posição inicial.',
  'Tronco ereto e joelho da frente alinhado ao pé.', [0.2, 0.12], { unilateral: true });
ex('ex55', 'Agachamento Goblet', 'haltere', 'basico', 'agachamento', 'em_pe',
  `P:${QUAD} gluteo_maximo;S:adutores;E:${CORE}`, '1100',
  'Segure um halter na vertical junto ao peito.|Desça entre as pernas mantendo o peito aberto.|Suba empurrando o chão com o pé inteiro.',
  'Boa opção para aprender o agachamento. Calcanhares sempre no chão.', [0.3, 0.2]);
ex('ex56', 'Cadeira Flexora', 'maquina', 'basico', 'flexao_joelho_sentado', 'sentado',
  `P:${ISQ};S:gastrocnemio`, '0100',
  'Sente com o rolo atrás dos tornozelos e trave a coxa com o apoio.|Flexione os joelhos levando o rolo para baixo.|Volte devagar até quase estender.',
  'Ajustar o encosto para o joelho ficar no eixo da máquina.', [0.45, 0.3]);
ex('ex57', 'Elevação Pélvica com Barra', 'barra_livre', 'intermediario', 'elevacao_pelvica', 'apoiado',
  `P:gluteo_maximo;S:${ISQ} gluteo_medio;E:${CORE}`, '1100',
  'Parte superior das costas apoiada no banco, barra sobre o quadril com proteção.|Empurre o quadril para cima até o tronco ficar alinhado às coxas.|Contraia o glúteo no topo e desça controlando.',
  'Não hiperestender a lombar no topo; queixo levemente recolhido.', [1.0, 0.9]);
ex('ex58', 'Cadeira Abdutora', 'maquina', 'basico', 'abducao_quadril', 'sentado',
  'P:gluteo_medio;S:gluteo_maximo', '0000',
  'Sente com as costas apoiadas e as almofadas por fora dos joelhos.|Afaste as pernas o máximo que conseguir com controle.|Volte devagar sem deixar o peso bater.',
  'Movimento controlado, sem impulso do tronco.', [0.7, 0.6]);
ex('ex59', 'Cadeira Adutora', 'maquina', 'basico', 'aducao_quadril', 'sentado',
  'P:adutores', '0000',
  'Sente com as almofadas por dentro dos joelhos.|Aproxime as pernas contraindo a parte interna da coxa.|Volte devagar até sentir um leve alongamento.',
  'Ajustar a abertura inicial para não forçar a virilha.', [0.7, 0.55]);
ex('ex60', 'Glúteo no Cabo (Coice)', 'cabo', 'basico', 'coice', 'em_pe',
  `P:gluteo_maximo;S:${ISQ};E:${CORE}`, '1000',
  'Prenda a tornozeleira no cabo baixo e apoie as mãos na máquina.|Leve a perna para trás estendendo o quadril.|Volte controlando, sem arquear a lombar.',
  'O movimento vem do quadril, não da lombar.', [0.15, 0.12], { unilateral: true });
ex('ex62', 'Panturrilha Sentado', 'maquina', 'basico', 'panturrilha_sentado', 'sentado',
  'P:soleo;S:gastrocnemio', '0000',
  'Sente com a almofada sobre as coxas, perto dos joelhos.|Desça os calcanhares até alongar.|Suba na ponta dos pés e segure 1 segundo.',
  'Amplitude completa e ritmo controlado.', [0.6, 0.45]);

/* ---- Peito ---- */
ex('ex06', 'Supino Reto com Barra', 'barra_livre', 'intermediario', 'supino', 'deitado',
  'P:peito_medio;S:peito_superior peito_inferior deltoide_anterior triceps_cabeca_lateral triceps_cabeca_medial', '0021',
  'Deite com os olhos sob a barra, escápulas encaixadas e pés firmes no chão.|Desça a barra controlando até tocar a linha do peito.|Empurre de volta até estender os cotovelos sem travar.',
  'Usar travas de segurança ou ajudante. Escápulas retraídas durante todo o movimento.', [0.7, 0.4]);
ex('ex07', 'Supino Inclinado com Halteres', 'haltere', 'intermediario', 'supino_inclinado', 'inclinado',
  'P:peito_superior;S:deltoide_anterior peito_medio triceps_cabeca_lateral', '0021',
  'Banco inclinado entre 30° e 45°, halteres na linha do peito.|Empurre os halteres para cima, aproximando-os no topo.|Desça devagar com os cotovelos a cerca de 75° do tronco.',
  'Não deixar os cotovelos abrirem a 90°. Controlar a descida.', [0.22, 0.12]);
ex('ex16', 'Supino Inclinado com Barra', 'barra_livre', 'intermediario', 'supino_inclinado', 'inclinado',
  'P:peito_superior;S:deltoide_anterior peito_medio triceps_cabeca_lateral triceps_cabeca_medial', '0021',
  'Banco a 30°–45°, barra acima dos ombros.|Desça a barra até a parte alta do peito.|Empurre de volta mantendo as escápulas encaixadas.',
  'Usar travas de segurança. Evitar banco muito inclinado (vira exercício de ombro).', [0.6, 0.35]);
ex('ex17', 'Supino Declinado com Barra', 'barra_livre', 'intermediario', 'supino_declinado', 'deitado',
  'P:peito_inferior;S:peito_medio triceps_cabeca_lateral triceps_cabeca_medial', '0011',
  'Prenda as pernas no apoio do banco declinado.|Desça a barra até a parte baixa do peito.|Empurre de volta sem travar os cotovelos.',
  'Sempre com ajudante: sair do banco declinado com carga é difícil.', [0.7, 0.4]);
ex('ex18', 'Supino Reto com Halteres', 'haltere', 'basico', 'supino', 'deitado',
  'P:peito_medio;S:peito_superior peito_inferior deltoide_anterior triceps_cabeca_lateral', '0011',
  'Deite com um halter em cada mão na linha do peito.|Empurre para cima aproximando os halteres.|Desça controlando até sentir o peito alongar.',
  'Permite amplitude maior que a barra; não exagere na descida.', [0.25, 0.14]);
ex('ex19', 'Crucifixo com Halteres', 'haltere', 'intermediario', 'crucifixo', 'deitado',
  'P:peito_medio;S:peito_superior deltoide_anterior', '0021',
  'Deitado, halteres acima do peito com os cotovelos levemente flexionados.|Abra os braços em arco até sentir o peito alongar.|Feche o arco contraindo o peito, sem dobrar mais os cotovelos.',
  'Use cargas moderadas: o ombro fica vulnerável na abertura máxima.', [0.12, 0.07]);
ex('ex20', 'Crossover (de cima para baixo)', 'cabo', 'intermediario', 'crossover', 'em_pe',
  'P:peito_inferior;S:peito_medio deltoide_anterior', '0010',
  'Polias no alto, um passo à frente com o tronco levemente inclinado.|Traga as mãos para baixo e para o centro, à frente do quadril.|Volte abrindo os braços devagar.',
  'Cotovelos fixos levemente flexionados durante todo o movimento.', [0.15, 0.08]);
ex('ex21', 'Crossover (de baixo para cima)', 'cabo', 'intermediario', 'crossover', 'em_pe',
  'P:peito_superior;S:deltoide_anterior peito_medio', '0010',
  'Polias embaixo, palmas para cima.|Eleve as mãos em arco até a altura do queixo, juntando-as.|Volte controlando.',
  'Evitar compensar com a lombar.', [0.12, 0.07]);
ex('ex22', 'Voador (Peck Deck)', 'maquina', 'basico', 'peck_deck', 'sentado',
  'P:peito_medio;S:peito_superior deltoide_anterior', '0010',
  'Ajuste o banco para as pegadas ficarem na altura do peito.|Feche os braços à frente contraindo o peito.|Abra devagar até sentir um leve alongamento.',
  'Não deixar os braços passarem muito da linha do corpo na abertura.', [0.5, 0.3]);
ex('ex23', 'Flexão de Braços', 'peso_corporal', 'basico', 'flexao_bracos', 'apoiado',
  `P:peito_medio;S:deltoide_anterior ${TRI};E:${CORE}`, '0011',
  'Mãos um pouco mais abertas que os ombros, corpo em linha reta.|Desça o peito até perto do chão com os cotovelos a cerca de 45°.|Empurre o chão até estender os braços.',
  'Mantenha o abdômen firme para o quadril não cair. Pode apoiar os joelhos para facilitar.', undefined);
ex('ex24', 'Mergulho nas Paralelas', 'peso_corporal', 'avancado', 'mergulho', 'suspenso',
  `P:peito_inferior ${TRI};S:deltoide_anterior`, '0022',
  'Apoie-se nas barras com os braços estendidos e o tronco levemente inclinado.|Desça flexionando os cotovelos até cerca de 90°.|Empurre de volta até estender os braços.',
  'Exige ombros saudáveis. Não descer além do confortável.', undefined);
ex('ex25', 'Supino Máquina (Chest Press)', 'maquina', 'basico', 'chest_press', 'sentado',
  'P:peito_medio;S:deltoide_anterior triceps_cabeca_lateral', '0010',
  'Ajuste o banco para as pegadas ficarem na linha do peito.|Empurre à frente até quase estender os cotovelos.|Volte controlando.',
  'Boa opção para iniciantes e para treinar perto da falha com segurança.', [0.6, 0.35]);

/* ---- Costas ---- */
ex('ex08', 'Remada Curvada com Barra', 'barra_livre', 'intermediario', 'remada_curvada', 'em_pe',
  'P:latissimo romboides;S:trapezio_medio deltoide_posterior biceps_cabeca_longa braquial;E:eretores_espinha', '2101',
  'Tronco inclinado à frente, coluna neutra, joelhos levemente flexionados.|Puxe a barra em direção ao umbigo aproximando as escápulas.|Desça a barra controlando, sem perder a postura.',
  'Coluna neutra durante toda a série. Exige técnica: considerar a remada apoiada se houver dor lombar.', [0.6, 0.35]);
ex('ex09', 'Puxada Frontal', 'cabo', 'basico', 'puxada', 'sentado',
  'P:latissimo;S:redondo_maior biceps_cabeca_longa braquial romboides trapezio_inferior', '0011',
  'Sente com as coxas presas, pegada um pouco mais aberta que os ombros.|Puxe a barra até a parte alta do peito, levando os cotovelos para baixo.|Volte controlando até estender os braços.',
  'Não puxar atrás da nuca. Evitar jogar o tronco para trás.', [0.6, 0.4]);
ex('ex26', 'Barra Fixa', 'peso_corporal', 'avancado', 'barra_fixa', 'suspenso',
  'P:latissimo;S:redondo_maior biceps_cabeca_longa biceps_cabeca_curta braquial trapezio_inferior romboides', '0021',
  'Pendure-se com pegada pronada um pouco mais aberta que os ombros.|Puxe o corpo até o queixo passar a barra.|Desça devagar até estender os braços.',
  'Pode usar elástico ou máquina graviton para assistência.', undefined);
ex('ex27', 'Remada Sentada no Cabo', 'cabo', 'basico', 'remada_sentada', 'sentado',
  'P:latissimo romboides trapezio_medio;S:deltoide_posterior biceps_cabeca_longa braquial', '1001',
  'Sente com os pés apoiados e o tronco ereto, segurando o triângulo.|Puxe até o abdômen aproximando as escápulas.|Volte estendendo os braços sem curvar a coluna.',
  'O tronco fica parado: não balançar para puxar.', [0.6, 0.4]);
ex('ex28', 'Remada Unilateral com Halter (Serrote)', 'haltere', 'basico', 'remada_unilateral', 'apoiado',
  'P:latissimo;S:romboides redondo_maior deltoide_posterior biceps_cabeca_longa', '0001',
  'Joelho e mão de um lado apoiados no banco, coluna neutra.|Puxe o halter em direção ao quadril.|Desça até estender o braço.',
  'Apoio no banco reduz a carga na lombar.', [0.3, 0.18], { unilateral: true });
ex('ex29', 'Pulldown com Braços Estendidos', 'cabo', 'intermediario', 'pulldown_estendido', 'em_pe',
  'P:latissimo;S:redondo_maior triceps_cabeca_longa', '0010',
  'De frente para a polia alta, braços estendidos à frente.|Leve a barra até as coxas em arco, sem dobrar os cotovelos.|Volte devagar até a altura dos olhos.',
  'Tronco levemente inclinado e fixo.', [0.3, 0.18]);
ex('ex30', 'Remada Cavalinho', 'barra_livre', 'intermediario', 'remada_curvada', 'em_pe',
  'P:latissimo romboides trapezio_medio;S:deltoide_posterior biceps_cabeca_longa;E:eretores_espinha', '2001',
  'Tronco inclinado sobre a barra, segurando a pegada.|Puxe em direção ao peito aproximando as escápulas.|Desça controlando sem arredondar as costas.',
  'Coluna neutra. Preferir a versão com apoio de peito se houver dor lombar.', [0.5, 0.3]);
ex('ex31', 'Levantamento Terra', 'barra_livre', 'avancado', 'hinge', 'em_pe',
  `P:eretores_espinha gluteo_maximo ${ISQ};S:${QUAD} trapezio_superior latissimo flexores_antebraco;E:${CORE}`, '2100',
  'Barra sobre o meio do pé, quadril para trás e coluna neutra.|Empurre o chão e estenda quadril e joelhos ao mesmo tempo, barra rente às pernas.|Desça a barra controlando pelo mesmo caminho.',
  'Exercício técnico: aprenda com um profissional. Nunca arredondar a lombar.', [1.1, 0.75]);
ex('ex32', 'Hiperextensão Lombar', 'peso_corporal', 'basico', 'hiperextensao', 'apoiado',
  `P:eretores_espinha;S:gluteo_maximo ${ISQ}`, '1000',
  'Apoie o quadril no banco romano com os pés presos.|Desça o tronco com a coluna neutra.|Suba até alinhar o tronco às pernas, sem passar disso.',
  'Não hiperestender no topo. Movimento lento.', undefined);

/* ---- Ombros e trapézio ---- */
ex('ex10', 'Desenvolvimento com Halteres', 'haltere', 'intermediario', 'desenvolvimento', 'sentado',
  'P:deltoide_anterior;S:deltoide_lateral triceps_cabeca_lateral trapezio_superior', '1021',
  'Sentado com encosto, halteres na altura das orelhas.|Empurre para cima até quase estender os braços.|Desça controlando até a linha das orelhas.',
  'Não arquear a lombar. Subir sem travar os cotovelos.', [0.17, 0.09]);
ex('ex33', 'Desenvolvimento Militar com Barra', 'barra_livre', 'avancado', 'desenvolvimento', 'em_pe',
  `P:deltoide_anterior;S:deltoide_lateral ${TRI} trapezio_superior;E:${CORE} eretores_espinha`, '1021',
  'Em pé, barra apoiada na parte alta do peito.|Empurre a barra para cima passando rente ao rosto.|Desça controlando até o peito.',
  'Glúteos e abdômen contraídos para não arquear a lombar.', [0.45, 0.25]);
ex('ex34', 'Desenvolvimento na Máquina', 'maquina', 'basico', 'desenvolvimento', 'sentado',
  'P:deltoide_anterior;S:deltoide_lateral triceps_cabeca_lateral', '0011',
  'Ajuste o banco para as pegadas ficarem na altura dos ombros.|Empurre para cima sem travar os cotovelos.|Volte controlando.',
  'Costas apoiadas no encosto.', [0.4, 0.22]);
ex('ex11', 'Elevação Lateral com Halteres', 'haltere', 'basico', 'elevacao_lateral', 'em_pe',
  'P:deltoide_lateral;S:trapezio_superior deltoide_anterior', '0010',
  'Em pé, halteres ao lado do corpo e cotovelos levemente flexionados.|Eleve os braços para os lados até a linha dos ombros.|Desça devagar.',
  'Não elevar acima da linha do ombro nem balançar o tronco.', [0.07, 0.04]);
ex('ex35', 'Elevação Lateral no Cabo', 'cabo', 'basico', 'elevacao_lateral', 'em_pe',
  'P:deltoide_lateral;S:trapezio_superior', '0010',
  'Lado do corpo para a polia baixa, segurando o cabo com a mão oposta.|Eleve o braço para o lado até a linha do ombro.|Desça controlando.',
  'O cabo mantém tensão constante: use carga leve.', [0.05, 0.03], { unilateral: true });
ex('ex36', 'Elevação Frontal com Halteres', 'haltere', 'basico', 'elevacao_frontal', 'em_pe',
  'P:deltoide_anterior;S:peito_superior deltoide_lateral', '0010',
  'Em pé, halteres à frente das coxas.|Eleve os braços à frente até a altura dos ombros.|Desça devagar.',
  'Sem balançar o tronco.', [0.08, 0.05]);
ex('ex37', 'Crucifixo Inverso', 'haltere', 'basico', 'crucifixo_inverso', 'inclinado',
  'P:deltoide_posterior;S:romboides trapezio_medio manguito_rotador', '1010',
  'Tronco inclinado à frente (ou deitado de bruços em banco inclinado).|Abra os braços para os lados com os cotovelos levemente flexionados.|Volte controlando.',
  'Carga leve e coluna neutra.', [0.06, 0.04]);
ex('ex38', 'Face Pull no Cabo', 'cabo', 'intermediario', 'face_pull', 'em_pe',
  'P:deltoide_posterior manguito_rotador;S:trapezio_medio romboides', '0010',
  'Polia na altura do rosto, corda com pegada neutra.|Puxe em direção ao rosto abrindo os cotovelos e girando as mãos para trás.|Volte devagar.',
  'Ótimo para a saúde do ombro. Carga moderada.', [0.25, 0.15]);
ex('ex39', 'Encolhimento com Halteres', 'haltere', 'basico', 'encolhimento', 'em_pe',
  'P:trapezio_superior;S:flexores_antebraco', '0000',
  'Em pé, halteres ao lado do corpo.|Eleve os ombros em direção às orelhas.|Segure 1 segundo e desça devagar.',
  'Não girar os ombros: movimento só para cima e para baixo.', [0.35, 0.2]);
ex('ex40', 'Rotação Externa no Cabo', 'cabo', 'basico', 'rotacao_externa', 'em_pe',
  'P:manguito_rotador;S:deltoide_posterior', '0010',
  'Cotovelo junto ao corpo flexionado a 90°, polia na altura do cotovelo.|Gire o antebraço para fora mantendo o cotovelo colado.|Volte devagar.',
  'Exercício de proteção do ombro: carga bem leve.', [0.04, 0.03], { unilateral: true });

/* ---- Braços ---- */
ex('ex12', 'Rosca Direta com Barra', 'barra_livre', 'basico', 'rosca', 'em_pe',
  `P:${BIC};S:braquial braquiorradial;E:deltoide_anterior`, '0002',
  'Em pé, barra com pegada supinada na largura dos ombros.|Flexione os cotovelos trazendo a barra até o peito.|Desça devagar até estender os braços.',
  'Cotovelos fixos ao lado do corpo, sem balançar o tronco.', [0.35, 0.2]);
ex('ex41', 'Rosca Alternada com Halteres', 'haltere', 'basico', 'rosca', 'em_pe',
  'P:biceps_cabeca_longa biceps_cabeca_curta;S:braquial braquiorradial', '0001',
  'Em pé, halteres ao lado do corpo com as palmas para dentro.|Suba um halter girando a palma para cima.|Desça devagar e alterne os braços.',
  'Cotovelos colados ao corpo.', [0.15, 0.08]);
ex('ex42', 'Rosca Martelo', 'haltere', 'basico', 'rosca', 'em_pe',
  'P:braquiorradial braquial;S:biceps_cabeca_longa', '0001',
  'Em pé, halteres com pegada neutra (palmas para dentro).|Suba os halteres sem girar o punho.|Desça devagar.',
  'Movimento controlado, sem impulso.', [0.15, 0.09]);
ex('ex43', 'Rosca Scott', 'barra_livre', 'intermediario', 'rosca_scott', 'sentado',
  'P:biceps_cabeca_curta braquial;S:biceps_cabeca_longa', '0002',
  'Braços apoiados no banco Scott, barra W com pegada supinada.|Suba a barra até o bíceps contrair.|Desça devagar sem estender totalmente com tranco.',
  'Não soltar o peso no fim da descida: o cotovelo fica vulnerável.', [0.3, 0.17]);
ex('ex44', 'Rosca Inclinada com Halteres', 'haltere', 'intermediario', 'rosca_inclinada', 'inclinado',
  'P:biceps_cabeca_longa;S:biceps_cabeca_curta braquial', '0011',
  'Banco a cerca de 45°, braços pendurados para trás do tronco.|Flexione os cotovelos sem mover os ombros.|Desça devagar até estender.',
  'Carga moderada: a posição alonga bastante o bíceps.', [0.12, 0.07]);
ex('ex45', 'Rosca no Cabo', 'cabo', 'basico', 'rosca', 'em_pe',
  'P:biceps_cabeca_curta biceps_cabeca_longa;S:braquial', '0001',
  'De frente para a polia baixa com a barra reta.|Flexione os cotovelos até a barra chegar ao peito.|Volte devagar.',
  'Tensão constante; cotovelos fixos.', [0.3, 0.17]);
ex('ex13', 'Tríceps Corda no Cabo', 'cabo', 'basico', 'triceps_polia', 'em_pe',
  'P:triceps_cabeca_lateral;S:triceps_cabeca_medial triceps_cabeca_longa', '0001',
  'De frente para a polia alta, corda na altura do peito.|Estenda os cotovelos abrindo a corda no final.|Volte até cerca de 90° sem mover os cotovelos.',
  'Cotovelos fixos ao lado do corpo.', [0.3, 0.18]);
ex('ex46', 'Tríceps Testa com Barra', 'barra_livre', 'intermediario', 'triceps_testa', 'deitado',
  'P:triceps_cabeca_longa;S:triceps_cabeca_lateral triceps_cabeca_medial', '0012',
  'Deitado, barra W acima do peito com os braços estendidos.|Flexione os cotovelos levando a barra em direção à testa.|Estenda de volta sem abrir os cotovelos.',
  'Controle total da descida; cotovelos apontados para cima.', [0.3, 0.17]);
ex('ex47', 'Tríceps Francês com Halter', 'haltere', 'intermediario', 'triceps_frances', 'sentado',
  'P:triceps_cabeca_longa;S:triceps_cabeca_lateral', '0122',
  'Sentado, segure um halter com as duas mãos acima da cabeça.|Desça o halter atrás da cabeça flexionando os cotovelos.|Estenda de volta.',
  'Exige boa mobilidade do ombro. Evitar se houver dor no ombro ou no cotovelo.', [0.2, 0.12]);
ex('ex48', 'Tríceps Barra na Polia (Pushdown)', 'cabo', 'basico', 'triceps_polia', 'em_pe',
  'P:triceps_cabeca_lateral triceps_cabeca_medial;S:triceps_cabeca_longa', '0001',
  'De frente para a polia alta, barra reta com pegada pronada.|Estenda os cotovelos até os braços ficarem retos.|Volte controlando.',
  'Cotovelos colados no corpo.', [0.35, 0.2]);
ex('ex49', 'Supino Fechado', 'barra_livre', 'intermediario', 'supino', 'deitado',
  'P:triceps_cabeca_lateral triceps_cabeca_medial;S:peito_medio deltoide_anterior triceps_cabeca_longa', '0012',
  'Deitado, pegada na largura dos ombros.|Desça a barra até a parte baixa do peito com os cotovelos junto ao corpo.|Empurre de volta.',
  'Não fechar demais a pegada (sobrecarrega os punhos).', [0.55, 0.3]);
ex('ex50', 'Tríceps no Banco', 'peso_corporal', 'basico', 'triceps_banco', 'apoiado',
  `P:${TRI};S:deltoide_anterior peito_inferior`, '0021',
  'Mãos apoiadas na borda de um banco atrás do corpo, pernas à frente.|Desça o corpo flexionando os cotovelos até cerca de 90°.|Empurre de volta.',
  'Não descer demais: estressa a parte da frente do ombro.', undefined);
ex('ex51', 'Rosca de Punho', 'barra_livre', 'basico', 'rosca_punho', 'sentado',
  'P:flexores_antebraco', '0001',
  'Sentado, antebraços apoiados nas coxas e palmas para cima.|Flexione os punhos subindo a barra.|Desça devagar.',
  'Carga leve e amplitude confortável.', [0.2, 0.12]);
ex('ex52', 'Rosca Inversa', 'barra_livre', 'basico', 'rosca', 'em_pe',
  'P:braquiorradial extensores_antebraco;S:braquial biceps_cabeca_longa', '0002',
  'Em pé, barra com pegada pronada (palmas para baixo).|Flexione os cotovelos subindo a barra.|Desça devagar.',
  'Use carga menor que na rosca direta.', [0.25, 0.14]);

/* ---- Abdômen ---- */
ex('ex64', 'Abdominal Supra', 'peso_corporal', 'basico', 'abdominal', 'deitado',
  'P:reto_abdominal_superior;S:reto_abdominal_inferior obliquos', '1000',
  'Deitado com os joelhos flexionados e os pés no chão.|Enrole o tronco tirando as escápulas do chão.|Volte devagar.',
  'Não puxar a cabeça com as mãos.', undefined);
ex('ex65', 'Elevação de Pernas', 'peso_corporal', 'intermediario', 'elevacao_pernas', 'deitado',
  'P:reto_abdominal_inferior;S:obliquos transverso', '1000',
  'Deitado, mãos ao lado do corpo e pernas estendidas.|Eleve as pernas até formar 90° com o tronco.|Desça devagar sem deixar a lombar sair do chão.',
  'Se a lombar arquear, flexione os joelhos.', undefined);
ex('ex66', 'Prancha', 'peso_corporal', 'basico', 'prancha', 'apoiado',
  'P:transverso;S:reto_abdominal_superior reto_abdominal_inferior obliquos;E:deltoide_anterior gluteo_maximo', '0010',
  'Apoie antebraços e pontas dos pés, corpo em linha reta.|Contraia abdômen e glúteos sem prender a respiração.|Mantenha a posição pelo tempo definido.',
  'Quadril alinhado: nem empinado, nem caído.', undefined, { isometrico: true });
ex('ex67', 'Abdominal Bicicleta', 'peso_corporal', 'basico', 'rotacao_tronco', 'deitado',
  'P:obliquos;S:reto_abdominal_superior reto_abdominal_inferior', '1000',
  'Deitado, mãos atrás da cabeça e pernas elevadas.|Leve um cotovelo em direção ao joelho oposto, estendendo a outra perna.|Alterne os lados de forma controlada.',
  'Movimento lento; o giro vem do tronco.', undefined);
ex('ex68', 'Abdominal na Polia', 'cabo', 'intermediario', 'abdominal', 'apoiado',
  'P:reto_abdominal_superior;S:reto_abdominal_inferior obliquos', '1000',
  'Ajoelhado de frente para a polia alta, corda junto à cabeça.|Enrole o tronco levando os cotovelos em direção às coxas.|Volte devagar.',
  'O quadril fica parado; quem se move é o tronco.', [0.4, 0.25]);
ex('ex69', 'Prancha Lateral', 'peso_corporal', 'basico', 'prancha_lateral', 'apoiado',
  'P:obliquos;S:transverso gluteo_medio', '0010',
  'Deitado de lado, apoie o antebraço com o cotovelo sob o ombro.|Eleve o quadril deixando o corpo em linha reta.|Mantenha a posição e troque de lado.',
  'Não deixar o quadril cair.', undefined, { isometrico: true, unilateral: true });

/** Rótulos e incrementos de carga por equipamento. */
export const equipLabels: Record<Equipamento, string> = {
  barra_livre: 'Barra livre',
  maquina: 'Máquina',
  haltere: 'Halteres',
  cabo: 'Cabo',
  peso_corporal: 'Peso corporal',
};

/** Menor salto de carga usual (kg). Halteres: por halter. */
export const incrementoCarga: Record<Equipamento, number> = {
  barra_livre: 2,
  maquina: 5,
  haltere: 2,
  cabo: 2.5,
  peso_corporal: 0,
};

export const posturaLabels: Record<Postura, string> = {
  em_pe: 'Em pé',
  sentado: 'Sentado',
  deitado: 'Deitado',
  inclinado: 'Inclinado',
  apoiado: 'Apoiado',
  suspenso: 'Suspenso',
};

export const dificLabels: Record<Dificuldade, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const papelLabels: Record<MusculoPapel, string> = {
  primario: 'Primário',
  secundario: 'Secundário',
  estabilizador: 'Estabilizador',
};

export const papelColors: Record<MusculoPapel, string> = {
  primario: 'var(--color-muscle)',
  secundario: 'var(--color-muscle-secondary)',
  estabilizador: 'var(--color-routine)',
};

export const articulacaoLabels: Record<'lombar' | 'joelho' | 'ombro' | 'cotovelo', string> = {
  lombar: 'Lombar',
  joelho: 'Joelhos',
  ombro: 'Ombros',
  cotovelo: 'Cotovelos e punhos',
};

export const estresseLabels = ['Baixo', 'Moderado', 'Alto'] as const;
