import { artigos, respostasIA, type ArtigoCientifico } from '../data/ciencia';
import { repo } from '../data/repository';
import type { EsquemaSeries, Exercicio, FichaModelo, FichaModeloItem } from '../data/types';
import { perfilParaTexto, type PerfilFisico } from '../hooks/usePerfilStore';

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

interface CompletionOptions { temperature?: number; maxTokens?: number; signal?: AbortSignal; json?: boolean }

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
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
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
  /** Perfil, rotina, sono e água do usuário (texto já resumido). */
  usuario?: string;
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

  const partesUsuario = [
    ctx.usuario,
    ctx.exerciciosHoje?.length ? `treino de hoje inclui ${ctx.exerciciosHoje.slice(0, 10).join(', ')}` : '',
  ].filter(Boolean);
  const usuario = partesUsuario.length
    ? `\n\nContexto do usuário (informado por ele; use para personalizar com cautela, sem diagnosticar): ${partesUsuario.join('; ')}.`
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

/* ---------------- Sugestão de ficha ---------------- */

function extrairJSON(texto: string): unknown {
  try { return JSON.parse(texto); } catch { /* tenta extrair o objeto */ }
  const i = texto.indexOf('{'), j = texto.lastIndexOf('}');
  if (i >= 0 && j > i) {
    try { return JSON.parse(texto.slice(i, j + 1)); } catch { /* inválido */ }
  }
  return null;
}

function catalogoCompacto(): string {
  return repo.getExercicios().map(e => {
    const prim = repo.getMusculosDoExercicio(e.id).filter(m => m.papel === 'primario').map(m => m.musculo.nome).join('/');
    return `${e.id} | ${e.nome} | ${prim} | ${e.equipamento}${e.isometrico ? ' | isométrico' : ''}`;
  }).join('\n');
}

type FichaSemIds = Omit<FichaModelo, 'id' | 'itens'> & { itens: Omit<FichaModeloItem, 'id' | 'fichaId' | 'ordem'>[] };

/** Pede à IA uma proposta de ficha usando SOMENTE o catálogo do Folio. Valida tudo antes de devolver. */
export async function sugerirFichaIA(key: string, model: string, perfil: PerfilFisico, pedido: string): Promise<FichaSemIds[]> {
  const sistema = `Você monta propostas de fichas de treino de musculação para o app Folio, em português do Brasil.
Use SOMENTE exercícios do catálogo abaixo, pelo id. Respeite lesões/restrições informadas evitando exercícios que sobrecarreguem a região.
Respeite o local de treino (sem máquinas se for em casa). Esquema padrão: pirâmide 12/10/8 ("piramide", 3 séries). Para abdominais e isométricos use "fixo" com reps (isométrico: segundos).
Entre 1 e 4 fichas, cada uma com 4 a 8 exercícios. diaSemana: 0=domingo ... 6=sábado, ou null.
Responda APENAS com JSON no formato:
{"fichas":[{"nome":"Treino A — ...","sigla":"A","diaSemana":1,"itens":[{"exercicioId":"ex01","series":3,"esquema":"piramide","reps":"12/10/8","descansoSeg":90}]}]}

Catálogo (id | nome | músculos primários | equipamento):
${catalogoCompacto()}`;
  const usuario = `Perfil: ${perfilParaTexto(perfil) || 'não informado'}.${pedido.trim() ? ` Pedido: ${pedido.trim()}` : ''}`;
  const texto = await groqChat(key, model, [{ role: 'system', content: sistema }, { role: 'user', content: usuario }], { maxTokens: 1800, temperature: 0.3, json: true });
  const dados = extrairJSON(texto) as { fichas?: unknown } | null;
  const brutas = Array.isArray(dados?.fichas) ? dados!.fichas as Record<string, unknown>[] : [];
  const fichas: FichaSemIds[] = [];
  for (const f of brutas.slice(0, 4)) {
    const itensBrutos = Array.isArray(f.itens) ? f.itens as Record<string, unknown>[] : [];
    const itens = itensBrutos
      .map(it => {
        const ex = repo.getExercicio(String(it.exercicioId ?? ''));
        if (!ex) return null;
        const esquema: EsquemaSeries = ex.isometrico || it.esquema === 'fixo' ? 'fixo' : 'piramide';
        const series = Math.min(6, Math.max(1, Math.round(Number(it.series) || 3)));
        const repsNum = parseInt(String(it.reps ?? ''), 10);
        return {
          exercicioId: ex.id,
          series,
          esquema,
          reps: esquema === 'piramide' ? '12/10/8' : String(repsNum > 0 ? Math.min(300, repsNum) : ex.isometrico ? 30 : 12),
          descansoSeg: Math.min(300, Math.max(30, Math.round(Number(it.descansoSeg) || 90))),
          notas: '',
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .slice(0, 10);
    if (!itens.length) continue;
    const dia = Number(f.diaSemana);
    fichas.push({
      nome: String(f.nome ?? 'Treino sugerido').slice(0, 60),
      sigla: String(f.sigla ?? '').slice(0, 2).toUpperCase() || undefined,
      diaSemana: Number.isInteger(dia) && dia >= 0 && dia <= 6 ? dia : null,
      itens,
    });
  }
  if (!fichas.length) throw new GroqError('unknown');
  return fichas;
}

/* ---------------- Sugestão na troca de exercício ---------------- */

export async function sugerirTrocaIA(
  key: string, model: string, atual: Exercicio, alternativas: Exercicio[], contextoUsuario: string,
): Promise<string> {
  const lista = alternativas.slice(0, 12).map(e => {
    const prim = repo.getMusculosDoExercicio(e.id).filter(m => m.papel === 'primario').map(m => m.musculo.nome).join('/');
    const est = e.estresse;
    return `- ${e.nome} (${prim}; equipamento ${e.equipamento}; exigência lombar ${est.lombar}, joelho ${est.joelho}, ombro ${est.ombro}, cotovelo ${est.cotovelo} em 0–2)`;
  }).join('\n');
  const sistema = `Você é o assistente do Folio. Ajude a escolher uma alternativa para um exercício de musculação, de forma CONSULTIVA (nunca impositiva), em português do Brasil, em até 120 palavras.
Explique em 1 frase que exercícios diferentes não são biomecanicamente equivalentes. Recomende 1 ou 2 opções DA LISTA e o motivo (músculos, equipamento, exigência articular).
Se houver lesão/restrição informada, priorize menor exigência na região e recomende avaliação profissional. Não diagnostique, não prescreva.`;
  const usuario = `Exercício atual: ${atual.nome}.\nAlternativas disponíveis:\n${lista}\n${contextoUsuario ? `Contexto do usuário: ${contextoUsuario}` : ''}`;
  return groqChat(key, model, [{ role: 'system', content: sistema }, { role: 'user', content: usuario }], { maxTokens: 400, temperature: 0.3 });
}

/* ---------------- Nutrição ---------------- */

const SYSTEM_NUTRI = `Você é o apoio de nutrição do Folio ("Corpo, rotina e ciência"). Responda em português do Brasil, de forma prática, acolhedora e concisa (até ~200 palavras, listas curtas).
Você ajuda a organizar uma rotina alimentar e a fazer substituições de alimentos, considerando o que a pessoa tem em casa, seus horários e treinos.
Regras inegociáveis:
- Você NÃO substitui nutricionista. Não faça diagnóstico, não prescreva dietas terapêuticas, não calcule dietas restritivas, não indique medicamentos nem suplementos em doses.
- Se houver um plano de uma nutricionista, ele é a referência: sugira trocas equivalentes (mesmo grupo alimentar e porção aproximada) e diga para confirmar com a profissional.
- Para diabetes, doença renal, gestação, transtornos alimentares, alergias graves, uso de medicamentos ou perda de peso rápida: oriente procurar nutricionista/médico.
- Nunca incentive jejum extremo, cortes drásticos, compensação de calorias com exercício ou práticas lesivas.
- Quantidades são aproximadas ("medida caseira") e devem ser ajustadas pela profissional.`;

export async function askNutri(
  key: string, model: string, history: { role: 'user' | 'assistant'; content: string }[], pergunta: string,
  contexto: { usuario?: string; plano?: string }, signal?: AbortSignal,
): Promise<string> {
  const ctx = [
    contexto.usuario ? `Contexto do usuário: ${contexto.usuario}.` : '',
    contexto.plano ? `Plano alimentar cadastrado pelo usuário:\n${contexto.plano}` : 'O usuário ainda não cadastrou um plano alimentar.',
  ].filter(Boolean).join('\n\n');
  return groqChat(key, model, [
    { role: 'system', content: `${SYSTEM_NUTRI}\n\n${ctx}` },
    ...history.slice(-8),
    { role: 'user', content: pergunta },
  ], { maxTokens: 800, temperature: 0.4, signal });
}

export interface RefeicaoIA { nome: string; hora: string; itens: string[] }

/** Converte um plano colado como texto em refeições estruturadas. */
export async function estruturarPlanoIA(key: string, model: string, texto: string): Promise<RefeicaoIA[]> {
  const sistema = `Converta o plano alimentar abaixo em JSON, sem inventar alimentos nem quantidades. Formato:
{"refeicoes":[{"nome":"Café da manhã","hora":"07:00","itens":["2 ovos mexidos","1 fatia de pão integral"]}]}
Se não houver horário, use "". Responda apenas com o JSON.`;
  const resp = await groqChat(key, model, [{ role: 'system', content: sistema }, { role: 'user', content: texto.slice(0, 6000) }], { maxTokens: 1500, temperature: 0, json: true });
  const dados = extrairJSON(resp) as { refeicoes?: unknown } | null;
  const lista = Array.isArray(dados?.refeicoes) ? dados!.refeicoes as Record<string, unknown>[] : [];
  const out = lista.map(r => ({
    nome: String(r.nome ?? 'Refeição').slice(0, 40),
    hora: /^\d{2}:\d{2}$/.test(String(r.hora ?? '')) ? String(r.hora) : '',
    itens: (Array.isArray(r.itens) ? r.itens : []).map(i => String(i).slice(0, 120)).filter(Boolean).slice(0, 20),
  })).filter(r => r.itens.length);
  if (!out.length) throw new GroqError('unknown');
  return out;
}
