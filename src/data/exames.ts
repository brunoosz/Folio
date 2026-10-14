/**
 * Catálogo de exames laboratoriais comuns com faixas de referência GERAIS para adultos.
 * As faixas variam entre laboratórios e métodos: o app sempre prioriza a referência do próprio laudo.
 * Conteúdo educativo — a revisar por profissional. Não serve para diagnóstico.
 */

export type TipoExame = 'sangue' | 'urina' | 'fezes' | 'imagem' | 'outro';

export const tipoExameLabels: Record<TipoExame, string> = {
  sangue: 'Sangue',
  urina: 'Urina',
  fezes: 'Fezes',
  imagem: 'Imagem',
  outro: 'Outro',
};

type Faixa = { min?: number; max?: number };

export interface AnalitoRef {
  id: string;
  nome: string;
  /** Formas como aparece nos laudos (sem acento, minúsculas). */
  aliases: string[];
  tipo: TipoExame;
  grupo: string;
  unidade: string;
  ref?: Faixa;
  /** Faixas diferentes por sexo, quando existem. */
  refM?: Faixa;
  refF?: Faixa;
  /** Referência textual (ex.: "Negativo"). */
  refTexto?: string;
  /** O que o exame mede, em linguagem simples. */
  sobre: string;
}

const a = (
  id: string, nome: string, aliases: string[], grupo: string, unidade: string,
  ref: Partial<Pick<AnalitoRef, 'ref' | 'refM' | 'refF' | 'refTexto'>>, sobre: string, tipo: TipoExame = 'sangue',
): AnalitoRef => ({ id, nome, aliases, tipo, grupo, unidade, sobre, ...ref });

export const analitos: AnalitoRef[] = [
  // Hemograma
  a('hemacias', 'Hemácias', ['hemacias', 'eritrocitos', 'globulos vermelhos', 'rbc'], 'Hemograma', 'milhões/µL', { refM: { min: 4.5, max: 5.9 }, refF: { min: 4.0, max: 5.2 } }, 'Células que transportam oxigênio.'),
  a('hemoglobina', 'Hemoglobina', ['hemoglobina', 'hb', 'hgb'], 'Hemograma', 'g/dL', { refM: { min: 13.5, max: 17.5 }, refF: { min: 12, max: 15.5 } }, 'Proteína das hemácias que carrega o oxigênio.'),
  a('hematocrito', 'Hematócrito', ['hematocrito', 'ht', 'hct'], 'Hemograma', '%', { refM: { min: 41, max: 53 }, refF: { min: 36, max: 46 } }, 'Proporção do sangue ocupada pelas hemácias.'),
  a('vcm', 'VCM', ['vcm', 'volume corpuscular medio', 'mcv'], 'Hemograma', 'fL', { ref: { min: 80, max: 100 } }, 'Tamanho médio das hemácias.'),
  a('hcm', 'HCM', ['hcm', 'hemoglobina corpuscular media', 'mch'], 'Hemograma', 'pg', { ref: { min: 27, max: 33 } }, 'Quantidade média de hemoglobina por hemácia.'),
  a('chcm', 'CHCM', ['chcm', 'mchc'], 'Hemograma', 'g/dL', { ref: { min: 32, max: 36 } }, 'Concentração média de hemoglobina nas hemácias.'),
  a('rdw', 'RDW', ['rdw'], 'Hemograma', '%', { ref: { min: 11.5, max: 14.5 } }, 'Variação de tamanho entre as hemácias.'),
  a('leucocitos', 'Leucócitos', ['leucocitos', 'globulos brancos', 'wbc'], 'Hemograma', '/µL', { ref: { min: 4000, max: 11000 } }, 'Células de defesa do organismo.'),
  a('neutrofilos', 'Neutrófilos', ['neutrofilos', 'segmentados'], 'Hemograma', '/µL', { ref: { min: 1800, max: 7500 } }, 'Defesa contra bactérias.'),
  a('linfocitos', 'Linfócitos', ['linfocitos'], 'Hemograma', '/µL', { ref: { min: 1000, max: 4000 } }, 'Defesa contra vírus e memória imunológica.'),
  a('eosinofilos', 'Eosinófilos', ['eosinofilos'], 'Hemograma', '/µL', { ref: { min: 0, max: 500 } }, 'Ligados a alergias e parasitas.'),
  a('plaquetas', 'Plaquetas', ['plaquetas', 'plt'], 'Hemograma', '/µL', { ref: { min: 150000, max: 450000 } }, 'Ajudam na coagulação.'),
  // Glicemia
  a('glicose', 'Glicose em jejum', ['glicose', 'glicemia', 'glicose em jejum', 'glicemia de jejum'], 'Glicemia', 'mg/dL', { ref: { min: 70, max: 99 } }, 'Açúcar no sangue em jejum.'),
  a('hba1c', 'Hemoglobina glicada', ['hemoglobina glicada', 'hba1c', 'a1c', 'glicohemoglobina'], 'Glicemia', '%', { ref: { max: 5.6 } }, 'Média da glicose nos últimos ~3 meses.'),
  a('insulina', 'Insulina', ['insulina', 'insulina basal', 'insulina em jejum'], 'Glicemia', 'µUI/mL', { ref: { min: 2, max: 25 } }, 'Hormônio que leva a glicose para as células.'),
  // Lipídios
  a('colesterol_total', 'Colesterol total', ['colesterol total', 'colesterol'], 'Lipídios', 'mg/dL', { ref: { max: 189 } }, 'Soma das frações de colesterol.'),
  a('ldl', 'LDL', ['ldl', 'colesterol ldl', 'ldl colesterol', 'ldl-c'], 'Lipídios', 'mg/dL', { ref: { max: 129 } }, 'Colesterol que pode se acumular nas artérias. A meta depende do risco de cada pessoa.'),
  a('hdl', 'HDL', ['hdl', 'colesterol hdl', 'hdl colesterol', 'hdl-c'], 'Lipídios', 'mg/dL', { ref: { min: 40 } }, 'Colesterol que ajuda a retirar o excesso das artérias.'),
  a('nao_hdl', 'Colesterol não-HDL', ['nao-hdl', 'nao hdl', 'colesterol nao-hdl', 'colesterol nao hdl'], 'Lipídios', 'mg/dL', { ref: { max: 159 } }, 'Todo o colesterol exceto o HDL.'),
  a('triglicerideos', 'Triglicerídeos', ['triglicerideos', 'triglicerides', 'triglicérides', 'tg'], 'Lipídios', 'mg/dL', { ref: { max: 149 } }, 'Gorduras circulantes, influenciadas pela alimentação recente.'),
  // Rim
  a('ureia', 'Ureia', ['ureia'], 'Rins', 'mg/dL', { ref: { min: 15, max: 45 } }, 'Resíduo do metabolismo das proteínas.'),
  a('creatinina', 'Creatinina', ['creatinina'], 'Rins', 'mg/dL', { refM: { min: 0.7, max: 1.3 }, refF: { min: 0.6, max: 1.1 } }, 'Resíduo muscular filtrado pelos rins. Tende a ser maior em quem tem mais massa muscular ou usa creatina.'),
  a('acido_urico', 'Ácido úrico', ['acido urico'], 'Rins', 'mg/dL', { refM: { min: 3.4, max: 7.0 }, refF: { min: 2.4, max: 6.0 } }, 'Resíduo do metabolismo das purinas.'),
  // Fígado
  a('tgo', 'TGO (AST)', ['tgo', 'ast', 'aspartato aminotransferase', 'tgo/ast', 'ast/tgo'], 'Fígado', 'U/L', { ref: { max: 40 } }, 'Enzima do fígado e dos músculos; pode subir após treino intenso.'),
  a('tgp', 'TGP (ALT)', ['tgp', 'alt', 'alanina aminotransferase', 'tgp/alt', 'alt/tgp'], 'Fígado', 'U/L', { ref: { max: 41 } }, 'Enzima mais específica do fígado.'),
  a('ggt', 'Gama-GT', ['gama-gt', 'gama gt', 'ggt', 'gama glutamil transferase'], 'Fígado', 'U/L', { refM: { max: 60 }, refF: { max: 40 } }, 'Enzima do fígado e das vias biliares.'),
  a('fosfatase', 'Fosfatase alcalina', ['fosfatase alcalina'], 'Fígado', 'U/L', { ref: { min: 40, max: 129 } }, 'Enzima do fígado e dos ossos.'),
  a('bilirrubina', 'Bilirrubina total', ['bilirrubina total', 'bilirrubina'], 'Fígado', 'mg/dL', { ref: { min: 0.2, max: 1.2 } }, 'Pigmento da degradação das hemácias.'),
  // Tireoide
  a('tsh', 'TSH', ['tsh', 'hormonio tireoestimulante'], 'Tireoide', 'µUI/mL', { ref: { min: 0.4, max: 4.5 } }, 'Hormônio que regula a tireoide.'),
  a('t4l', 'T4 livre', ['t4 livre', 't4l', 'tiroxina livre'], 'Tireoide', 'ng/dL', { ref: { min: 0.8, max: 1.8 } }, 'Hormônio produzido pela tireoide.'),
  // Vitaminas e minerais
  a('vitd', 'Vitamina D (25-OH)', ['vitamina d', '25-oh vitamina d', '25 hidroxivitamina d', '25-hidroxivitamina d', 'vitamina d3', '25(oh)d'], 'Vitaminas e minerais', 'ng/mL', { ref: { min: 20, max: 100 } }, 'Ligada à saúde óssea e muscular. Para grupos de risco, a meta costuma ser 30–60.'),
  a('b12', 'Vitamina B12', ['vitamina b12', 'b12', 'cobalamina', 'cianocobalamina'], 'Vitaminas e minerais', 'pg/mL', { ref: { min: 200, max: 900 } }, 'Importante para os nervos e para formar hemácias.'),
  a('folato', 'Ácido fólico', ['acido folico', 'folato'], 'Vitaminas e minerais', 'ng/mL', { ref: { min: 3.9 } }, 'Vitamina do complexo B.'),
  a('ferritina', 'Ferritina', ['ferritina'], 'Vitaminas e minerais', 'ng/mL', { refM: { min: 30, max: 400 }, refF: { min: 15, max: 150 } }, 'Estoque de ferro do corpo; também sobe com inflamação.'),
  a('ferro', 'Ferro sérico', ['ferro serico', 'ferro'], 'Vitaminas e minerais', 'µg/dL', { ref: { min: 60, max: 170 } }, 'Ferro circulante no sangue.'),
  a('sodio', 'Sódio', ['sodio', 'na'], 'Vitaminas e minerais', 'mEq/L', { ref: { min: 135, max: 145 } }, 'Eletrólito do equilíbrio de líquidos.'),
  a('potassio', 'Potássio', ['potassio', 'k'], 'Vitaminas e minerais', 'mEq/L', { ref: { min: 3.5, max: 5.1 } }, 'Eletrólito importante para músculos e coração.'),
  a('calcio', 'Cálcio total', ['calcio total', 'calcio'], 'Vitaminas e minerais', 'mg/dL', { ref: { min: 8.6, max: 10.3 } }, 'Mineral dos ossos, músculos e nervos.'),
  a('magnesio', 'Magnésio', ['magnesio', 'mg'], 'Vitaminas e minerais', 'mg/dL', { ref: { min: 1.7, max: 2.4 } }, 'Mineral envolvido na contração muscular.'),
  a('zinco', 'Zinco', ['zinco'], 'Vitaminas e minerais', 'µg/dL', { ref: { min: 70, max: 120 } }, 'Mineral da imunidade e da cicatrização.'),
  // Inflamação e músculo
  a('pcr', 'Proteína C reativa', ['proteina c reativa', 'pcr', 'pcr ultrassensivel', 'pcr-us', 'proteina c reativa ultrassensivel'], 'Inflamação', 'mg/L', { ref: { max: 5 } }, 'Marcador de inflamação. Treinos intensos e infecções podem elevar.'),
  a('vhs', 'VHS', ['vhs', 'velocidade de hemossedimentacao'], 'Inflamação', 'mm/h', { refM: { max: 15 }, refF: { max: 20 } }, 'Marcador inespecífico de inflamação.'),
  a('ck', 'CK (CPK)', ['ck', 'cpk', 'creatinoquinase', 'creatina quinase', 'ck total'], 'Músculo', 'U/L', { refM: { min: 39, max: 308 }, refF: { min: 26, max: 192 } }, 'Enzima muscular. Costuma subir por dias após treino pesado — vale avisar o médico que você treina.'),
  // Hormônios
  a('testosterona', 'Testosterona total', ['testosterona total', 'testosterona'], 'Hormônios', 'ng/dL', { refM: { min: 264, max: 916 }, refF: { min: 8, max: 60 } }, 'Hormônio sexual; varia com a hora da coleta.'),
  a('cortisol', 'Cortisol (manhã)', ['cortisol', 'cortisol basal', 'cortisol matinal'], 'Hormônios', 'µg/dL', { ref: { min: 6.2, max: 19.4 } }, 'Hormônio do estresse; varia ao longo do dia.'),
  a('psa', 'PSA total', ['psa', 'psa total', 'antigeno prostatico especifico'], 'Hormônios', 'ng/mL', { ref: { max: 4 } }, 'Proteína produzida pela próstata.'),
  // Urina tipo 1 (EAS)
  a('u_ph', 'pH (urina)', ['ph'], 'Urina tipo 1', '', { ref: { min: 5, max: 8 } }, 'Acidez da urina.', 'urina'),
  a('u_densidade', 'Densidade (urina)', ['densidade'], 'Urina tipo 1', '', { ref: { min: 1.005, max: 1.03 } }, 'Concentração da urina; sobe com pouca água.', 'urina'),
  a('u_proteinas', 'Proteínas (urina)', ['proteinas', 'proteina'], 'Urina tipo 1', '', { refTexto: 'Negativo' }, 'Normalmente ausentes; podem aparecer após exercício intenso.', 'urina'),
  a('u_glicose', 'Glicose (urina)', ['glicose urinaria', 'glicose'], 'Urina tipo 1', '', { refTexto: 'Negativo' }, 'Normalmente ausente.', 'urina'),
  a('u_cetonas', 'Corpos cetônicos', ['corpos cetonicos', 'cetonas'], 'Urina tipo 1', '', { refTexto: 'Negativo' }, 'Aparecem em jejum prolongado ou dietas muito baixas em carboidrato.', 'urina'),
  a('u_hemoglobina', 'Sangue (urina)', ['hemoglobina urinaria', 'sangue', 'hemacias urina', 'hemoglobina'], 'Urina tipo 1', '', { refTexto: 'Negativo' }, 'Normalmente ausente.', 'urina'),
  a('u_nitrito', 'Nitrito', ['nitrito', 'nitritos'], 'Urina tipo 1', '', { refTexto: 'Negativo' }, 'Pode indicar bactérias na urina.', 'urina'),
  a('u_leucocitos', 'Leucócitos (urina)', ['leucocitos urina', 'piocitos', 'leucocitos'], 'Urina tipo 1', '/mL', { ref: { max: 10000 } }, 'Células de defesa na urina.', 'urina'),
  // Fezes
  a('f_parasitologico', 'Parasitológico', ['parasitologico', 'protoparasitologico', 'pesquisa de parasitas'], 'Fezes', '', { refTexto: 'Negativo' }, 'Pesquisa de parasitas intestinais.', 'fezes'),
  a('f_sangue_oculto', 'Sangue oculto', ['sangue oculto', 'pesquisa de sangue oculto'], 'Fezes', '', { refTexto: 'Negativo' }, 'Pesquisa de sangue não visível nas fezes.', 'fezes'),
];

export function normTxt(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Aliases ordenados do mais longo para o mais curto (o mais específico vence). */
const indiceAliases = analitos
  .flatMap(an => an.aliases.map(al => ({ al: normTxt(al), an })))
  .sort((x, y) => y.al.length - x.al.length);

/** Encontra o analito pelo nome (exato ou começo da linha). */
export function acharAnalito(nome: string, tipo?: TipoExame): AnalitoRef | undefined {
  const t = normTxt(nome);
  const candidatos = indiceAliases.filter(({ an }) => !tipo || tipo === 'imagem' || tipo === 'outro' || an.tipo === tipo);
  return (candidatos.find(({ al }) => t === al) ?? candidatos.find(({ al }) => t.startsWith(`${al} `) || t.startsWith(`${al}:`)))?.an;
}

export function prefixoAnalito(linha: string, tipo?: TipoExame): { an: AnalitoRef; resto: string } | null {
  const t = normTxt(linha);
  for (const { al, an } of indiceAliases) {
    if (tipo && tipo !== 'outro' && an.tipo !== tipo) continue;
    if (t === al || t.startsWith(`${al} `) || t.startsWith(`${al}:`) || t.startsWith(`${al}.`) || t.startsWith(`${al}-`)) {
      // Mesmo comprimento no texto normalizado (só acentos e espaços mudam).
      const resto = t.slice(al.length).replace(/^[\s:.\-–]+/, '');
      return { an, resto };
    }
  }
  return null;
}
