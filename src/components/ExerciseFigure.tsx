import { useEffect, useRef, useState } from 'react';
import type { Equipamento, PadraoMovimento, Postura } from '../data/types';

/*
 * Boneco animado que executa o exercício.
 * Cinemática direta 2D: cada pose define ângulos absolutos dos segmentos
 * (graus a partir da vertical para cima, sentido horário; o boneco olha para a direita).
 * Um ponto da cadeia (ponta do pé, quadril ou mão) fica fixo e o resto é calculado.
 */

type Ang = {
  pe?: number; canela?: number; coxa?: number; tronco?: number; braco?: number; antebraco?: number; punho?: number;
  coxa2?: number; canela2?: number; pe2?: number;
};
type Ancora = 'ponta' | 'tornozelo' | 'quadril' | 'mao' | 'ombro';
type Destaque = 'coxa' | 'canela' | 'tronco' | 'braco' | 'antebraco' | 'quadril' | 'coxa2';
type Carga = 'barra_costas' | 'barra_mao' | 'halter_mao' | 'halter_peito' | 'barra_quadril' | 'nenhuma';

interface Lateral {
  vista: 'lado';
  ancora: Ancora;
  ponto: [number, number];
  a: Ang;
  b: Ang;
  destaque: Destaque[];
  /** Perna de trás/de trabalho (afundo, coice). */
  perna2?: boolean;
  carga?: Carga;
  /** Cabo: da mão (ou tornozelo 2) até a polia. */
  cabo?: { de: 'mao' | 'tornozelo2'; polia: [number, number] };
  props?: Prop[];
}

interface Frontal {
  vista: 'frente';
  sentado?: boolean;
  /** Abdução do braço (0 = para baixo, 90 = horizontal), início e fim. */
  bracoA: number; bracoB: number;
  /** Ângulo extra do antebraço em relação ao braço. */
  cotoveloA?: number; cotoveloB?: number;
  /** Abdução das pernas (graus), início e fim. */
  pernaA?: number; pernaB?: number;
  /** Elevação dos ombros (px). */
  ombrosA?: number; ombrosB?: number;
  destaque: ('ombro' | 'braco' | 'antebraco' | 'peito' | 'coxa' | 'trapezio')[];
  carga?: 'halter' | 'cabo' | 'nenhuma';
}

type Prop =
  | { t: 'banco'; x: number; y: number; w: number; ang?: number }
  | { t: 'assento'; x: number; y: number; w: number; encosto?: number; angEncosto?: number }
  | { t: 'plataforma'; de: 'tornozelo' }
  | { t: 'barra_fixa'; y: number }
  | { t: 'paralela'; y: number }
  | { t: 'pad'; em: 'tornozelo' | 'joelho' | 'quadril'; dx?: number; dy?: number }
  | { t: 'apoio'; x: number; y: number; h: number };

type Padrao = Lateral | Frontal;

const CHAO = 182;
const L = { pe: 13, canela: 34, coxa: 37, tronco: 46, braco: 27, antebraco: 25, cabeca: 10, pescoco: 6 };
const EM_PE: Ang = { pe: 90, canela: 0, coxa: 0, tronco: 0, braco: 180, antebraco: 180 };
const SENTADO: Ang = { pe: 90, canela: 0, coxa: 270, tronco: 0 };

function lado(p: Omit<Lateral, 'vista'>): Lateral { return { vista: 'lado', ...p }; }

/** Pernas e tronco para exercícios de membros superiores, conforme a postura. */
function base(postura: Postura): { ancora: Ancora; ponto: [number, number]; ang: Ang; props: Prop[] } {
  if (postura === 'sentado') {
    return { ancora: 'quadril', ponto: [82, 128], ang: { ...SENTADO }, props: [{ t: 'assento', x: 60, y: 132, w: 40, encosto: 56 }] };
  }
  return { ancora: 'tornozelo', ponto: [96, CHAO - 4], ang: { ...EM_PE }, props: [] };
}

function padraoDe(padrao: PadraoMovimento, postura: Postura, equip: Equipamento): Padrao {
  const halter = equip === 'haltere';
  const cabo = equip === 'cabo';
  const maoCarga: Carga = halter ? 'halter_mao' : equip === 'barra_livre' ? 'barra_mao' : 'nenhuma';
  switch (padrao) {
    case 'agachamento':
      return lado({
        ancora: 'tornozelo', ponto: [96, CHAO - 4],
        a: equip === 'barra_livre' ? { ...EM_PE, braco: 215, antebraco: 25 } : { ...EM_PE, braco: 160, antebraco: 20 },
        b: equip === 'barra_livre'
          ? { pe: 90, canela: 32, coxa: -78, tronco: 40, braco: 235, antebraco: 45 }
          : { pe: 90, canela: 32, coxa: -78, tronco: 28, braco: 185, antebraco: 45 },
        destaque: ['coxa'], carga: equip === 'barra_livre' ? 'barra_costas' : halter ? 'halter_peito' : 'nenhuma',
        props: equip === 'maquina' ? [{ t: 'apoio', x: 64, y: 70, h: 100 }] : [],
      });
    case 'leg_press':
      return lado({
        ancora: 'quadril', ponto: [70, 136],
        a: { tronco: 300, coxa: 228, canela: 228, pe: 45, braco: 150, antebraco: 120 },
        b: { tronco: 300, coxa: 196, canela: 258, pe: 45, braco: 150, antebraco: 120 },
        destaque: ['coxa'], props: [{ t: 'assento', x: 52, y: 140, w: 34, encosto: 50, angEncosto: -55 }, { t: 'plataforma', de: 'tornozelo' }],
      });
    case 'avanco':
      return lado({
        ancora: 'tornozelo', ponto: [116, CHAO - 4], perna2: true,
        a: { pe: 90, canela: 6, coxa: -12, tronco: 2, braco: 180, antebraco: 180, coxa2: 18, canela2: 52, pe2: 120 },
        b: { pe: 90, canela: 20, coxa: -78, tronco: 6, braco: 180, antebraco: 180, coxa2: 40, canela2: 86, pe2: 150 },
        destaque: ['coxa'], carga: maoCarga,
      });
    case 'extensao_joelho':
      return lado({
        ancora: 'quadril', ponto: [80, 120],
        a: { tronco: 352, coxa: 270, canela: 0, pe: 90, braco: 175, antebraco: 160 },
        b: { tronco: 352, coxa: 270, canela: 268, pe: 0, braco: 175, antebraco: 160 },
        destaque: ['coxa'], props: [{ t: 'assento', x: 60, y: 124, w: 46, encosto: 56 }, { t: 'pad', em: 'tornozelo', dx: 2, dy: -6 }],
      });
    case 'flexao_joelho_sentado':
      return lado({
        ancora: 'quadril', ponto: [80, 120],
        a: { tronco: 352, coxa: 270, canela: 252, pe: 0, braco: 175, antebraco: 160 },
        b: { tronco: 352, coxa: 270, canela: 18, pe: 100, braco: 175, antebraco: 160 },
        destaque: ['coxa'], props: [{ t: 'assento', x: 60, y: 124, w: 46, encosto: 56 }, { t: 'pad', em: 'tornozelo', dx: 2, dy: 6 }],
      });
    case 'flexao_joelho_deitado':
      return lado({
        ancora: 'quadril', ponto: [96, 112],
        a: { tronco: 268, coxa: 268, canela: 268, pe: 180, braco: 180, antebraco: 160 },
        b: { tronco: 268, coxa: 268, canela: 175, pe: 270, braco: 180, antebraco: 160 },
        destaque: ['coxa'], props: [{ t: 'banco', x: 40, y: 120, w: 96 }, { t: 'pad', em: 'tornozelo', dy: 8 }],
      });
    case 'hinge':
      return lado({
        ancora: 'tornozelo', ponto: [96, CHAO - 4],
        a: { ...EM_PE, braco: 180, antebraco: 180 },
        b: { pe: 90, canela: 10, coxa: -24, tronco: 78, braco: 176, antebraco: 178 },
        destaque: ['coxa', 'quadril'], carga: halter ? 'halter_mao' : 'barra_mao',
      });
    case 'elevacao_pelvica':
      return lado({
        ancora: 'tornozelo', ponto: [124, CHAO - 4],
        a: { pe: 90, canela: -6, coxa: 236, tronco: 290, braco: 120, antebraco: 60 },
        b: { pe: 90, canela: -6, coxa: 270, tronco: 270, braco: 120, antebraco: 60 },
        destaque: ['quadril'], carga: equip === 'barra_livre' ? 'barra_quadril' : 'nenhuma',
        props: [{ t: 'banco', x: 14, y: 156, w: 44 }],
      });
    case 'panturrilha_em_pe':
      return lado({
        ancora: 'ponta', ponto: [108, CHAO - 2],
        a: { pe: 98, canela: 0, coxa: 0, tronco: 0, braco: 215, antebraco: 25 },
        b: { pe: 140, canela: 0, coxa: 0, tronco: 0, braco: 215, antebraco: 25 },
        destaque: ['canela'], props: [{ t: 'apoio', x: 98, y: CHAO - 2, h: 0 }],
      });
    case 'panturrilha_sentado':
      return lado({
        ancora: 'ponta', ponto: [112, CHAO - 6],
        a: { pe: 100, canela: 0, coxa: 270, tronco: 0, braco: 160, antebraco: 100 },
        b: { pe: 140, canela: 0, coxa: 270, tronco: 0, braco: 160, antebraco: 100 },
        destaque: ['canela'], props: [{ t: 'pad', em: 'joelho', dy: -8 }, { t: 'assento', x: 58, y: 146, w: 40 }],
      });
    case 'coice':
      return lado({
        ancora: 'tornozelo', ponto: [104, CHAO - 4], perna2: true,
        a: { pe: 90, canela: 0, coxa: 0, tronco: 32, braco: 140, antebraco: 140, coxa2: 4, canela2: 4, pe2: 90 },
        b: { pe: 90, canela: 0, coxa: 0, tronco: 32, braco: 140, antebraco: 140, coxa2: 62, canela2: 66, pe2: 150 },
        destaque: ['coxa2'], cabo: { de: 'tornozelo2', polia: [16, CHAO - 10] },
      });
    case 'supino': case 'chest_press': {
      if (padrao === 'chest_press') {
        const bs = base('sentado');
        return lado({
          ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['braco'],
          a: { ...bs.ang, braco: 250, antebraco: 92 }, b: { ...bs.ang, braco: 92, antebraco: 90 },
        });
      }
      return lado({
        ancora: 'quadril', ponto: [118, 122],
        a: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 0, antebraco: 0 },
        b: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 150, antebraco: 12 },
        destaque: ['braco', 'tronco'], carga: maoCarga, props: [{ t: 'banco', x: 40, y: 128, w: 92 }],
      });
    }
    case 'supino_inclinado':
      return lado({
        ancora: 'quadril', ponto: [106, 130],
        a: { tronco: 300, coxa: 262, canela: 0, pe: 90, braco: 6, antebraco: 6 },
        b: { tronco: 300, coxa: 262, canela: 0, pe: 90, braco: 168, antebraco: 18 },
        destaque: ['braco', 'tronco'], carga: maoCarga, props: [{ t: 'banco', x: 62, y: 136, w: 48, ang: -32 }],
      });
    case 'supino_declinado':
      return lado({
        ancora: 'quadril', ponto: [112, 112],
        a: { tronco: 252, coxa: 230, canela: 330, pe: 60, braco: 0, antebraco: 0 },
        b: { tronco: 252, coxa: 230, canela: 330, pe: 60, braco: 145, antebraco: 10 },
        destaque: ['braco', 'tronco'], carga: maoCarga, props: [{ t: 'banco', x: 46, y: 126, w: 76, ang: 14 }],
      });
    case 'crucifixo':
      return lado({
        ancora: 'quadril', ponto: [118, 122],
        a: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 4, antebraco: 14 },
        b: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 108, antebraco: 90 },
        destaque: ['tronco', 'braco'], carga: 'halter_mao', props: [{ t: 'banco', x: 40, y: 128, w: 92 }],
      });
    case 'crossover':
      return { vista: 'frente', bracoA: 120, bracoB: 18, cotoveloA: -10, cotoveloB: -18, destaque: ['peito', 'ombro'], carga: 'cabo' };
    case 'peck_deck':
      return { vista: 'frente', sentado: true, bracoA: 92, bracoB: 70, cotoveloA: 40, cotoveloB: 100, destaque: ['peito'], carga: 'nenhuma' };
    case 'flexao_bracos':
      return lado({
        ancora: 'ponta', ponto: [34, CHAO - 2],
        a: { pe: 150, canela: 72, coxa: 72, tronco: 72, braco: 178, antebraco: 178 },
        b: { pe: 150, canela: 84, coxa: 84, tronco: 84, braco: 228, antebraco: 150 },
        destaque: ['tronco', 'braco'],
      });
    case 'mergulho':
      return lado({
        ancora: 'mao', ponto: [100, 96],
        a: { braco: 178, antebraco: 178, tronco: 8, coxa: 4, canela: 40, pe: 140 },
        b: { braco: 222, antebraco: 160, tronco: 20, coxa: 14, canela: 50, pe: 150 },
        destaque: ['braco', 'tronco'], props: [{ t: 'paralela', y: 96 }],
      });
    case 'remada_curvada': case 'remada_unilateral':
      return lado({
        ancora: 'tornozelo', ponto: [96, CHAO - 4],
        a: { pe: 90, canela: 10, coxa: -16, tronco: 72, braco: 182, antebraco: 180 },
        b: { pe: 90, canela: 10, coxa: -16, tronco: 72, braco: 292, antebraco: 190 },
        destaque: ['tronco', 'braco'], carga: padrao === 'remada_unilateral' || halter ? 'halter_mao' : 'barra_mao',
        props: padrao === 'remada_unilateral' ? [{ t: 'banco', x: 112, y: 140, w: 44 }] : [],
      });
    case 'remada_sentada':
      return lado({
        ancora: 'quadril', ponto: [74, 150],
        a: { tronco: 8, coxa: 262, canela: 290, pe: 20, braco: 92, antebraco: 92 },
        b: { tronco: 0, coxa: 262, canela: 290, pe: 20, braco: 238, antebraco: 92 },
        destaque: ['tronco', 'braco'], cabo: { de: 'mao', polia: [186, 128] }, props: [{ t: 'assento', x: 54, y: 154, w: 40 }],
      });
    case 'puxada':
      return lado({
        ancora: 'quadril', ponto: [86, 132],
        a: { tronco: 352, coxa: 270, canela: 0, pe: 90, braco: 6, antebraco: 6 },
        b: { tronco: 344, coxa: 270, canela: 0, pe: 90, braco: 198, antebraco: 14 },
        destaque: ['tronco', 'braco'], cabo: { de: 'mao', polia: [98, 10] },
        props: [{ t: 'assento', x: 66, y: 136, w: 40 }, { t: 'pad', em: 'joelho', dy: -10 }],
      });
    case 'barra_fixa':
      return lado({
        ancora: 'mao', ponto: [100, 10],
        a: { braco: 2, antebraco: 2, tronco: 2, coxa: 8, canela: 74, pe: 160 },
        b: { braco: 168, antebraco: 10, tronco: 8, coxa: 14, canela: 80, pe: 165 },
        destaque: ['tronco', 'braco'], props: [{ t: 'barra_fixa', y: 10 }],
      });
    case 'pulldown_estendido':
      return lado({
        ancora: 'tornozelo', ponto: [90, CHAO - 4],
        a: { ...EM_PE, tronco: 16, braco: 40, antebraco: 46 },
        b: { ...EM_PE, tronco: 16, braco: 172, antebraco: 176 },
        destaque: ['tronco'], cabo: { de: 'mao', polia: [176, 16] },
      });
    case 'hiperextensao':
      return lado({
        ancora: 'quadril', ponto: [104, 108],
        a: { tronco: 155, coxa: 62, canela: 62, pe: 150, braco: 150, antebraco: 300 },
        b: { tronco: 64, coxa: 62, canela: 62, pe: 150, braco: 210, antebraco: 340 },
        destaque: ['tronco', 'quadril'], props: [{ t: 'pad', em: 'quadril', dx: 4, dy: 8 }],
      });
    case 'desenvolvimento': {
      const bs = base(postura);
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['braco'], carga: maoCarga,
        a: { ...bs.ang, braco: 160, antebraco: 4 }, b: { ...bs.ang, braco: 6, antebraco: 2 },
      });
    }
    case 'elevacao_lateral':
      return { vista: 'frente', bracoA: 8, bracoB: 84, cotoveloA: 6, cotoveloB: 8, destaque: ['ombro'], carga: cabo ? 'cabo' : 'halter' };
    case 'elevacao_frontal': {
      const bs = base(postura);
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['braco'], carga: maoCarga,
        a: { ...bs.ang, braco: 176, antebraco: 172 }, b: { ...bs.ang, braco: 90, antebraco: 86 },
      });
    }
    case 'crucifixo_inverso':
      return lado({
        ancora: 'tornozelo', ponto: [96, CHAO - 4],
        a: { pe: 90, canela: 10, coxa: -18, tronco: 74, braco: 176, antebraco: 172 },
        b: { pe: 90, canela: 10, coxa: -18, tronco: 74, braco: 262, antebraco: 256 },
        destaque: ['braco', 'tronco'], carga: 'halter_mao',
      });
    case 'face_pull':
      return lado({
        ancora: 'tornozelo', ponto: [86, CHAO - 4],
        a: { ...EM_PE, tronco: 352, braco: 84, antebraco: 84 },
        b: { ...EM_PE, tronco: 352, braco: 262, antebraco: 40 },
        destaque: ['braco'], cabo: { de: 'mao', polia: [184, 52] },
      });
    case 'encolhimento':
      return { vista: 'frente', bracoA: 4, bracoB: 4, ombrosA: 0, ombrosB: -9, destaque: ['trapezio'], carga: 'halter' };
    case 'rotacao_externa':
      return { vista: 'frente', bracoA: 4, bracoB: 4, cotoveloA: 172, cotoveloB: 268, destaque: ['ombro'], carga: 'cabo' };
    case 'rosca': {
      const bs = base(postura);
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['braco'], carga: maoCarga,
        a: { ...bs.ang, braco: 178, antebraco: 174 }, b: { ...bs.ang, braco: 172, antebraco: 22 },
        cabo: cabo ? { de: 'mao', polia: [120, CHAO - 4] } : undefined,
      });
    }
    case 'rosca_scott': {
      const bs = base('sentado');
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, destaque: ['braco'], carga: maoCarga,
        a: { ...bs.ang, tronco: 14, braco: 140, antebraco: 136 }, b: { ...bs.ang, tronco: 14, braco: 140, antebraco: 352 },
        props: [...bs.props, { t: 'apoio', x: 104, y: 108, h: 70 }],
      });
    }
    case 'rosca_inclinada':
      return lado({
        ancora: 'quadril', ponto: [92, 132],
        a: { tronco: 320, coxa: 270, canela: 0, pe: 90, braco: 196, antebraco: 196 },
        b: { tronco: 320, coxa: 270, canela: 0, pe: 90, braco: 196, antebraco: 30 },
        destaque: ['braco'], carga: 'halter_mao', props: [{ t: 'assento', x: 72, y: 136, w: 40, encosto: 58, angEncosto: -38 }],
      });
    case 'triceps_polia':
      return lado({
        ancora: 'tornozelo', ponto: [92, CHAO - 4],
        a: { ...EM_PE, tronco: 10, braco: 172, antebraco: 30 },
        b: { ...EM_PE, tronco: 10, braco: 172, antebraco: 170 },
        destaque: ['braco'], cabo: { de: 'mao', polia: [126, 14] },
      });
    case 'triceps_testa':
      return lado({
        ancora: 'quadril', ponto: [118, 122],
        a: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 344, antebraco: 344 },
        b: { tronco: 270, coxa: 262, canela: 0, pe: 90, braco: 336, antebraco: 214 },
        destaque: ['braco'], carga: 'barra_mao', props: [{ t: 'banco', x: 40, y: 128, w: 92 }],
      });
    case 'triceps_frances': {
      const bs = base(postura);
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['braco'], carga: 'halter_mao',
        a: { ...bs.ang, braco: 356, antebraco: 358 }, b: { ...bs.ang, braco: 352, antebraco: 196 },
      });
    }
    case 'triceps_banco':
      return lado({
        ancora: 'mao', ponto: [62, 120],
        a: { braco: 196, antebraco: 186, tronco: 2, coxa: 270, canela: 0, pe: 90 },
        b: { braco: 236, antebraco: 150, tronco: 4, coxa: 262, canela: 6, pe: 90 },
        destaque: ['braco'], props: [{ t: 'banco', x: 30, y: 124, w: 40 }],
      });
    case 'rosca_punho': {
      const bs = base('sentado');
      return lado({
        ancora: bs.ancora, ponto: bs.ponto, props: bs.props, destaque: ['antebraco'], carga: 'barra_mao',
        a: { ...bs.ang, tronco: 20, braco: 160, antebraco: 92, punho: 150 }, b: { ...bs.ang, tronco: 20, braco: 160, antebraco: 92, punho: 40 },
      });
    }
    case 'abdominal':
      return lado({
        ancora: 'quadril', ponto: [100, 164],
        a: { tronco: 270, coxa: 226, canela: 340, pe: 90, braco: 120, antebraco: 300 },
        b: { tronco: 318, coxa: 226, canela: 340, pe: 90, braco: 150, antebraco: 330 },
        destaque: ['tronco'], cabo: equip === 'cabo' ? { de: 'mao', polia: [60, 10] } : undefined,
      });
    case 'rotacao_tronco':
      return lado({
        ancora: 'quadril', ponto: [100, 164], perna2: true,
        a: { tronco: 306, coxa: 222, canela: 300, pe: 90, braco: 40, antebraco: 200, coxa2: 254, canela2: 262, pe2: 0 },
        b: { tronco: 312, coxa: 254, canela: 262, pe: 0, braco: 40, antebraco: 200, coxa2: 222, canela2: 300, pe2: 90 },
        destaque: ['tronco'],
      });
    case 'elevacao_pernas':
      return lado({
        ancora: 'quadril', ponto: [96, 166],
        a: { tronco: 270, coxa: 266, canela: 266, pe: 0, braco: 92, antebraco: 92 },
        b: { tronco: 270, coxa: 182, canela: 182, pe: 90, braco: 92, antebraco: 92 },
        destaque: ['tronco', 'coxa'],
      });
    case 'prancha': case 'prancha_lateral':
      return lado({
        ancora: 'ponta', ponto: [36, CHAO - 2],
        a: { pe: 150, canela: 80, coxa: 80, tronco: 80, braco: 172, antebraco: 90 },
        b: { pe: 150, canela: 82, coxa: 82, tronco: 82, braco: 174, antebraco: 90 },
        destaque: ['tronco'],
      });
    case 'abducao_quadril':
      return { vista: 'frente', sentado: true, bracoA: 18, bracoB: 18, cotoveloA: 20, cotoveloB: 20, pernaA: 4, pernaB: 30, destaque: ['coxa'] };
    case 'aducao_quadril':
      return { vista: 'frente', sentado: true, bracoA: 18, bracoB: 18, cotoveloA: 20, cotoveloB: 20, pernaA: 30, pernaB: 4, destaque: ['coxa'] };
    default:
      return lado({ ancora: 'tornozelo', ponto: [96, CHAO - 4], a: EM_PE, b: EM_PE, destaque: [] });
  }
}

/* ---------------- Cinemática ---------------- */

type P = [number, number];
const rad = (g: number) => (g * Math.PI) / 180;
const v = (ang: number, len: number): P => [Math.sin(rad(ang)) * len, -Math.cos(rad(ang)) * len];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];

/** Interpola ângulos pelo menor arco. */
function lerpAng(a: number | undefined, b: number | undefined, t: number): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  let d = ((b - a + 540) % 360) - 180;
  if (d === -180) d = 180;
  return a + d * t;
}

function mix(a: Ang, b: Ang, t: number): Ang {
  const out: Ang = {};
  (Object.keys({ ...a, ...b }) as (keyof Ang)[]).forEach(k => { out[k] = lerpAng(a[k], b[k], t); });
  return out;
}

interface Juntas {
  ponta: P; tornozelo: P; joelho: P; quadril: P; pescoco: P; cabeca: P; cotovelo: P; mao: P; punho?: P;
  joelho2?: P; tornozelo2?: P; ponta2?: P;
}

function cinematica(p: Lateral, ang: Ang): Juntas {
  const g = (k: keyof Ang, d: number) => ang[k] ?? d;
  // Cadeia relativa a partir da ponta do pé.
  const ponta: P = [0, 0];
  const tornozelo = sub(ponta, v(g('pe', 90), L.pe));
  const joelho = add(tornozelo, v(g('canela', 0), L.canela));
  const quadril = add(joelho, v(g('coxa', 0), L.coxa));
  const pescoco = add(quadril, v(g('tronco', 0), L.tronco));
  const cotovelo = add(pescoco, v(g('braco', 180), L.braco));
  const mao = add(cotovelo, v(g('antebraco', 180), L.antebraco));
  const j: Juntas = {
    ponta, tornozelo, joelho, quadril, pescoco, cotovelo, mao,
    cabeca: add(pescoco, v(g('tronco', 0), L.pescoco + L.cabeca)),
  };
  if (ang.punho !== undefined) j.punho = add(mao, v(ang.punho, 9));
  if (p.perna2) {
    j.joelho2 = sub(quadril, v(g('coxa2', 0), L.coxa));
    j.tornozelo2 = sub(j.joelho2, v(g('canela2', 0), L.canela));
    j.ponta2 = add(j.tornozelo2, v(g('pe2', 90), L.pe));
  }
  // Translada para que a âncora caia no ponto fixo.
  const ref = p.ancora === 'ombro' ? j.pescoco : j[p.ancora];
  const d = sub(p.ponto, ref);
  (Object.keys(j) as (keyof Juntas)[]).forEach(k => { const val = j[k]; if (val) j[k] = add(val, d); });
  return j;
}

/* ---------------- Desenho ---------------- */

const INK = 'var(--color-ink)';
const DESTAQUE = 'var(--color-muscle)';
const PROP = 'var(--color-ink-body)';

function Seg({ a, b, w, cor }: { a: P; b: P; w: number; cor: string }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={cor} strokeWidth={w} strokeLinecap="round" />;
}

function Halter({ p, ang = 0 }: { p: P; ang?: number }) {
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${ang})`}>
      <rect x={-9} y={-2} width={18} height={4} rx={2} fill={PROP} />
      <rect x={-11} y={-6} width={5} height={12} rx={1.5} fill={PROP} />
      <rect x={6} y={-6} width={5} height={12} rx={1.5} fill={PROP} />
    </g>
  );
}

function Anilha({ p }: { p: P }) {
  return (
    <g>
      <circle cx={p[0]} cy={p[1]} r={11} fill="var(--color-surface)" stroke={PROP} strokeWidth={3} />
      <circle cx={p[0]} cy={p[1]} r={2.5} fill={PROP} />
    </g>
  );
}

function desenharProps(props: Prop[] | undefined, j: Juntas) {
  return (props ?? []).map((pr, i) => {
    switch (pr.t) {
      case 'banco': {
        const ang = pr.ang ?? 0;
        return (
          <g key={i} transform={`rotate(${ang} ${pr.x + pr.w / 2} ${pr.y})`}>
            <rect x={pr.x} y={pr.y} width={pr.w} height={7} rx={3} fill={PROP} opacity={0.35} />
            <line x1={pr.x + pr.w / 2} y1={pr.y + 7} x2={pr.x + pr.w / 2} y2={CHAO} stroke={PROP} strokeWidth={4} opacity={0.35} />
          </g>
        );
      }
      case 'assento':
        return (
          <g key={i} opacity={0.35}>
            <rect x={pr.x} y={pr.y} width={pr.w} height={7} rx={3} fill={PROP} />
            <line x1={pr.x + pr.w / 2} y1={pr.y + 7} x2={pr.x + pr.w / 2} y2={CHAO} stroke={PROP} strokeWidth={4} />
            {pr.encosto && (
              <rect x={pr.x - 7} y={pr.y - pr.encosto} width={7} height={pr.encosto} rx={3} fill={PROP}
                transform={`rotate(${pr.angEncosto ?? 0} ${pr.x - 3} ${pr.y})`} />
            )}
          </g>
        );
      case 'plataforma': {
        const p = j.tornozelo;
        return <rect key={i} x={p[0] + 2} y={p[1] - 18} width={7} height={36} rx={3} fill={PROP} opacity={0.45} transform={`rotate(-45 ${p[0] + 5} ${p[1]})`} />;
      }
      case 'barra_fixa':
        return <line key={i} x1={40} y1={pr.y} x2={160} y2={pr.y} stroke={PROP} strokeWidth={5} strokeLinecap="round" opacity={0.5} />;
      case 'paralela':
        return <line key={i} x1={60} y1={pr.y + 2} x2={150} y2={pr.y + 2} stroke={PROP} strokeWidth={5} strokeLinecap="round" opacity={0.5} />;
      case 'pad': {
        const alvo = pr.em === 'tornozelo' ? j.tornozelo : pr.em === 'joelho' ? j.joelho : j.quadril;
        return <circle key={i} cx={alvo[0] + (pr.dx ?? 0)} cy={alvo[1] + (pr.dy ?? 0)} r={6} fill={PROP} opacity={0.45} />;
      }
      case 'apoio':
        return pr.h > 0
          ? <rect key={i} x={pr.x} y={pr.y} width={6} height={pr.h} rx={3} fill={PROP} opacity={0.35} />
          : <rect key={i} x={pr.x} y={pr.y} width={24} height={6} rx={2} fill={PROP} opacity={0.45} />;
      default:
        return null;
    }
  });
}

function BonecoLateral({ p, ang, fantasma = false }: { p: Lateral; ang: Ang; fantasma?: boolean }) {
  const j = cinematica(p, ang);
  const cor = (d: Destaque) => (!fantasma && p.destaque.includes(d) ? DESTAQUE : INK);
  return (
    <g opacity={fantasma ? 0.18 : 1}>
      {!fantasma && desenharProps(p.props, j)}
      {p.cabo && !fantasma && (() => {
        const de = p.cabo.de === 'mao' ? j.mao : j.tornozelo2 ?? j.tornozelo;
        return (
          <g>
            <line x1={de[0]} y1={de[1]} x2={p.cabo.polia[0]} y2={p.cabo.polia[1]} stroke={PROP} strokeWidth={1.5} strokeDasharray="3 3" />
            <circle cx={p.cabo.polia[0]} cy={p.cabo.polia[1]} r={5} fill="var(--color-surface)" stroke={PROP} strokeWidth={2} />
          </g>
        );
      })()}
      {/* Perna de trás */}
      {p.perna2 && j.joelho2 && j.tornozelo2 && j.ponta2 && (
        <g opacity={p.destaque.includes('coxa2') ? 1 : 0.55}>
          <Seg a={j.quadril} b={j.joelho2} w={11} cor={cor('coxa2')} />
          <Seg a={j.joelho2} b={j.tornozelo2} w={8.5} cor={INK} />
          <Seg a={j.tornozelo2} b={j.ponta2} w={6} cor={INK} />
        </g>
      )}
      <Seg a={j.ponta} b={j.tornozelo} w={6} cor={INK} />
      <Seg a={j.tornozelo} b={j.joelho} w={9} cor={cor('canela')} />
      <Seg a={j.joelho} b={j.quadril} w={12} cor={cor('coxa')} />
      <Seg a={j.quadril} b={j.pescoco} w={14} cor={cor('tronco')} />
      {p.destaque.includes('quadril') && !fantasma && <circle cx={j.quadril[0]} cy={j.quadril[1]} r={8.5} fill={DESTAQUE} />}
      <Seg a={j.pescoco} b={j.cotovelo} w={8.5} cor={cor('braco')} />
      <Seg a={j.cotovelo} b={j.mao} w={7} cor={cor('antebraco')} />
      {j.punho && <Seg a={j.mao} b={j.punho} w={5} cor={cor('antebraco')} />}
      <circle cx={j.cabeca[0]} cy={j.cabeca[1]} r={L.cabeca} fill="var(--color-surface)" stroke={INK} strokeWidth={3} />
      {!fantasma && p.carga === 'barra_costas' && <Anilha p={add(j.pescoco, [-3, 2])} />}
      {!fantasma && p.carga === 'barra_mao' && <Anilha p={j.punho ?? j.mao} />}
      {!fantasma && p.carga === 'barra_quadril' && <Anilha p={add(j.quadril, [0, -10])} />}
      {!fantasma && p.carga === 'halter_mao' && <Halter p={j.punho ?? j.mao} />}
      {!fantasma && p.carga === 'halter_peito' && <Halter p={j.mao} ang={90} />}
    </g>
  );
}

function BonecoFrontal({ p, t, fantasma = false }: { p: Frontal; t: number; fantasma?: boolean }) {
  const lerp = (a = 0, b = 0) => a + (b - a) * t;
  const braco = lerp(p.bracoA, p.bracoB);
  const cotovelo = lerp(p.cotoveloA ?? 0, p.cotoveloB ?? 0);
  const perna = lerp(p.pernaA ?? 0, p.pernaB ?? 0);
  const ombros = lerp(p.ombrosA ?? 0, p.ombrosB ?? 0);
  const cx = 100;
  const sentado = !!p.sentado;
  const topoTronco = sentado ? 70 : 58;
  const quadrilY = topoTronco + 52;
  const cor = (d: Frontal['destaque'][number]) => (!fantasma && p.destaque.includes(d) ? DESTAQUE : INK);

  const lados = [-1, 1].map(s => {
    const ombro: P = [cx + s * 20, topoTronco + 6 + ombros];
    // Abdução: 0 = braço para baixo; positivo abre para o lado.
    const angBraco = 180 - s * braco;
    const cot = add(ombro, v(angBraco, L.braco));
    const angAnte = 180 - s * (braco + cotovelo);
    const mao = add(cot, v(angAnte, L.antebraco));
    const quadril: P = [cx + s * 10, quadrilY];
    const angCoxa = sentado ? 180 - s * perna : 180 - s * (perna + 4);
    const coxaLen = sentado ? 18 : L.coxa;
    const joelho = add(quadril, v(angCoxa, coxaLen));
    const tornozelo = add(joelho, v(180 - s * (sentado ? perna * 0.4 : perna), L.canela));
    return { s, ombro, cot, mao, quadril, joelho, tornozelo };
  });

  return (
    <g opacity={fantasma ? 0.18 : 1}>
      {sentado && !fantasma && <rect x={70} y={quadrilY + 4} width={60} height={7} rx={3} fill={PROP} opacity={0.35} />}
      {lados.map(l => (
        <g key={l.s}>
          <Seg a={l.quadril} b={l.joelho} w={12} cor={cor('coxa')} />
          <Seg a={l.joelho} b={l.tornozelo} w={9} cor={INK} />
          <Seg a={l.tornozelo} b={add(l.tornozelo, [l.s * 7, 3])} w={6} cor={INK} />
        </g>
      ))}
      <rect x={cx - 21} y={topoTronco} width={42} height={quadrilY - topoTronco + 6} rx={14} fill={cor('peito')} />
      {p.destaque.includes('trapezio') && !fantasma && (
        <path d={`M${cx - 18} ${topoTronco + 6 + ombros} Q${cx} ${topoTronco - 8 + ombros} ${cx + 18} ${topoTronco + 6 + ombros}`} stroke={DESTAQUE} strokeWidth={7} fill="none" strokeLinecap="round" />
      )}
      {lados.map(l => (
        <g key={`b${l.s}`}>
          <Seg a={l.ombro} b={l.cot} w={8.5} cor={cor('ombro') === DESTAQUE ? DESTAQUE : cor('braco')} />
          <Seg a={l.cot} b={l.mao} w={7} cor={cor('antebraco')} />
          {!fantasma && p.carga === 'halter' && <Halter p={l.mao} ang={90} />}
          {!fantasma && p.carga === 'cabo' && (
            <line x1={l.mao[0]} y1={l.mao[1]} x2={cx + l.s * 92} y2={p.bracoA > 60 ? 14 : CHAO - 10} stroke={PROP} strokeWidth={1.5} strokeDasharray="3 3" />
          )}
        </g>
      ))}
      <circle cx={cx} cy={topoTronco - 14 + ombros * 0.3} r={L.cabeca + 1} fill="var(--color-surface)" stroke={INK} strokeWidth={3} />
    </g>
  );
}

/* ---------------- Componente ---------------- */

function prefereMenosMovimento() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('reduce-motion');
}

/** Curva com pausa nas pontas (0 → 1 → 0). */
function fase(ms: number, periodo: number): number {
  const x = (ms % periodo) / periodo;
  const ida = x < 0.5 ? x * 2 : (1 - x) * 2;
  const segurado = Math.min(1, Math.max(0, (ida - 0.12) / 0.76));
  return segurado < 0.5 ? 2 * segurado * segurado : 1 - Math.pow(-2 * segurado + 2, 2) / 2;
}

type ExerciseFigureProps = {
  padrao: PadraoMovimento;
  postura: Postura;
  equipamento: Equipamento;
  playing?: boolean;
  size?: number;
  className?: string;
  label?: string;
  /** Pose fixa (0 = início, 1 = fim), sem animação. */
  tFixo?: number;
};

export function ExerciseFigure({ padrao, postura, equipamento, playing = true, size = 220, className = '', label, tFixo }: ExerciseFigureProps) {
  const p = padraoDe(padrao, postura, equipamento);
  const [t, setT] = useState(0);
  const [estatico] = useState(prefereMenosMovimento);
  const inicio = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || estatico || tFixo !== undefined) return;
    let raf = 0;
    const loop = (now: number) => {
      if (inicio.current === null) inicio.current = now;
      setT(fase(now - inicio.current, 2600));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, estatico]);

  return (
    <svg viewBox="0 0 200 196" width={size} height={size * 0.98} className={className} role="img" aria-label={label ?? 'Animação do exercício'}>
      <line x1={8} y1={CHAO + 1} x2={192} y2={CHAO + 1} stroke="rgba(0,0,0,0.12)" strokeWidth={2} strokeLinecap="round" />
      {p.vista === 'lado' ? (
        <>
          {estatico && <BonecoLateral p={p} ang={p.b} fantasma />}
          <BonecoLateral p={p} ang={tFixo !== undefined ? mix(p.a, p.b, tFixo) : estatico ? p.a : mix(p.a, p.b, t)} />
        </>
      ) : (
        <>
          {estatico && <BonecoFrontal p={p} t={1} fantasma />}
          <BonecoFrontal p={p} t={tFixo ?? (estatico ? 0 : t)} />
        </>
      )}
    </svg>
  );
}
