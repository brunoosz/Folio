import type { IconName } from '../components/ui/Icon';

/** Grupos usados no "prato" de cada refeição. Cores claras de propósito (lúdico e legível). */
export type GrupoPrato = 'carboidratos' | 'proteinas' | 'leguminosas' | 'laticinios' | 'frutas' | 'vegetais' | 'gorduras' | 'outros';

export const grupoPrato: Record<GrupoPrato, { nome: string; cor: string; tinta: string; icone: IconName }> = {
  carboidratos: { nome: 'Carboidratos', cor: '#f7d98f', tinta: '#7a5600', icone: 'trigo' },
  proteinas: { nome: 'Proteínas', cor: '#f6b9a9', tinta: '#8f2a17', icone: 'coxa' },
  leguminosas: { nome: 'Leguminosas', cor: '#dcc6a6', tinta: '#5f4524', icone: 'feijao' },
  laticinios: { nome: 'Leite e derivados', cor: '#c9e2f8', tinta: '#1d5b8f', icone: 'leite' },
  frutas: { nome: 'Frutas', cor: '#f8c4d8', tinta: '#8a2550', icone: 'maca' },
  vegetais: { nome: 'Vegetais', cor: '#bfe5c2', tinta: '#1f6b2a', icone: 'folha' },
  gorduras: { nome: 'Gorduras boas', cor: '#e5e0a2', tinta: '#5b5612', icone: 'abacate' },
  outros: { nome: 'Outros', cor: '#e2dfdb', tinta: '#57524c', icone: 'prato' },
};

export const ordemGrupos: GrupoPrato[] = ['carboidratos', 'proteinas', 'leguminosas', 'vegetais', 'frutas', 'laticinios', 'gorduras', 'outros'];

/** Palavras-chave (sem acento) por grupo. A primeira correspondência vence, na ordem abaixo. */
const CHAVES: [GrupoPrato, string[]][] = [
  ['gorduras', ['pasta de amendoim', 'azeite', 'oleo', 'manteiga', 'abacate', 'castanha', 'amendoim', 'amendoa', 'nozes', 'chia', 'linhaca', 'semente', 'coco']],
  ['leguminosas', ['feijao', 'lentilha', 'grao-de-bico', 'grao de bico', 'ervilha', 'soja']],
  ['laticinios', ['leite', 'iogurte', 'queijo', 'requeijao', 'ricota', 'coalhada', 'kefir', 'nata', 'cottage']],
  ['proteinas', ['frango', 'peito de', 'carne', 'bife', 'patinho', 'alcatra', 'file', 'moida', 'peixe', 'tilapia', 'salmao', 'atum', 'sardinha', 'merluza', 'ovo', 'omelete', 'clara', 'presunto', 'peru', 'porco', 'lombo', 'tofu', 'whey', 'proteina', 'camarao', 'hamburguer', 'linguica', 'frios', 'charque']],
  ['frutas', ['banana', 'maca', 'laranja', 'mamao', 'manga', 'melancia', 'melao', 'morango', 'abacaxi', 'uva', 'pera', 'kiwi', 'goiaba', 'fruta', 'acai', 'mexerica', 'tangerina', 'ameixa', 'limao', 'caqui', 'jabuticaba']],
  ['vegetais', ['salada', 'alface', 'tomate', 'cenoura', 'brocolis', 'abobrinha', 'legume', 'verdura', 'couve', 'espinafre', 'pepino', 'beterraba', 'chuchu', 'repolho', 'rucula', 'cebola', 'pimentao', 'vagem', 'berinjela', 'abobora', 'quiabo', 'agriao', 'palmito']],
  ['carboidratos', ['arroz', 'macarrao', 'massa', 'batata', 'mandioca', 'aipim', 'macaxeira', 'pao', 'torrada', 'tapioca', 'cuscuz', 'aveia', 'granola', 'milho', 'inhame', 'cara', 'farinha', 'farofa', 'biscoito', 'bolacha', 'cereal', 'wrap', 'tortilha', 'quinoa', 'polenta', 'panqueca', 'crepioca', 'bolo']],
];

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Classifica um item de texto livre ("120 g de frango grelhado") em um grupo. */
export function classificarAlimento(item: string): GrupoPrato {
  const t = norm(item);
  for (const [grupo, chaves] of CHAVES) {
    if (chaves.some(k => new RegExp(`(^|[^a-z])${k.replace(/[-]/g, '[- ]?')}`).test(t))) return grupo;
  }
  return 'outros';
}

export interface FatiaPrato { grupo: GrupoPrato; itens: string[]; fracao: number }

/** Divide os itens de uma refeição em fatias por grupo (cada item conta igual). */
export function montarPrato(itens: string[]): FatiaPrato[] {
  const mapa = new Map<GrupoPrato, string[]>();
  for (const it of itens) {
    const g = classificarAlimento(it);
    mapa.set(g, [...(mapa.get(g) ?? []), it]);
  }
  const total = itens.length || 1;
  return ordemGrupos.filter(g => mapa.has(g)).map(g => ({ grupo: g, itens: mapa.get(g)!, fracao: mapa.get(g)!.length / total }));
}

export interface Comparacao {
  /** 0–100: quanto dos grupos do plano apareceu no que foi comido. */
  aderencia: number;
  cobertos: GrupoPrato[];
  faltaram: GrupoPrato[];
  extras: GrupoPrato[];
}

/** Compara (por grupos alimentares) o que foi comido com o planejado. */
export function compararComPlano(planejado: string[], comido: string[]): Comparacao {
  const gp = new Set(planejado.map(classificarAlimento).filter(g => g !== 'outros'));
  const gc = new Set(comido.map(classificarAlimento).filter(g => g !== 'outros'));
  const cobertos = [...gp].filter(g => gc.has(g));
  const faltaram = [...gp].filter(g => !gc.has(g));
  const extras = [...gc].filter(g => !gp.has(g));
  const aderencia = gp.size ? Math.round((cobertos.length / gp.size) * 100) : 0;
  return { aderencia, cobertos, faltaram, extras };
}
