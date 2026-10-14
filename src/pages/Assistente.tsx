import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Button, IconButton } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Pill } from '../components/ui/Pill';
import { toast } from '../components/ui/Toast';
import { artigos, respostasIA } from '../data/ciencia';
import { repo } from '../data/repository';
import { useAuthStore } from '../hooks/useAuthStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useTreinoStore } from '../hooks/useTreinoStore';
import { buscarConhecimento, referenciaDoc } from '../lib/conhecimento';
import { askAssistant, GroqError, matchRespostaMock, RESPOSTA_PADRAO } from '../lib/groq';
import { contextoUsuario } from '../lib/contexto';

type Origem = 'ia' | 'demo' | 'fallback';

type Mensagem =
  | { id: string; tipo: 'user'; texto: string }
  | { id: string; tipo: 'ia'; texto: string; artigos: string[]; materiais?: string[]; origem: Origem }
  | { id: string; tipo: 'erro'; texto: string; pergunta: string };

const SS_KEY = 'folio_chat';
const sugestoes = respostasIA.map(r => r.pergunta).slice(0, 6);

let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

function loadChat(): Mensagem[] {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? (JSON.parse(raw) as Mensagem[]) : [];
  } catch { return []; }
}

function mockResposta(pergunta: string): { texto: string; artigos: string[] } {
  const m = matchRespostaMock(pergunta);
  return m ? { texto: m.resposta, artigos: m.artigos } : { texto: RESPOSTA_PADRAO, artigos: [] };
}

/* ---------- Renderização leve de texto (parágrafos, listas, **negrito**, [n]) ---------- */

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\d\])/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>;
    if (/^\[\d\]$/.test(p)) {
      return (
        <sup key={i} className="text-science font-semibold text-[11px] ml-0.5" aria-label={`referência ${p.slice(1, -1)}`}>
          {p}
        </sup>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, bi) => {
        const lines = b.split('\n').filter(l => l.trim());
        const isList = lines.length > 0 && lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="flex flex-col gap-1 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden />
                  <span>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ''))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="anim-rise flex items-center gap-2" role="status" aria-label="O assistente está digitando">
      <AssistantAvatar />
      <div className="bg-surface card-border rounded-[var(--radius-card)] px-4 py-3 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="pulse w-2 h-2 rounded-full bg-ink-muted"
            style={{ animationDelay: `${i * 180}ms` } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <span className="w-8 h-8 rounded-full bg-brand-ghost text-brand flex items-center justify-center shrink-0" aria-hidden>
      <Icon name="sparkle" size={16} strokeWidth={2} />
    </span>
  );
}

function Referencias({ ids, materiais = [] }: { ids: string[]; materiais?: string[] }) {
  const lista = ids.map(id => artigos.find(a => a.id === id)).filter(Boolean) as typeof artigos;
  if (!lista.length && !materiais.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-black/[0.06] flex flex-col gap-2">
      <span className="text-[12px] text-ink-muted font-semibold uppercase tracking-wide">Referências</span>
      <ol className="flex flex-col gap-1.5">
        {lista.map((a, i) => (
          <li key={a.id} className="text-[13px] text-ink-body leading-snug flex gap-1.5" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-science font-semibold tabular">[{i + 1}]</span>
            <span>
              <span className="text-ink">{a.titulo}.</span>{' '}
              <span className="italic">{a.fonte}</span>, {a.ano}.
            </span>
          </li>
        ))}
        {materiais.map((m, i) => (
          <li key={m} className="text-[13px] text-ink-body leading-snug flex gap-1.5" style={{ fontFamily: 'var(--font-serif)' }}>
            <span className="text-science font-semibold tabular">[{lista.length + i + 1}]</span>
            <span><span className="text-ink">{m}.</span> <span className="italic">Seus materiais</span>.</span>
          </li>
        ))}
      </ol>
      <Link to="/biblioteca" className="focus-ring self-start inline-flex items-center gap-1 min-h-[44px] text-[13px] font-medium text-brand hover:underline underline-offset-4">
        <Icon name="book" size={16} /> Ver na Biblioteca
      </Link>
    </div>
  );
}

export function Assistente() {
  const usuario = useAuthStore(s => s.usuario);
  const isAdmin = usuario?.role === 'admin';
  const groqApiKey = useSettingsStore(s => s.groqApiKey);
  const groqModel = useSettingsStore(s => s.groqModel);
  const setAiError = useSettingsStore(s => s.setAiError);
  const sessao = useTreinoStore(s => s.sessao);

  const [mensagens, setMensagens] = useState<Mensagem[]>(loadChat);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Incrementado em "Nova conversa": respostas de pedidos antigos são descartadas.
  const geracaoRef = useRef(0);

  const temIA = !!groqApiKey;

  const exerciciosHoje = useMemo(
    () => (sessao?.itens ?? []).map(it => repo.getExercicio(it.exercicioId)?.nome).filter((n): n is string => !!n),
    [sessao],
  );

  useEffect(() => {
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(mensagens)); } catch { /* ignore */ }
  }, [mensagens]);

  useEffect(() => {
    if (mensagens.length === 0 && !loading) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [mensagens, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function responder(pergunta: string, historico: Mensagem[]) {
    const geracao = geracaoRef.current;
    const atual = () => geracao === geracaoRef.current;
    setLoading(true);
    try {
      if (!temIA) {
        await new Promise(r => setTimeout(r, 650));
        if (!atual()) return;
        const m = mockResposta(pergunta);
        if (m.texto === RESPOSTA_PADRAO) {
          // Sem IA: mostra o trecho mais parecido dos materiais do dono, se houver.
          const achados = await buscarConhecimento(pergunta, 2);
          if (achados.length && atual()) {
            const texto = `Encontrei isto nos seus materiais:\n\n${achados.map((a, i) => `[${i + 1}] "${a.trecho.texto.slice(0, 420).trim()}…"`).join('\n\n')}`;
            setMensagens(prev => [...prev, { id: uid(), tipo: 'ia', texto, artigos: [], materiais: achados.map(a => referenciaDoc(a.doc)), origem: 'demo' }]);
            return;
          }
        }
        setMensagens(prev => [...prev, { id: uid(), tipo: 'ia', texto: m.texto, artigos: m.artigos, origem: 'demo' }]);
        return;
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const history = historico
        .filter((m): m is Exclude<Mensagem, { tipo: 'erro' }> => m.tipo !== 'erro')
        .filter(m => m.tipo === 'user' || m.origem === 'ia')
        .map(m => ({ role: m.tipo === 'user' ? ('user' as const) : ('assistant' as const), content: m.texto }));
      const achados = await buscarConhecimento(pergunta, 3);
      const materiais = achados.map(a => ({ ref: referenciaDoc(a.doc), texto: a.trecho.texto }));
      const res = await askAssistant(groqApiKey, groqModel, history, pergunta, { exerciciosHoje, usuario: contextoUsuario(), materiais }, ctrl.signal);
      if (ctrl.signal.aborted || !atual()) return;
      setAiError(null);
      setMensagens(prev => [...prev, { id: uid(), tipo: 'ia', texto: res.texto, artigos: res.artigos, materiais: res.materiais, origem: 'ia' }]);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (!atual()) return;
      const err = e instanceof GroqError ? e : new GroqError('unknown');
      if (err.kind === 'invalid_key' || err.kind === 'model') setAiError(err.message);
      const m = mockResposta(pergunta);
      setMensagens(prev => [
        ...prev,
        { id: uid(), tipo: 'erro', texto: err.message, pergunta },
        ...(m.texto !== RESPOSTA_PADRAO
          ? [{ id: uid(), tipo: 'ia' as const, texto: m.texto, artigos: m.artigos, origem: 'fallback' as const }]
          : []),
      ]);
    } finally {
      if (atual()) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }

  function enviar(texto: string) {
    const q = texto.trim();
    if (!q || loading) return;
    const historico = mensagens;
    setMensagens(prev => [...prev, { id: uid(), tipo: 'user', texto: q }]);
    setInput('');
    void responder(q, historico);
  }

  function tentarNovamente(erroId: string, pergunta: string) {
    if (loading) return;
    const idx = mensagens.findIndex(m => m.id === erroId);
    if (idx < 0) return;
    // Remove o erro e a resposta pré-definida que veio junto.
    const next = mensagens.slice(0, idx);
    const historico = next.slice(0, -1);
    setMensagens(next);
    void responder(pergunta, historico);
  }

  function novaConversa() {
    geracaoRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setMensagens([]);
    setInput('');
    try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
    toast.info('Nova conversa iniciada');
    inputRef.current?.focus();
  }

  const vazio = mensagens.length === 0;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto flex flex-col gap-4" style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}>
      <PageHeader
        title="Assistente"
        subtitle={temIA ? 'IA com base em evidências científicas' : 'Respostas baseadas em evidências científicas'}
        right={!vazio ? <IconButton icon="refresh" label="Nova conversa" onClick={novaConversa} /> : undefined}
      />

      {!temIA && (
        <div className="anim-fade rounded-[var(--radius-card)] card-border bg-brand-ghost px-4 py-3 flex gap-3 items-start" role="note">
          <Icon name="info" size={20} className="text-brand shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink leading-snug">
            Modo demonstração — respostas pré-definidas.{' '}
            {isAdmin ? (
              <>
                O dono pode ativar a IA em{' '}
                <Link to="/configuracoes" className="focus-ring font-semibold text-brand underline underline-offset-4">Configurações</Link>.
              </>
            ) : (
              'O dono pode ativar a IA em Configurações.'
            )}
          </p>
        </div>
      )}

      {vazio && (
        <section className="stagger flex flex-col gap-4 items-center text-center pt-4">
          <span className="illo-float w-16 h-16 rounded-full bg-brand-ghost text-brand flex items-center justify-center">
            <Icon name="chat" size={30} />
          </span>
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Como posso ajudar hoje?</h2>
            <p className="text-[14px] text-ink-body mt-1 max-w-[320px] mx-auto">
              Pergunte sobre treino, sono, hidratação, suplementos e rotina.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2" aria-label="Sugestões de perguntas">
            {sugestoes.map(s => (
              <Pill key={s} onClick={() => enviar(s)} className="pressable min-h-[44px] text-left">
                {s}
              </Pill>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3" aria-live="polite" aria-relevant="additions">
        {mensagens.map(m => {
          if (m.tipo === 'user') {
            return (
              <div key={m.id} className="anim-rise flex justify-end">
                <div className="bg-brand text-white px-4 py-3 rounded-[var(--radius-card)] rounded-br-[4px] max-w-[85%] text-[15px] leading-snug whitespace-pre-wrap break-words">
                  {m.texto}
                </div>
              </div>
            );
          }
          if (m.tipo === 'erro') {
            return (
              <div key={m.id} className="anim-rise flex gap-2 items-start">
                <span className="w-8 h-8 rounded-full bg-tint-danger text-vermillion flex items-center justify-center shrink-0" aria-hidden>
                  <Icon name="warning" size={16} strokeWidth={2} />
                </span>
                <div className="flex-1 rounded-[var(--radius-card)] card-border bg-tint-danger px-4 py-3" role="alert">
                  <p className="text-[14px] text-ink">{m.texto}</p>
                  <Button
                    variant="text"
                    size="sm"
                    icon="refresh"
                    className="-ml-2 mt-1"
                    onClick={() => tentarNovamente(m.id, m.pergunta)}
                    disabled={loading}
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="anim-rise flex gap-2 items-start">
              <AssistantAvatar />
              <div className="flex-1 min-w-0 bg-surface card-border rounded-[var(--radius-card)] rounded-tl-[4px] px-4 py-3">
                {m.origem !== 'ia' && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted mb-1.5">
                    <Icon name="book" size={13} />
                    {m.origem === 'demo' ? 'Resposta pré-definida' : 'Resposta pré-definida (IA indisponível)'}
                  </span>
                )}
                <div className="text-[15px] text-ink-body leading-relaxed break-words">
                  <RichText text={m.texto} />
                </div>
                <Referencias ids={m.artigos} materiais={m.materiais} />
              </div>
            </div>
          );
        })}
        {loading && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <div
        className="fixed left-0 right-0 z-30 px-4 pt-2 pb-2 bg-canvas border-t border-black/[0.06]"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        <form
          className="max-w-lg mx-auto flex gap-2"
          onSubmit={e => { e.preventDefault(); enviar(input); }}
        >
          <label htmlFor="assistente-input" className="sr-only">Sua pergunta</label>
          <input
            id="assistente-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={loading ? 'Aguardando resposta…' : 'Faça uma pergunta…'}
            autoComplete="off"
            enterKeyHint="send"
            maxLength={600}
            className="flex-1 min-w-0 h-[44px] px-4 rounded-[var(--radius-btn)] card-border bg-surface text-[15px] text-ink outline-none transition-std focus:border-brand/40"
          />
          <button
            type="submit"
            aria-label="Enviar pergunta"
            disabled={loading || !input.trim()}
            className="pressable focus-ring h-[44px] w-[44px] shrink-0 rounded-[var(--radius-btn)] bg-brand text-white flex items-center justify-center cursor-pointer transition-std disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="spin w-5 h-5 rounded-full border-2 border-white/30 border-t-white" aria-hidden />
            ) : (
              <Icon name="send" size={20} />
            )}
          </button>
        </form>
        <p className="max-w-lg mx-auto text-[12px] text-ink-body mt-1.5 text-center leading-snug">
          Conteúdo informativo, não substitui médico, nutricionista ou Profissional de Educação Física.
        </p>
      </div>
    </div>
  );
}
