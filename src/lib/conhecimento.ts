/**
 * Base de conhecimento do usuário (artigos, livros, apostilas, vídeos, anotações).
 *
 * Não é "treino" do modelo (fine-tuning): é RAG. O texto é dividido em trechos,
 * guardado no IndexedDB do aparelho e, a cada pergunta, os trechos mais parecidos
 * são enviados junto com o prompt, com a fonte para citação.
 * Com o Supabase, os trechos podem ganhar embeddings (pgvector) para busca semântica.
 */
import { tokenize } from './groq';
import { useConhecimentoStore, type DocConhecimento } from '../hooks/useConhecimentoStore';

const DB = 'folio_conhecimento';
const STORE = 'trechos';

export interface Trecho { id: string; docId: string; idx: number; texto: string }

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB indisponível')); return; }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('docId', 'docId');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return abrir().then(db => new Promise<T | undefined>((resolve, reject) => {
    const t = db.transaction(STORE, modo);
    const r = fn(t.objectStore(STORE));
    t.oncomplete = () => { resolve(r ? r.result : undefined); db.close(); };
    t.onerror = () => { reject(t.error); db.close(); };
    t.onabort = () => { reject(t.error); db.close(); };
  }));
}

/** Divide o texto em trechos de ~1.000 caracteres, respeitando parágrafos e frases. */
export function dividirEmTrechos(texto: string, alvo = 1000, sobreposicao = 150): string[] {
  const limpo = texto.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!limpo) return [];
  const frases = limpo.split(/(?<=[.!?])\s+|\n\n/);
  const out: string[] = [];
  let atual = '';
  for (const f of frases) {
    if ((atual + ' ' + f).length > alvo && atual) {
      out.push(atual.trim());
      atual = atual.slice(-sobreposicao).replace(/^\S*\s/, '') + ' ' + f;
    } else {
      atual = atual ? `${atual} ${f}` : f;
    }
    while (atual.length > alvo * 1.6) { out.push(atual.slice(0, alvo)); atual = atual.slice(alvo - sobreposicao); }
  }
  if (atual.trim()) out.push(atual.trim());
  return out;
}

let cache: { trechos: (Trecho & { tokens: string[] })[]; df: Map<string, number> } | null = null;

export async function salvarTrechos(docId: string, texto: string): Promise<number> {
  const partes = dividirEmTrechos(texto);
  await removerTrechos(docId);
  const db = await abrir();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    const s = t.objectStore(STORE);
    partes.forEach((p, idx) => s.put({ id: `${docId}:${idx}`, docId, idx, texto: p } satisfies Trecho));
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
  cache = null;
  return partes.length;
}

export async function removerTrechos(docId: string) {
  const db = await abrir();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    const idx = t.objectStore(STORE).index('docId');
    const req = idx.openKeyCursor(IDBKeyRange.only(docId));
    req.onsuccess = () => {
      const c = req.result;
      if (c) { t.objectStore(STORE).delete(c.primaryKey); c.continue(); }
    };
    t.oncomplete = () => { db.close(); resolve(); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
  cache = null;
}

export async function limparConhecimento() {
  await tx('readwrite', s => s.clear());
  cache = null;
}

export async function trechosDoDoc(docId: string): Promise<Trecho[]> {
  const db = await abrir();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).index('docId').getAll(IDBKeyRange.only(docId));
    req.onsuccess = () => { db.close(); resolve((req.result as Trecho[]).sort((a, b) => a.idx - b.idx)); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function carregar() {
  if (cache) return cache;
  const todos = ((await tx<Trecho[]>('readonly', s => s.getAll() as IDBRequest<Trecho[]>)) ?? []);
  const trechos = todos.map(t => ({ ...t, tokens: tokenize(t.texto) }));
  const df = new Map<string, number>();
  for (const t of trechos) for (const tok of new Set(t.tokens)) df.set(tok, (df.get(tok) ?? 0) + 1);
  cache = { trechos, df };
  return cache;
}

export interface Achado { doc: DocConhecimento; trecho: Trecho; score: number }

/** Busca por palavras-chave (BM25 simplificado) nos documentos ativos. */
export async function buscarConhecimento(pergunta: string, k = 4): Promise<Achado[]> {
  const docs = useConhecimentoStore.getState().docs.filter(d => d.ativo);
  if (!docs.length) return [];
  const q = [...new Set(tokenize(pergunta))];
  if (!q.length) return [];
  let base;
  try { base = await carregar(); } catch { return []; }
  const ativos = new Map(docs.map(d => [d.id, d]));
  const N = base.trechos.length || 1;
  const media = base.trechos.reduce((s, t) => s + t.tokens.length, 0) / N || 1;
  const achados: Achado[] = [];
  for (const t of base.trechos) {
    const doc = ativos.get(t.docId);
    if (!doc) continue;
    let score = 0;
    for (const termo of q) {
      let tf = 0;
      for (const tok of t.tokens) if (tok === termo || (termo.length >= 5 && tok.startsWith(termo))) tf++;
      if (!tf) continue;
      const idf = Math.log(1 + (N - (base.df.get(termo) ?? 0) + 0.5) / ((base.df.get(termo) ?? 0) + 0.5));
      score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (t.tokens.length / media))));
    }
    // Título e etiquetas do documento também contam.
    const meta = tokenize(`${doc.titulo} ${doc.tags.join(' ')}`);
    score += q.filter(termo => meta.includes(termo)).length * 0.8;
    if (score > 0) achados.push({ doc, trecho: t, score });
  }
  achados.sort((a, b) => b.score - a.score);
  // No máximo 2 trechos por documento, para variar as fontes.
  const porDoc = new Map<string, number>();
  const out: Achado[] = [];
  for (const a of achados) {
    const n = porDoc.get(a.doc.id) ?? 0;
    if (n >= 2 || a.score < 1) continue;
    porDoc.set(a.doc.id, n + 1);
    out.push(a);
    if (out.length >= k) break;
  }
  return out;
}

export function referenciaDoc(d: DocConhecimento) {
  return `${d.titulo}${d.autor ? ` — ${d.autor}` : ''}${d.ano ? ` (${d.ano})` : ''}`;
}

/** Bloco de texto para o prompt, numerado a partir de `inicio`. */
export function formatarCitacoes(achados: Achado[], inicio = 1): string {
  return achados.map((a, i) => `[${inicio + i}] ${referenciaDoc(a.doc)}: "${a.trecho.texto.slice(0, 900)}"`).join('\n');
}

export async function citacoesConhecimento(pergunta: string, k = 3): Promise<string> {
  try { return formatarCitacoes(await buscarConhecimento(pergunta, k)); } catch { return ''; }
}
