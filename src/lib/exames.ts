import { analitos, acharAnalito, prefixoAnalito, normTxt, type AnalitoRef, type TipoExame } from '../data/exames';
import { novoId, type Exame, type ResultadoExame } from '../hooks/useExamesStore';
import type { Sexo } from '../hooks/usePerfilStore';

export type StatusResultado = 'abaixo' | 'normal' | 'acima' | 'alterado' | 'sem_ref';

export const statusLabels: Record<StatusResultado, string> = {
  abaixo: 'Abaixo da referência',
  normal: 'Dentro da referência',
  acima: 'Acima da referência',
  alterado: 'Diferente da referência',
  sem_ref: 'Sem referência',
};

export const analitoPorId = (id?: string) => (id ? analitos.find(x => x.id === id) : undefined);

const NEGATIVOS = ['negativo', 'ausente', 'ausentes', 'nao reagente', 'nao detectado', 'normal', 'nao contem', 'inferior a'];

/** Referência efetiva: a do laudo vence; senão a do catálogo (só se a unidade for compatível). */
export function referencia(r: ResultadoExame, sexo?: Sexo | null): { min?: number; max?: number; texto?: string; fonte: 'laudo' | 'catalogo' | null } {
  if (r.refMin != null || r.refMax != null || r.refTexto) return { min: r.refMin, max: r.refMax, texto: r.refTexto, fonte: 'laudo' };
  const an = analitoPorId(r.analitoId);
  if (!an) return { fonte: null };
  if (r.unidade && an.unidade && normTxt(r.unidade) !== normTxt(an.unidade)) return { fonte: null };
  const faixa = sexo === 'feminino' ? an.refF ?? an.ref ?? an.refM : sexo === 'masculino' ? an.refM ?? an.ref ?? an.refF : an.ref;
  if (!faixa && !an.refTexto) return { fonte: null };
  return { min: faixa?.min, max: faixa?.max, texto: an.refTexto, fonte: 'catalogo' };
}

export function statusResultado(r: ResultadoExame, sexo?: Sexo | null): StatusResultado {
  const ref = referencia(r, sexo);
  if (r.valor != null && (ref.min != null || ref.max != null)) {
    if (ref.min != null && r.valor < ref.min) return 'abaixo';
    if (ref.max != null && r.valor > ref.max) return 'acima';
    return 'normal';
  }
  if (r.valorTexto && ref.texto) {
    const v = normTxt(r.valorTexto), t = normTxt(ref.texto);
    if (v === t || v.startsWith(t)) return 'normal';
    if (NEGATIVOS.some(n => t.startsWith(n))) return NEGATIVOS.some(n => v.startsWith(n)) ? 'normal' : 'alterado';
    return 'sem_ref';
  }
  return 'sem_ref';
}

export function fmtNum(n: number | undefined | null) {
  if (n == null) return '';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function refParaTexto(ref: ReturnType<typeof referencia>, unidade = ''): string {
  const u = unidade ? ` ${unidade}` : '';
  if (ref.min != null && ref.max != null) return `${fmtNum(ref.min)} a ${fmtNum(ref.max)}${u}`;
  if (ref.max != null) return `até ${fmtNum(ref.max)}${u}`;
  if (ref.min != null) return `acima de ${fmtNum(ref.min)}${u}`;
  return ref.texto ?? '';
}

export function valorParaTexto(r: ResultadoExame) {
  return r.valor != null ? `${fmtNum(r.valor)}${r.unidade ? ` ${r.unidade}` : ''}` : r.valorTexto ?? '—';
}

/* ---------------- Leitura de laudo em texto ---------------- */

/** Converte número no formato brasileiro, decidindo se o ponto é milhar ou decimal. */
export function parseNumeroBR(s: string, an?: AnalitoRef): number | null {
  let t = s.trim();
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    // "150.000" plaquetas (milhar) x "1.025" densidade (decimal).
    const faixa = an?.ref ?? an?.refM;
    const grande = (faixa?.max ?? faixa?.min ?? 0) >= 1000;
    if (grande || /^\d{1,3}(\.\d{3}){2,}$/.test(t)) t = t.replace(/\./g, '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const NUM = String.raw`\d+(?:[.,]\d+)*`;
const RE_DATA = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/;
const RE_REF_KEY = /(valor(es)? de refer[eê]ncia|refer[eê]ncia|ref\.?|v\.?\s?r\.?)\s*:?/i;

function extrairReferencia(texto: string, an?: AnalitoRef): Pick<ResultadoExame, 'refMin' | 'refMax' | 'refTexto'> {
  const t = texto.replace(RE_REF_KEY, ' ').trim();
  let m = t.match(new RegExp(`(${NUM})\\s*(?:a|-|–|até|ate)\\s*(${NUM})`, 'i'));
  if (m) return { refMin: parseNumeroBR(m[1], an) ?? undefined, refMax: parseNumeroBR(m[2], an) ?? undefined };
  m = t.match(new RegExp(`(?:<=?|≤|inferior a|menor que|menor ou igual a|até|ate)\\s*(${NUM})`, 'i'));
  if (m) return { refMax: parseNumeroBR(m[1], an) ?? undefined };
  m = t.match(new RegExp(`(?:>=?|≥|superior a|maior que|maior ou igual a|acima de)\\s*(${NUM})`, 'i'));
  if (m) return { refMin: parseNumeroBR(m[1], an) ?? undefined };
  const palavra = t.match(/\b(negativos?|ausentes?|n[aã]o reagente|n[aã]o detectado)\b/i);
  if (palavra) return { refTexto: palavra[1].charAt(0).toUpperCase() + palavra[1].slice(1).toLowerCase() };
  return {};
}

const RE_VALOR_TEXTO = /^(negativos?|positivos?|ausentes?|presentes?|tra[cç]os|raros?|raras|numerosos?|n[aã]o reagente|reagente|n[aã]o detectado|detectado|\+{1,4})/i;

/** Lê uma linha do laudo ("Hemoglobina 14,2 g/dL 13,5 a 17,5"). */
export function interpretarLinha(bruta: string, tipo: TipoExame = 'sangue'): ResultadoExame | null {
  const linha = bruta.replace(/[•·\t]+/g, ' ').replace(/\s{2,}/g, '  ').trim();
  if (linha.length < 3 || linha.length > 160) return null;
  if (RE_DATA.test(linha) && !/[a-z]{3,}\s+\d/i.test(linha.replace(RE_DATA, ''))) return null;

  const pre = prefixoAnalito(linha, tipo === 'imagem' ? undefined : tipo);
  let nome: string, resto: string, an: AnalitoRef | undefined;
  if (pre) {
    an = pre.an; nome = an.nome; resto = pre.resto;
  } else {
    // Primeiro número precedido de espaço/":" com algum texto antes (evita "B12", "T4").
    const re = new RegExp(`(^|[\\s:])(${NUM})(?=$|[\\s%a-zA-Zµμ/x])`, 'g');
    let m: RegExpExecArray | null, achou: RegExpExecArray | null = null;
    while ((m = re.exec(linha))) {
      const antes = linha.slice(0, m.index + m[1].length);
      if (/[a-zà-ú]{2,}/i.test(antes)) { achou = m; break; }
    }
    if (!achou) return null;
    nome = linha.slice(0, achou.index + achou[1].length).replace(/[\s:.\-–]+$/, '').trim();
    resto = linha.slice(achou.index + achou[1].length);
    an = acharAnalito(nome, tipo);
    if (an) nome = an.nome;
  }

  resto = resto.trim();
  const mt = resto.match(RE_VALOR_TEXTO);
  if (mt) {
    const valorTexto = mt[1].charAt(0).toUpperCase() + mt[1].slice(1).toLowerCase();
    return { id: novoId('r'), nome, valor: null, valorTexto, unidade: '', analitoId: an?.id, ...extrairReferencia(resto.slice(mt[0].length), an) };
  }
  const mv = resto.match(new RegExp(`^(${NUM})\\s*([^\\s\\d][^\\s]*)?`));
  if (!mv) return null;
  const valor = parseNumeroBR(mv[1], an);
  if (valor == null) return null;
  let unidade = (mv[2] ?? '').replace(/[,;]$/, '');
  if (RE_REF_KEY.test(unidade) || /^(a|ate|até|-)$/i.test(unidade)) unidade = '';
  if (an && unidade && normTxt(unidade) === normTxt(an.unidade)) unidade = an.unidade;
  const ref = extrairReferencia(resto.slice(mv[0].length), an);
  return { id: novoId('r'), nome: nome.slice(0, 60), valor, unidade: unidade.slice(0, 20), analitoId: an?.id, ...ref };
}

/** Lê um laudo inteiro, uma linha por resultado. Ignora repetidos. */
export function interpretarLaudo(texto: string, tipo: TipoExame = 'sangue'): ResultadoExame[] {
  const vistos = new Set<string>();
  const out: ResultadoExame[] = [];
  for (const l of texto.split(/\r?\n/)) {
    const r = interpretarLinha(l, tipo);
    if (!r) continue;
    const chave = r.analitoId ?? normTxt(r.nome);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    out.push(r);
  }
  return out;
}

/* ---------------- Resumos ---------------- */

export function contarStatus(e: Exame, sexo?: Sexo | null) {
  const c = { normal: 0, fora: 0, sem_ref: 0 };
  for (const r of e.resultados) {
    const s = statusResultado(r, sexo);
    if (s === 'normal') c.normal++;
    else if (s === 'sem_ref') c.sem_ref++;
    else c.fora++;
  }
  return c;
}

export function exameParaTexto(e: Exame, sexo?: Sexo | null): string {
  const linhas = e.resultados.map(r => {
    const ref = referencia(r, sexo);
    const rt = refParaTexto(ref, r.unidade);
    return `- ${r.nome}: ${valorParaTexto(r)}${rt ? ` (ref.: ${rt}${ref.fonte === 'catalogo' ? ', geral' : ''})` : ''} → ${statusLabels[statusResultado(r, sexo)]}`;
  });
  return `${e.titulo || 'Exame'} (${e.tipo}, ${e.data}${e.laboratorio ? `, ${e.laboratorio}` : ''})\n${linhas.join('\n')}${e.notas ? `\nObservações/laudo: ${e.notas.slice(0, 1500)}` : ''}`;
}

/** Valor anterior do mesmo analito (para mostrar a evolução). */
export function valorAnterior(exames: Exame[], atual: Exame, r: ResultadoExame): { valor: number; data: string } | null {
  const chave = r.analitoId ?? normTxt(r.nome);
  const anteriores = exames
    .filter(e => e.id !== atual.id && e.data < atual.data)
    .sort((x, y) => y.data.localeCompare(x.data));
  for (const e of anteriores) {
    const x = e.resultados.find(y => (y.analitoId ?? normTxt(y.nome)) === chave && y.valor != null && y.unidade === r.unidade);
    if (x && x.valor != null) return { valor: x.valor, data: e.data };
  }
  return null;
}

/** Análise local (sem IA): explica, sem diagnosticar, o que ficou fora da referência. */
export function analiseOffline(e: Exame, sexo?: Sexo | null): string {
  const fora = e.resultados.filter(r => !['normal', 'sem_ref'].includes(statusResultado(r, sexo)));
  const semRef = e.resultados.filter(r => statusResultado(r, sexo) === 'sem_ref');
  if (!e.resultados.length) return 'Ainda não há resultados neste exame. Adicione os valores do laudo para ver a leitura.';
  const partes: string[] = [];
  if (!fora.length) partes.push(`**Todos os ${e.resultados.length - semRef.length} resultados com referência estão dentro da faixa.**`);
  else {
    partes.push(`**${fora.length} ${fora.length === 1 ? 'resultado ficou' : 'resultados ficaram'} fora da faixa de referência:**`);
    for (const r of fora) {
      const an = analitoPorId(r.analitoId);
      const s = statusResultado(r, sexo);
      partes.push(`- **${r.nome}**: ${valorParaTexto(r)} — ${statusLabels[s].toLowerCase()}.${an ? ` ${an.sobre}` : ''}`);
    }
    partes.push('Pequenas variações são comuns e podem ter causas simples (jejum, hidratação, treino intenso nos dias anteriores, horário da coleta).');
  }
  if (semRef.length) partes.push(`${semRef.length} ${semRef.length === 1 ? 'item está' : 'itens estão'} sem faixa de referência — confira no laudo.`);
  partes.push('Esta leitura é educativa e não substitui a avaliação do seu médico, que interpreta os exames junto com seu histórico.');
  return partes.join('\n');
}
