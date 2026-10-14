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
import { askNutri, estruturarPlanoIA, analisarRefeicaoIA, GroqError } from '../lib/groq';
import { PratoChart } from '../components/PratoChart';
import { compararComPlano, grupoPrato } from '../lib/alimentos';
import { hojeLocal } from '../data/date';
import { contextoUsuario } from '../lib/contexto';
import { citacoesConhecimento } from '../lib/conhecimento';

type Aba = 'plano' | 'diario' | 'conversa' | 'trocas';

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

function Plano({ onPerguntar, onRegistrar }: { onPerguntar: (texto: string) => void; onRegistrar: (r: Refeicao) => void }) {
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
  const agora = new Date();
  const agoraHHMM = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  const proximaId = n.refeicoes.find(r => r.hora && r.hora >= agoraHHMM)?.id ?? null;

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
          {n.refeicoes.map((r, i) => {
            const proxima = r.id === proximaId;
            return (
              <Card key={r.id} animate index={i} padding={16} className={proxima ? '!border-brand/50' : ''}>
                <div className="flex items-center gap-3">
                  <span className="w-11 shrink-0 text-[14px] font-semibold tabular text-brand">{r.hora || '—'}</span>
                  <h3 className="flex-1 min-w-0 text-[16px] font-semibold text-ink">{r.nome}</h3>
                  {proxima && <Pill textColor="var(--color-brand)">Próxima</Pill>}
                  <IconButton icon="edit" label={`Editar ${r.nome}`} size={18} onClick={() => setEditando(r)} className="-mr-2" />
                </div>
                <div className="mt-3">
                  <PratoChart itens={r.itens} size={proxima ? 150 : 118} titulo={r.nome} />
                </div>
                <Button variant="text" size="sm" icon="check" className="mt-2 -ml-2" onClick={() => onRegistrar(r)}>
                  Registrar o que comi
                </Button>
              </Card>
            );
          })}
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
      const materiais = await citacoesConhecimento(`${pergunta} nutrição alimentação`, 3);
      const resposta = await askNutri(groqApiKey, groqModel, historico, pergunta,
        { usuario: contextoUsuario(), plano: planoParaTexto(n.refeicoes, n.origem, n.profissional), materiais }, abortRef.current.signal);
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

/* ---------------- Diário ---------------- */

const horaAgora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function RegistroSheet({ alvo, onClose, onSalvo }: { alvo: { refeicao: Refeicao | null } | null; onClose: () => void; onSalvo: () => void }) {
  return (
    <Sheet open={!!alvo} onClose={onClose} title="O que você comeu?">
      {alvo && <FormRegistro key={alvo.refeicao?.id ?? 'livre'} inicial={alvo.refeicao} onClose={onClose} onSalvo={onSalvo} />}
    </Sheet>
  );
}

function FormRegistro({ inicial, onClose, onSalvo }: { inicial: Refeicao | null; onClose: () => void; onSalvo: () => void }) {
  const n = useNutricaoStore();
  const { groqApiKey, groqModel } = useSettingsStore();
  const [refId, setRefId] = useState<string | null>(inicial?.id ?? null);
  const [hora, setHora] = useState(horaAgora());
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const ref = n.refeicoes.find(r => r.id === refId) ?? null;
  const itens = texto.split(/\n|,|;/).map(s => s.trim()).filter(Boolean);
  const comp = ref && itens.length ? compararComPlano(ref.itens, itens) : null;

  const salvar = async () => {
    setSalvando(true);
    const id = n.registrarRefeicao({ data: hojeLocal(), hora, refeicaoId: ref?.id ?? null, nome: ref?.nome ?? 'Refeição fora do plano', itens });
    if (groqApiKey) {
      try {
        const texto = await analisarRefeicaoIA(groqApiKey, groqModel, ref ? { nome: ref.nome, itens: ref.itens } : null, itens, contextoUsuario());
        n.setAnalise(id, { texto, origem: 'ia' });
      } catch { /* fica só a comparação local */ }
    }
    setSalvando(false);
    toast.success('Refeição registrada');
    onClose();
    onSalvo();
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      {n.refeicoes.length > 0 && (
        <div>
          <p className="text-[14px] text-ink-body mb-2">Refeição do plano</p>
          <div className="flex flex-wrap gap-2">
            {n.refeicoes.map(r => <Pill key={r.id} selected={refId === r.id} onClick={() => setRefId(r.id)}>{r.hora ? `${r.hora} · ` : ''}{r.nome}</Pill>)}
            <Pill selected={refId === null} onClick={() => setRefId(null)}>Fora do plano</Pill>
          </div>
        </div>
      )}
      <label className="flex flex-col gap-1 text-[14px] text-ink-body w-[130px]">Horário
        <input type="time" value={hora} onChange={e => setHora(e.target.value || hora)}
          className="h-[44px] px-2 text-[16px] font-semibold tabular bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>
      <label className="flex flex-col gap-1 text-[14px] text-ink-body">O que você comeu (um por linha ou separado por vírgula)
        <textarea rows={5} value={texto} onChange={e => setTexto(e.target.value)} autoFocus
          placeholder={ref ? ref.itens.slice(0, 3).join('\n') : '2 ovos mexidos\n1 pão francês\ncafé com leite'}
          className="px-3 py-2.5 text-[15px] text-ink bg-canvas rounded-[var(--radius-btn)] card-border focus:bg-surface" />
      </label>
      {itens.length > 0 && (
        <div className="anim-fade rounded-[var(--radius-card)] bg-canvas p-3">
          <PratoChart itens={itens} size={110} titulo="O que você comeu" />
          {comp && <ResumoComparacao comp={comp} />}
        </div>
      )}
      <Button variant="primary" icon="check" fullWidth disabled={!itens.length} loading={salvando} onClick={salvar}>
        {groqApiKey ? 'Salvar e analisar com a IA' : 'Salvar'}
      </Button>
    </div>
  );
}

function ResumoComparacao({ comp }: { comp: ReturnType<typeof compararComPlano> }) {
  const cor = comp.aderencia >= 80 ? 'var(--color-ok)' : comp.aderencia >= 50 ? 'var(--color-warn-ink)' : 'var(--color-danger-ink)';
  return (
    <div className="mt-3 text-[13px] leading-relaxed">
      <p className="font-semibold" style={{ color: cor }}>Bateu {comp.aderencia}% com o plano (por grupos alimentares)</p>
      {comp.faltaram.length > 0 && <p className="text-ink-body">Faltou: {comp.faltaram.map(g => grupoPrato[g].nome.toLowerCase()).join(', ')}.</p>}
      {comp.extras.length > 0 && <p className="text-ink-body">A mais: {comp.extras.map(g => grupoPrato[g].nome.toLowerCase()).join(', ')}.</p>}
    </div>
  );
}

function Diario({ onRegistrar }: { onRegistrar: () => void }) {
  const n = useNutricaoStore();
  const { groqApiKey, groqModel } = useSettingsStore();
  const [analisando, setAnalisando] = useState<string | null>(null);
  const hoje = hojeLocal();
  const deHoje = n.diario.filter(d => d.data === hoje).sort((a, b) => a.hora.localeCompare(b.hora));
  const anteriores = n.diario.filter(d => d.data < hoje).sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora)).slice(0, 10);
  const planejadasHoje = n.refeicoes.length;
  const registradasDoPlano = new Set(deHoje.map(d => d.refeicaoId).filter(Boolean)).size;

  const analisar = async (id: string) => {
    const reg = n.diario.find(d => d.id === id);
    if (!reg) return;
    const ref = n.refeicoes.find(r => r.id === reg.refeicaoId) ?? null;
    setAnalisando(id);
    try {
      const texto = await analisarRefeicaoIA(groqApiKey, groqModel, ref ? { nome: ref.nome, itens: ref.itens } : null, reg.itens, contextoUsuario());
      n.setAnalise(id, { texto, origem: 'ia' });
    } catch (e) {
      toast.error(e instanceof GroqError ? e.message : 'Não foi possível analisar agora.');
    } finally {
      setAnalisando(null);
    }
  };

  const Item = ({ d, i }: { d: (typeof n.diario)[number]; i: number }) => {
    const ref = n.refeicoes.find(r => r.id === d.refeicaoId);
    const comp = ref ? compararComPlano(ref.itens, d.itens) : null;
    return (
      <Card animate index={i} padding={16}>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold tabular text-brand w-11">{d.hora}</span>
          <h3 className="flex-1 text-[15px] font-semibold text-ink">{d.nome}</h3>
          <IconButton icon="trash" label="Remover registro" size={16} onClick={() => n.removerRegistro(d.id)} className="-mr-2" />
        </div>
        <div className="mt-2"><PratoChart itens={d.itens} size={104} titulo={d.nome} /></div>
        {comp && <ResumoComparacao comp={comp} />}
        {d.analise ? (
          <div className="mt-3 rounded-[var(--radius-btn)] bg-canvas p-3">
            <p className="text-[12px] text-ink-body flex items-center gap-1 mb-1"><Icon name="sparkle" size={13} color="var(--color-science)" />Análise da IA</p>
            <div className="text-[14px] text-ink-body leading-relaxed"><RichText text={d.analise.texto} /></div>
          </div>
        ) : groqApiKey ? (
          <Button variant="text" size="sm" icon="sparkle" className="mt-2 -ml-2" loading={analisando === d.id} onClick={() => analisar(d.id)}>Analisar com a IA</Button>
        ) : null}
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <Card animate padding={16} accent="var(--color-brand-ghost)">
        <p className="text-[15px] font-semibold text-ink">Hoje</p>
        <p className="text-[14px] text-ink-body">
          {deHoje.length ? `${deHoje.length} ${deHoje.length === 1 ? 'refeição registrada' : 'refeições registradas'}` : 'Nenhuma refeição registrada ainda'}
          {planejadasHoje > 0 && ` · ${registradasDoPlano} de ${planejadasHoje} do plano`}
        </p>
      </Card>
      <Button variant="primary" icon="plus" fullWidth onClick={onRegistrar}>Registrar o que comi</Button>
      {deHoje.map((d, i) => <Item key={d.id} d={d} i={i} />)}
      {anteriores.length > 0 && (
        <>
          <h3 className="text-[15px] font-semibold text-ink mt-2">Dias anteriores</h3>
          {anteriores.map(d => (
            <div key={d.id} className="flex items-center gap-3 min-h-[44px] text-[14px] border-b border-black/[0.06]">
              <span className="text-ink-body tabular w-[84px]">{d.data.slice(8, 10)}/{d.data.slice(5, 7)} {d.hora}</span>
              <span className="flex-1 text-ink truncate">{d.nome}: {d.itens.join(', ')}</span>
            </div>
          ))}
        </>
      )}
      <p className="text-[12px] text-ink-body text-center">A comparação é por grupos alimentares e é aproximada. Ajustes individuais com sua nutricionista.</p>
    </div>
  );
}

/* ---------------- Página ---------------- */

export function Nutricao() {
  const [aba, setAba] = useState<Aba>(() => (sessionStorage.getItem('folio_nutri_aba') as Aba) || 'plano');
  const [perguntaInicial, setPerguntaInicial] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<{ refeicao: Refeicao | null } | null>(null);
  const limparConversa = useNutricaoStore(s => s.limparConversa);
  const temMensagens = useNutricaoStore(s => s.mensagens.length > 0);
  useEffect(() => { try { sessionStorage.setItem('folio_nutri_aba', aba); } catch { /* ignore */ } }, [aba]);

  const perguntar = (texto: string) => { setPerguntaInicial(texto); setAba('conversa'); };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Nutrição" subtitle="Rotina alimentar e trocas inteligentes" className="!mb-0"
        right={aba === 'conversa' && temMensagens ? <IconButton icon="refresh" label="Nova conversa" onClick={() => { limparConversa(); toast.info('Nova conversa'); }} /> : undefined} />

      <div role="tablist" aria-label="Seções da nutrição" className="anim-fade grid grid-cols-4 p-1 rounded-[var(--radius-btn)] bg-black/[0.05] gap-1">
        {([['plano', 'Plano'], ['diario', 'Diário'], ['conversa', 'Conversa'], ['trocas', 'Trocas']] as const).map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={aba === k} onClick={() => setAba(k)}
            className={`pressable focus-ring min-h-[40px] rounded-[6px] text-[14px] font-medium transition-colors duration-200 ${aba === k ? 'bg-surface text-ink card-border' : 'text-ink-body'}`}>
            {t}
          </button>
        ))}
      </div>

      {aba === 'plano' && <Plano onPerguntar={perguntar} onRegistrar={r => setRegistrando({ refeicao: r })} />}
      {aba === 'diario' && <Diario onRegistrar={() => setRegistrando({ refeicao: null })} />}
      <RegistroSheet alvo={registrando} onClose={() => setRegistrando(null)} onSalvo={() => setAba('diario')} />
      {aba === 'conversa' && <Conversa perguntaInicial={perguntaInicial} onConsumida={() => setPerguntaInicial(null)} />}
      {aba === 'trocas' && <Trocas />}
    </div>
  );
}
