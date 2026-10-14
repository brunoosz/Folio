import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { toast } from '../components/ui/Toast';
import { RichText, TypingIndicator } from './Assistente';
import {
  useNutricaoStore, planoParaTexto, interpretarPlanoTexto, type Refeicao,
} from '../hooks/useNutricaoStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useAuthStore } from '../hooks/useAuthStore';
import { gruposAlimentares, buscarAlimento } from '../data/substituicoes';
import { askNutri, estruturarPlanoIA, GroqError } from '../lib/groq';
import { contextoUsuario } from '../lib/contexto';

type Aba = 'plano' | 'conversa' | 'trocas';

const SUGESTOES = [
  'Monte uma rotina de refeições para os meus horários',
  'Não tenho frango em casa. O que uso no lugar?',
  'O que comer antes e depois do treino?',
  'Como organizar marmitas para a semana?',
];

/* ---------------- Plano ---------------- */

function FormRefeicao({ inicial, onSalvar, onRemover }: { inicial: Refeicao; onSalvar: (r: Refeicao) => void; onRemover?: () => void }) {
  const [nome, setNome] = useState(inicial.nome);
  const [hora, setHora] = useState(inicial.hora);
  const [itens, setItens] = useState(inicial.itens.join('\n'));
  const lista = itens.split('\n').map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Horário
          <input type="time" value={hora} onChange={e => setHora(e.target.value)}
            className="h-[48px] px-2 text-[16px] font-semibold tabular bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
        </label>
        <label className="flex flex-col gap-1 text-[14px] text-ink-body">Refeição
          <input value={nome} maxLength={40} onChange={e => setNome(e.target.value)} placeholder="Café da manhã"
            className="h-[48px] px-3 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[14px] text-ink-body">Alimentos (um por linha)
        <textarea rows={6} value={itens} onChange={e => setItens(e.target.value)} placeholder={'2 ovos mexidos\n1 fatia de pão integral\n1 fruta'}
          className="px-3 py-2.5 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>
      <Button variant="primary" icon="check" fullWidth disabled={!nome.trim() || !lista.length}
        onClick={() => onSalvar({ ...inicial, nome: nome.trim(), hora, itens: lista })}>Salvar refeição</Button>
      {onRemover && <Button variant="text" icon="trash" fullWidth className="!text-vermillion" onClick={onRemover}>Remover refeição</Button>}
    </div>
  );
}

function Plano({ onPerguntar }: { onPerguntar: (texto: string) => void }) {
  const n = useNutricaoStore();
  const { groqApiKey, groqModel } = useSettingsStore();
  const [editando, setEditando] = useState<Refeicao | null>(null);
  const [colar, setColar] = useState(false);
  const [texto, setTexto] = useState('');
  const [profissional, setProfissional] = useState(n.profissional);
  const [carregando, setCarregando] = useState(false);

  const importar = async () => {
    setCarregando(true);
    try {
      let refeicoes = interpretarPlanoTexto(texto);
      if (groqApiKey) {
        try { refeicoes = await estruturarPlanoIA(groqApiKey, groqModel, texto); } catch { /* usa a leitura local */ }
      }
      if (!refeicoes.length) { toast.error('Não encontrei refeições no texto. Coloque uma refeição por bloco.'); return; }
      n.substituirPlano(refeicoes, 'nutricionista', profissional.trim());
      setColar(false);
      setTexto('');
      toast.success(`${refeicoes.length} refeições importadas. Confira se está tudo certo.`);
    } finally {
      setCarregando(false);
    }
  };

  const nova = (): Refeicao => ({ id: `n${Date.now().toString(36)}`, nome: '', hora: '', itens: [] });

  return (
    <div className="flex flex-col gap-3">
      {n.refeicoes.length === 0 ? (
        <Card animate>
          <EmptyState compact title="Nenhum plano ainda"
            description="Cole o plano da sua nutricionista, monte sua rotina de refeições ou peça ajuda à IA."
            action={<div className="flex flex-col gap-2 w-full">
              <Button variant="primary" icon="copy" onClick={() => setColar(true)}>Colar plano da nutricionista</Button>
              <Button variant="ghost" icon="plus" onClick={() => setEditando(nova())}>Adicionar refeição</Button>
              <Button variant="text" icon="sparkle" onClick={() => onPerguntar(SUGESTOES[0])}>Criar com a IA</Button>
            </div>} />
        </Card>
      ) : (
        <>
          <Card animate padding={14} accent={n.origem === 'nutricionista' ? 'var(--color-tint-ok)' : 'var(--color-brand-ghost)'}>
            <p className="text-[14px] text-ink flex items-center gap-2">
              <Icon name={n.origem === 'nutricionista' ? 'shield' : 'user'} size={18} color={n.origem === 'nutricionista' ? 'var(--color-ok)' : 'var(--color-brand)'} />
              {n.origem === 'nutricionista' ? `Plano da nutricionista${n.profissional ? ` · ${n.profissional}` : ''}` : 'Minha rotina alimentar'}
            </p>
            {n.origem === 'nutricionista' && (
              <p className="text-[13px] text-ink-body mt-1">Este é o plano de referência. A IA sugere apenas trocas equivalentes.</p>
            )}
          </Card>
          {n.refeicoes.map((r, i) => (
            <Card key={r.id} animate index={i} padding={16} interactive onClick={() => setEditando(r)} aria-label={`Editar ${r.nome}`}>
              <div className="flex items-start gap-3">
                <span className="w-11 shrink-0 text-[14px] font-semibold tabular text-brand pt-0.5">{r.hora || '—'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-ink">{r.nome}</h3>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {r.itens.map((it, k) => (
                      <li key={k} className="text-[14px] text-ink-body flex gap-2"><span className="mt-[9px] w-1 h-1 rounded-full bg-ink-body shrink-0" />{it}</li>
                    ))}
                  </ul>
                </div>
                <Icon name="edit" size={18} color="var(--color-ink-body)" />
              </div>
            </Card>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" icon="plus" onClick={() => setEditando(nova())}>Refeição</Button>
            <Button variant="ghost" icon="copy" onClick={() => setColar(true)}>Colar plano</Button>
          </div>
          <Button variant="text" icon="sparkle" onClick={() => onPerguntar('Analise meu plano e sugira ajustes simples para os meus horários e treino, sem fugir do que a nutricionista passou.')}>
            Pedir ajuda à IA com este plano
          </Button>
        </>
      )}

      <Sheet open={!!editando} onClose={() => setEditando(null)} title={editando && n.refeicoes.some(r => r.id === editando.id) ? 'Editar refeição' : 'Nova refeição'}>
        {editando && (
          <FormRefeicao key={editando.id} inicial={editando}
            onSalvar={r => { if (!n.origem) n.setOrigem('proprio'); n.salvarRefeicao(r); setEditando(null); toast.success('Refeição salva'); }}
            onRemover={n.refeicoes.some(r => r.id === editando.id) ? () => { n.removerRefeicao(editando.id); setEditando(null); } : undefined} />
        )}
      </Sheet>

      <Sheet open={colar} onClose={() => !carregando && setColar(false)} title="Plano da nutricionista">
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-[14px] text-ink-body leading-relaxed">
            Cole o texto do plano (de um PDF, mensagem ou anotação). Um bloco por refeição, com o horário ou o nome na primeira linha.
            {groqApiKey ? ' A IA organiza o texto sem alterar alimentos nem quantidades.' : ''}
          </p>
          <label className="flex flex-col gap-1 text-[14px] text-ink-body">Nutricionista (opcional)
            <input value={profissional} maxLength={60} onChange={e => setProfissional(e.target.value)} placeholder="Nome e CRN"
              className="h-[44px] px-3 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
          </label>
          <textarea rows={10} value={texto} onChange={e => setTexto(e.target.value)} aria-label="Texto do plano"
            placeholder={'07:00 Café da manhã\n2 ovos mexidos\n1 fatia de pão integral\n\n12:00 Almoço\n4 col. de arroz\n1 concha de feijão\n100 g de frango'}
            className="px-3 py-2.5 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
          {n.refeicoes.length > 0 && <p className="text-[13px] text-ink-body">O plano atual será substituído.</p>}
          <Button variant="primary" icon="check" fullWidth loading={carregando} disabled={!texto.trim()} onClick={importar}>Importar plano</Button>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- Trocas offline ---------------- */

function Trocas() {
  const despensa = useNutricaoStore(s => s.despensa);
  const alternarDespensa = useNutricaoStore(s => s.alternarDespensa);
  const [grupoId, setGrupoId] = useState(gruposAlimentares[0].id);
  const [falta, setFalta] = useState<string | null>(null);
  const grupo = gruposAlimentares.find(g => g.id === grupoId)!;

  return (
    <div className="flex flex-col gap-3">
      <Card animate accent="var(--color-brand-ghost)" padding={14}>
        <p className="text-[14px] text-ink-body leading-relaxed">
          Faltou um alimento? Escolha o grupo e toque no que você não tem: mostramos trocas aproximadas do mesmo grupo.
          Marque <Icon name="home" size={14} className="inline -mt-0.5" /> o que costuma ter em casa para destacar. Funciona sem internet.
        </p>
      </Card>
      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Grupos alimentares">
        {gruposAlimentares.map(g => (
          <Pill key={g.id} className="shrink-0" selected={grupoId === g.id} onClick={() => { setGrupoId(g.id); setFalta(null); }}>{g.nome}</Pill>
        ))}
      </div>
      <Card key={grupoId} animate padding={16}>
        <h3 className="text-[16px] font-semibold">{grupo.nome}</h3>
        <p className="text-[13px] text-ink-body mt-0.5 mb-2">{grupo.descricao}</p>
        <ul className="flex flex-col divide-y divide-black/[0.06]">
          {grupo.itens.map((it, i) => {
            const ehFalta = falta === it.alimento;
            const temEmCasa = despensa.includes(it.alimento);
            return (
              <li key={it.alimento} className={`anim-rise flex items-center gap-1 transition-colors duration-200 ${ehFalta ? 'bg-tint-danger -mx-2 px-2 rounded-[var(--radius-btn)]' : ''}`} style={{ '--i': i } as CSSProperties}>
                <button type="button" onClick={() => setFalta(ehFalta ? null : it.alimento)} aria-pressed={ehFalta}
                  className="focus-ring flex-1 min-w-0 min-h-[52px] py-2 text-left">
                  <span className={`block text-[15px] ${ehFalta ? 'font-semibold text-vermillion' : falta && temEmCasa ? 'font-semibold text-ink' : 'text-ink'}`}>
                    {it.alimento}{ehFalta ? ' · não tenho' : ''}
                  </span>
                  <span className="block text-[13px] text-ink-body">{it.porcao}</span>
                </button>
                <IconButton icon="home" size={18} label={temEmCasa ? `Tirar ${it.alimento} da despensa` : `Tenho ${it.alimento} em casa`}
                  aria-pressed={temEmCasa} onClick={() => alternarDespensa(it.alimento)}
                  className={temEmCasa ? '!text-ok bg-tint-ok' : '!text-ink-body'} />
              </li>
            );
          })}
        </ul>
        {falta && (
          <div className="anim-fade mt-3 rounded-[var(--radius-btn)] bg-canvas p-3">
            <p className="text-[14px] text-ink">
              No lugar de <strong>{falta.toLowerCase()}</strong>, use uma das outras opções acima na porção indicada
              {grupo.itens.some(i => i.alimento !== falta && despensa.includes(i.alimento)) ? ', de preferência as que você tem em casa' : ''}.
            </p>
          </div>
        )}
      </Card>
      <p className="text-[12px] text-ink-body text-center">Equivalências aproximadas. Confirme as porções com sua nutricionista.</p>
    </div>
  );
}

/* ---------------- Conversa ---------------- */

function Conversa({ perguntaInicial, onConsumida }: { perguntaInicial: string | null; onConsumida: () => void }) {
  const n = useNutricaoStore();
  const { groqApiKey, groqModel } = useSettingsStore();
  const isAdmin = useAuthStore(s => s.usuario?.role === 'admin');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [importando, setImportando] = useState<string | null>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [n.mensagens.length, loading]);

  const respostaOffline = (pergunta: string) => {
    const achado = buscarAlimento(pergunta);
    if (achado) {
      const outros = achado.grupo.itens.filter(i => i !== achado.item).slice(0, 5);
      return `Trocas aproximadas para **${achado.item.alimento.toLowerCase()}** (${achado.item.porcao}), do grupo ${achado.grupo.nome.toLowerCase()}:\n\n${outros
        .map(o => `- ${o.alimento}: ${o.porcao}`).join('\n')}\n\nSão equivalências gerais. Confirme com sua nutricionista.`;
    }
    return 'No modo offline consigo sugerir trocas de alimentos (ex.: "não tenho arroz"). Para montar rotinas e tirar dúvidas, o dono do app pode ativar a IA em Configurações. Para um plano individual, procure uma nutricionista.';
  };

  const enviar = async (texto: string) => {
    const pergunta = texto.trim();
    if (!pergunta || loading) return;
    const historico = n.mensagens.slice(-8).map(m => ({ role: m.papel === 'user' ? 'user' as const : 'assistant' as const, content: m.texto }));
    n.addMensagem({ papel: 'user', texto: pergunta });
    setInput('');
    if (!groqApiKey) {
      n.addMensagem({ papel: 'ia', texto: respostaOffline(pergunta), origem: 'offline' });
      return;
    }
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const resposta = await askNutri(groqApiKey, groqModel, historico, pergunta,
        { usuario: contextoUsuario(), plano: planoParaTexto(n.refeicoes, n.origem, n.profissional) }, abortRef.current.signal);
      n.addMensagem({ papel: 'ia', texto: resposta, origem: 'ia' });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      n.addMensagem({ papel: 'ia', texto: `${e instanceof GroqError ? e.message : 'Não foi possível falar com a IA.'}\n\n${respostaOffline(pergunta)}`, origem: 'offline' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (perguntaInicial) { onConsumida(); void enviar(perguntaInicial); }
  }, [perguntaInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const usarComoPlano = async (msgId: string, texto: string) => {
    setImportando(msgId);
    try {
      const refeicoes = await estruturarPlanoIA(groqApiKey, groqModel, texto);
      n.substituirPlano(refeicoes, 'proprio');
      toast.success('Rotina salva em "Plano". Ajuste o que quiser.');
    } catch {
      toast.error('Não consegui transformar esta resposta em plano.');
    } finally {
      setImportando(null);
    }
  };

  return (
    <div className="flex flex-col gap-3" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom))' }}>
      {!groqApiKey && (
        <div className="anim-fade rounded-[var(--radius-card)] card-border bg-brand-ghost px-4 py-3 flex gap-3 items-start" role="note">
          <Icon name="info" size={20} className="text-brand shrink-0 mt-0.5" />
          <p className="text-[14px] text-ink leading-snug">
            Modo offline: só trocas de alimentos.{' '}
            {isAdmin ? <>Ative a IA em <Link to="/configuracoes" className="font-semibold text-brand underline underline-offset-4">Configurações</Link>.</> : 'O dono pode ativar a IA em Configurações.'}
          </p>
        </div>
      )}
      {n.mensagens.length === 0 && (
        <div className="stagger flex flex-col items-center text-center gap-3 pt-2">
          <span className="illo-float w-16 h-16 rounded-full bg-tint-warn flex items-center justify-center"><Icon name="utensils" size={28} color="var(--color-warn-ink)" /></span>
          <p className="text-[14px] text-ink-body max-w-[320px]">Converse sobre sua alimentação: rotina de refeições, trocas pelo que tem em casa, marmitas e treino.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGESTOES.map(s => <Pill key={s} onClick={() => enviar(s)} className="min-h-[44px] text-left">{s}</Pill>)}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-3" aria-live="polite">
        {n.mensagens.map(m => m.papel === 'user' ? (
          <div key={m.id} className="anim-rise flex justify-end">
            <div className="bg-brand text-white px-4 py-3 rounded-[var(--radius-card)] rounded-br-[4px] max-w-[85%] text-[15px] leading-snug whitespace-pre-wrap break-words">{m.texto}</div>
          </div>
        ) : (
          <div key={m.id} className="anim-rise flex gap-2 items-start">
            <span className="w-8 h-8 rounded-full bg-tint-warn flex items-center justify-center shrink-0" aria-hidden><Icon name="utensils" size={15} color="var(--color-warn-ink)" /></span>
            <div className="flex-1 min-w-0 bg-surface card-border rounded-[var(--radius-card)] rounded-tl-[4px] px-4 py-3">
              {m.origem === 'offline' && <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted mb-1.5"><Icon name="wifi-off" size={13} />Resposta offline</span>}
              <div className="text-[15px] text-ink-body leading-relaxed break-words"><RichText text={m.texto} /></div>
              {m.origem === 'ia' && /\d{1,2}[:h]\d{2}|café|almoço|jantar|lanche/i.test(m.texto) && m.texto.length > 160 && (
                <Button variant="text" size="sm" icon="calendar" className="-ml-2 mt-1" loading={importando === m.id} onClick={() => usarComoPlano(m.id, m.texto)}>
                  Usar como minha rotina alimentar
                </Button>
              )}
            </div>
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={fimRef} />
      </div>

      <div className="fixed left-0 right-0 z-30 px-4 pt-2 pb-2 bg-canvas border-t border-black/[0.06]" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        <form className="max-w-lg mx-auto flex gap-2" onSubmit={e => { e.preventDefault(); void enviar(input); }}>
          <label htmlFor="nutri-input" className="sr-only">Sua mensagem</label>
          <input id="nutri-input" value={input} onChange={e => setInput(e.target.value)} maxLength={600} autoComplete="off" enterKeyHint="send"
            placeholder={loading ? 'Aguardando resposta…' : 'Pergunte sobre sua alimentação…'}
            className="flex-1 min-w-0 h-[44px] px-4 rounded-[var(--radius-btn)] card-border bg-surface text-[15px] text-ink outline-none focus:border-brand/40" />
          <button type="submit" aria-label="Enviar" disabled={loading || !input.trim()}
            className="pressable focus-ring h-[44px] w-[44px] shrink-0 rounded-[var(--radius-btn)] bg-brand text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            <Icon name="send" size={20} />
          </button>
        </form>
        <p className="max-w-lg mx-auto text-[12px] text-ink-body mt-1.5 text-center leading-snug">Não substitui nutricionista. Em caso de doença, gestação ou restrições, procure acompanhamento.</p>
      </div>
    </div>
  );
}

/* ---------------- Página ---------------- */

export function Nutricao() {
  const [aba, setAba] = useState<Aba>(() => (sessionStorage.getItem('folio_nutri_aba') as Aba) || 'plano');
  const [perguntaInicial, setPerguntaInicial] = useState<string | null>(null);
  const limparConversa = useNutricaoStore(s => s.limparConversa);
  const temMensagens = useNutricaoStore(s => s.mensagens.length > 0);
  useEffect(() => { try { sessionStorage.setItem('folio_nutri_aba', aba); } catch { /* ignore */ } }, [aba]);

  const perguntar = (texto: string) => { setPerguntaInicial(texto); setAba('conversa'); };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Nutrição" subtitle="Rotina alimentar e trocas inteligentes" className="!mb-0"
        right={aba === 'conversa' && temMensagens ? <IconButton icon="refresh" label="Nova conversa" onClick={() => { limparConversa(); toast.info('Nova conversa'); }} /> : undefined} />

      <div role="tablist" aria-label="Seções da nutrição" className="anim-fade grid grid-cols-3 p-1 rounded-[var(--radius-btn)] bg-black/[0.05] gap-1">
        {([['plano', 'Plano'], ['conversa', 'Conversa'], ['trocas', 'Trocas']] as const).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={`pressable focus-ring min-h-[40px] rounded-[6px] text-[14px] font-medium transition-colors duration-200 ${aba === k ? 'bg-surface text-ink card-border' : 'text-ink-body'}`}>
            {t}
          </button>
        ))}
      </div>

      {aba === 'plano' && <Plano onPerguntar={perguntar} />}
      {aba === 'conversa' && <Conversa perguntaInicial={perguntaInicial} onConsumida={() => setPerguntaInicial(null)} />}
      {aba === 'trocas' && <Trocas />}
    </div>
  );
}
