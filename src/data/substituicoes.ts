/*
 * Lista de substituições APROXIMADAS por grupo alimentar (medidas caseiras),
 * no espírito das listas de equivalentes usadas em planos alimentares.
 * Servem para trocas pontuais quando falta um alimento; não substituem
 * o plano individual feito por nutricionista.
 */

export interface Equivalente { alimento: string; porcao: string }
export interface GrupoAlimentar { id: string; nome: string; descricao: string; itens: Equivalente[] }

export const gruposAlimentares: GrupoAlimentar[] = [
  {
    id: 'carboidratos',
    nome: 'Carboidratos',
    descricao: 'Cada linha equivale, de forma aproximada, a 1 porção (cerca de 25 a 30 g de carboidrato).',
    itens: [
      { alimento: 'Arroz branco ou integral cozido', porcao: '4 colheres de sopa (100 g)' },
      { alimento: 'Macarrão cozido', porcao: '3 colheres de sopa cheias (90 g)' },
      { alimento: 'Batata inglesa cozida', porcao: '1 unidade média (150 g)' },
      { alimento: 'Batata-doce cozida', porcao: '1 unidade pequena (110 g)' },
      { alimento: 'Mandioca (aipim) cozida', porcao: '1 pedaço médio (80 g)' },
      { alimento: 'Pão francês', porcao: '1 unidade (50 g)' },
      { alimento: 'Pão de forma integral', porcao: '2 fatias (50 g)' },
      { alimento: 'Cuscuz de milho cozido', porcao: '1 fatia média (100 g)' },
      { alimento: 'Tapioca (goma)', porcao: '2 colheres de sopa (30 g)' },
      { alimento: 'Aveia em flocos', porcao: '4 colheres de sopa (40 g)' },
      { alimento: 'Inhame ou cará cozido', porcao: '1 unidade pequena (120 g)' },
      { alimento: 'Milho verde', porcao: '1 espiga média ou 5 colheres de sopa (100 g)' },
    ],
  },
  {
    id: 'proteinas',
    nome: 'Proteínas',
    descricao: 'Equivalências aproximadas em proteína (cerca de 20 a 25 g por linha).',
    itens: [
      { alimento: 'Peito de frango grelhado', porcao: '1 filé médio (100 g)' },
      { alimento: 'Carne bovina magra (patinho, alcatra)', porcao: '1 bife médio (100 g)' },
      { alimento: 'Carne moída magra', porcao: '4 colheres de sopa (100 g)' },
      { alimento: 'Peixe (tilápia, merluza)', porcao: '1 filé médio (120 g)' },
      { alimento: 'Ovos inteiros', porcao: '3 unidades' },
      { alimento: 'Atum em água, drenado', porcao: '1 lata (120 g)' },
      { alimento: 'Sardinha em lata, drenada', porcao: '1 lata (85 g)' },
      { alimento: 'Lombo suíno magro', porcao: '1 fatia média (100 g)' },
      { alimento: 'Tofu firme', porcao: '1 xícara em cubos (180 g)' },
      { alimento: 'Proteína de soja texturizada hidratada', porcao: '1 xícara (cerca de 50 g seca)' },
    ],
  },
  {
    id: 'leguminosas',
    nome: 'Leguminosas',
    descricao: 'Cerca de 1 porção do prato.',
    itens: [
      { alimento: 'Feijão cozido (com caldo)', porcao: '1 concha média (100 g)' },
      { alimento: 'Lentilha cozida', porcao: '4 colheres de sopa (100 g)' },
      { alimento: 'Grão-de-bico cozido', porcao: '3 colheres de sopa (70 g)' },
      { alimento: 'Ervilha seca cozida', porcao: '4 colheres de sopa (100 g)' },
      { alimento: 'Feijão-branco ou preto cozido (só grãos)', porcao: '3 colheres de sopa (70 g)' },
    ],
  },
  {
    id: 'laticinios',
    nome: 'Leite e derivados',
    descricao: 'Cerca de 1 porção (fonte de cálcio e proteína).',
    itens: [
      { alimento: 'Leite (integral ou desnatado)', porcao: '1 copo (200 ml)' },
      { alimento: 'Iogurte natural', porcao: '1 pote (170 g)' },
      { alimento: 'Queijo minas frescal ou branco', porcao: '2 fatias médias (40 g)' },
      { alimento: 'Queijo muçarela', porcao: '2 fatias finas (30 g)' },
      { alimento: 'Requeijão light', porcao: '2 colheres de sopa (40 g)' },
      { alimento: 'Leite em pó', porcao: '2 colheres de sopa (26 g)' },
      { alimento: 'Bebida vegetal enriquecida com cálcio', porcao: '1 copo (200 ml)' },
    ],
  },
  {
    id: 'frutas',
    nome: 'Frutas',
    descricao: 'Cerca de 1 porção de fruta.',
    itens: [
      { alimento: 'Banana prata ou nanica', porcao: '1 unidade média' },
      { alimento: 'Maçã', porcao: '1 unidade média' },
      { alimento: 'Laranja ou mexerica', porcao: '1 unidade média' },
      { alimento: 'Mamão papaia', porcao: '1/2 unidade' },
      { alimento: 'Mamão formosa', porcao: '1 fatia média' },
      { alimento: 'Manga', porcao: '1/2 unidade média' },
      { alimento: 'Melancia', porcao: '1 fatia média (200 g)' },
      { alimento: 'Morango', porcao: '10 unidades' },
      { alimento: 'Abacaxi', porcao: '1 fatia média' },
      { alimento: 'Uva', porcao: '1 cacho pequeno (15 uvas)' },
      { alimento: 'Pera', porcao: '1 unidade média' },
    ],
  },
  {
    id: 'gorduras',
    nome: 'Gorduras boas e oleaginosas',
    descricao: 'Equivalência aproximada em energia (cerca de 80 a 100 kcal).',
    itens: [
      { alimento: 'Azeite de oliva', porcao: '1 colher de sopa (10 ml)' },
      { alimento: 'Abacate', porcao: '2 colheres de sopa (60 g)' },
      { alimento: 'Pasta de amendoim integral', porcao: '1 colher de sopa (15 g)' },
      { alimento: 'Castanha-do-pará', porcao: '3 unidades (15 g)' },
      { alimento: 'Castanha de caju ou amêndoas', porcao: '10 unidades (15 g)' },
      { alimento: 'Amendoim torrado sem sal', porcao: '1 colher de sopa cheia (15 g)' },
      { alimento: 'Sementes (chia, linhaça)', porcao: '1 colher de sopa (15 g)' },
    ],
  },
];

function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Encontra o grupo e o item a partir de um texto livre ("não tenho frango"). */
export function buscarAlimento(texto: string): { grupo: GrupoAlimentar; item: Equivalente } | null {
  const q = norm(texto);
  for (const g of gruposAlimentares) {
    for (const it of g.itens) {
      const chave = norm(it.alimento).split(/[\s(,]+/).filter(w => w.length > 3);
      if (chave.some(w => q.includes(w))) return { grupo: g, item: it };
    }
  }
  return null;
}
