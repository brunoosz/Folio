import { artigos, respostasIA, type ArtigoCientifico } from '../data/ciencia';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TIMEOUT_MS = 30_000;

export type ChatRole = 'system' | 'user' | 'assistant';
export interface ChatMessage { role: ChatRole; content: string }

export type GroqErrorKind = 'no_key' | 'invalid_key' | 'rate_limit' | 'offline' | 'timeout' | 'model' | 'server' | 'unknown';

export class GroqError extends Error {
  kind: GroqErrorKind;
  status?: number;
  constructor(kind: GroqErrorKind, status?: number) {
    super(friendlyMessage(kind));
    this.name = 'GroqError';
    this.kind = kind;
    this.status = status;
  }
}

function friendlyMessage(kind: GroqErrorKind): string {
  switch (kind) {
    case 'no_key': return 'A IA ainda não foi configurada.';
    case 'invalid_key': return 'Chave da Groq inválida ou revogada. Verifique em Configurações.';
    case 'rate_limit': return 'Limite de uso da Groq atingido. Aguarde um instante e tente de novo.';
    case 'offline': return 'Sem conexão com a internet. Verifique sua rede.';
    case 'timeout': return 'A IA demorou demais para responder. Tente novamente.';
    case 'model': return 'O modelo selecionado não está disponível. Escolha outro em Configurações.';
    case 'server': return 'O serviço da Groq está instável no momento. Tente mais tarde.';
    default: return 'Não foi possível falar com a IA agora.';
  }
}

function mapStatus(status: number, body: string): GroqErrorKind {
  if (status === 401 || status === 403) return 'invalid_key';
  if (status === 429) return 'rate_limit';
  if ((status === 400 || status === 404) && /model/i.test(body)) return 'model';
  if (status >= 500) return 'server';
  return 'unknown';
}

interface CompletionOptions { temperature?: number; maxTokens?: number; signal?: AbortSignal }

/** Chamada não-streaming ao endpoint compatível com OpenAI da Groq. */
export async function groqChat(key: string, model: string, messages: ChatMessage[], opts: CompletionOptions = {}): Promise<string> {
  if (!key) throw new GroqError('no_key');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new GroqError('offline');

  const ctrl = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
  const onOuterAbort = () => ctrl.abort();
  opts.signal?.addEventListener('abort', onOuterAbort);

  // No Android, o CapacitorHttp substitui o fetch e ignora o AbortSignal: a corrida
  // garante que o timeout e o cancelamento funcionem em todas as plataformas.
  const aborted = new Promise<never>((_, reject) => {
    ctrl.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  aborted.catch(() => { /* tratado abaixo */ });
  if (opts.signal?.aborted) ctrl.abort();

  // Modelos gpt-oss raciocinam antes de responder; esforço baixo evita esgotar max_tokens.
  const reasoning = model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {};

  let res: Response;
  try {
    res = await Promise.race([
      fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.4,
          max_tokens: opts.maxTokens ?? 700,
          stream: false,
          ...reasoning,
        }),
        signal: ctrl.signal,
      }),
      aborted,
    ]);
  } catch (e) {
    if (timedOut) throw new GroqError('timeout');
    if (opts.signal?.aborted) throw e;
    throw new GroqError('offline');
  } finally {
    window.clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onOuterAbort);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new GroqError(mapStatus(res.status, body), res.status);
  }
  const data = await res.json().catch(() => null) as { choices?: { message?: { content?: string } }[] } | null;
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new GroqError('unknown', res.status);
  return text;
}

/** Requisição mínima para validar chave e modelo. */
export async function testKey(key: string, model: string): Promise<{ ok: true } | { ok: false; error: GroqError }> {
  try {
    await groqChat(key.trim(), model, [{ role: 'user', content: 'Responda apenas: ok' }], { maxTokens: 16, temperature: 0 });
    return { ok: true };
  } catch (e) {
    // HTTP 2xx sem texto (ex.: modelo de raciocínio cortado pelo max_tokens): chave e modelo funcionam.
    if (e instanceof GroqError && e.kind === 'unknown' && e.status !== undefined && e.status >= 200 && e.status < 300) {
      return { ok: true };
    }
    return { ok: false, error: e instanceof GroqError ? e : new GroqError('unknown') };
  }
}

/* ---------- RAG-lite ---------- */

const STOPWORDS = new Set(('a o as os um uma uns umas de da do das dos e em no na nos nas por para pra com sem que se ser eu meu minha voce ' +
  'devo posso qual quais quanto quanta quantos quantas como quando onde porque por que isso esse essa este esta tem ter e ou mais menos muito ' +
  'muita dia dias ao aos sobre fazer faz é sao seja ja nao sim me mim te lhe la lo antes depois treino treinar treinos').split(' '));

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t))
    .map(stem);
}

/** Radical simples: tira plural/gênero comuns para casar "series"/"serie", "proteinas"/"proteina". */
function stem(t: string): string {
  if (t.length > 5 && t.endsWith('mente')) t = t.slice(0, -5);
  if (t.length > 4 && t.endsWith('s')) t = t.slice(0, -1);
  if (t.length > 4 && (t.endsWith('a') || t.endsWith('o') || t.endsWith('e'))) t = t.slice(0, -1);
  return t;
}

/** Casa tokens iguais ou com o mesmo início (≥5 letras): "alongar" ~ "alongamento". */
function similar(a: string, b: string): boolean {
  if (a === b) return true;
  const n = Math.min(a.length, b.length);
  return n >= 5 && a.slice(0, 5) === b.slice(0, 5) && (a.startsWith(b.slice(0, n - 1)) || b.startsWith(a.slice(0, n - 1)));
}

function overlap(q: string[], doc: string[]): number {
  const docSet = [...new Set(doc)];
  let n = 0;
  for (const t of new Set(q)) if (docSet.some(d => similar(t, d))) n++;
  return n;
}

export function rankArtigos(pergunta: string, limit = 3): ArtigoCientifico[] {
  const q = tokenize(pergunta);
  if (q.length === 0) return [];
  return artigos
    .map(a => {
      const tagScore = overlap(q, a.tags.flatMap(tokenize)) * 3;
      const titleScore = overlap(q, tokenize(a.titulo)) * 2;
      const bodyScore = overlap(q, tokenize(a.resumo));
      return { a, score: tagScore + titleScore + bodyScore };
    })
    .filter(x => x.score >= 2)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map(x => x.a);
}

/** Melhor resposta pré-definida por sobreposição de palavras (sem acento). */
export function matchRespostaMock(pergunta: string): { resposta: string; artigos: string[] } | null {
  const q = tokenize(pergunta);
  if (q.length === 0) return null;
  let best: { score: number; r: (typeof respostasIA)[number] } | null = null;
  for (const r of respostasIA) {
    const tags = r.artigos.flatMap(id => artigos.find(a => a.id === id)?.tags ?? []);
    const score = overlap(q, tokenize(r.pergunta)) * 3 + overlap(q, tags.flatMap(tokenize)) * 2 + overlap(q, tokenize(r.resposta));
    if (!best || score > best.score) best = { score, r };
  }
  return best && best.score >= 3 ? { resposta: best.r.resposta, artigos: best.r.artigos } : null;
}

export const RESPOSTA_PADRAO =
  'Ainda não tenho uma resposta pronta sobre esse tema. Para orientações personalizadas, procure um Profissional de Educação Física, nutricionista ou médico. Você também pode explorar a Biblioteca científica.';

/* ---------- Prompt ---------- */

const SYSTEM_PROMPT = `Você é o assistente do Folio, um caderno inteligente de saúde e treino (slogan: "Corpo, rotina e ciência").
Responda SEMPRE em português do Brasil, de forma clara, acolhedora e concisa (até ~180 palavras; use listas curtas quando ajudar).
Temas: treino de força, rotina, sono, hidratação, alimentação geral e suplementos — com base em evidências científicas.

Regras inegociáveis:
- NUNCA faça diagnóstico, não prescreva tratamentos, medicamentos, dietas ou treinos individualizados.
- Não indique doses além das faixas gerais descritas na literatura, e deixe claro que são faixas gerais.
- Nunca incentive práticas lesivas (jejum extremo, desidratação, sobrecarga perigosa, uso de anabolizantes, treinar com dor aguda etc.).
- Quando houver dor, lesão, sintomas, doença, gestação, uso de medicamentos ou dúvidas individuais, recomende procurar um médico, nutricionista ou Profissional de Educação Física, conforme o caso.
- Se o tema fugir de saúde, treino e rotina, diga educadamente que só pode ajudar com esses assuntos.
- Diga explicitamente quando a evidência for limitada, conflitante ou inexistente. Não invente estudos.
- Cite SOMENTE os artigos fornecidos no contexto, usando [n] logo após a afirmação. Não cite nenhuma outra fonte.`;

export interface AskContext {
  exerciciosHoje?: string[];
}

export interface AskResult {
  texto: string;
  artigos: string[];
}

export async function askAssistant(
  key: string,
  model: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  pergunta: string,
  ctx: AskContext = {},
  signal?: AbortSignal,
): Promise<AskResult> {
  const fontes = rankArtigos(pergunta, 3);
  const contexto = fontes.length
    ? fontes.map((a, i) => `[${i + 1}] ${a.titulo} — ${a.fonte} (${a.ano}). ${a.resumo}`).join('\n')
    : 'Nenhum artigo da biblioteca do Folio é relevante para esta pergunta. Responda com cautela e informe que a biblioteca não tem referências sobre o tema.';

  const usuario = ctx.exerciciosHoje?.length
    ? `\n\nContexto do usuário (apenas informativo): treino de hoje inclui ${ctx.exerciciosHoje.slice(0, 10).join(', ')}.`
    : '';

  const messages: ChatMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\nArtigos disponíveis:\n${contexto}${usuario}` },
    ...history.slice(-8),
    { role: 'user', content: pergunta },
  ];

  const texto = await groqChat(key, model, messages, { signal });
  // Mantém a ordem fornecida para que [n] no texto corresponda ao n-ésimo item de Referências.
  return { texto, artigos: fontes.map(a => a.id) };
}
