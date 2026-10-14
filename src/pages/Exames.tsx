import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { toast } from '../components/ui/Toast';
import { HeartPulse } from '../components/illustrations';
import { RichText } from './Assistente';
import { useExamesStore, novoId, type Exame, type ResultadoExame } from '../hooks/useExamesStore';
import { usePerfilStore } from '../hooks/usePerfilStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { analitos, acharAnalito, tipoExameLabels, type TipoExame } from '../data/exames';
import {
  interpretarLaudo, statusResultado, referencia, refParaTexto, valorParaTexto, contarStatus, exameParaTexto,
  valorAnterior, analiseOffline, fmtNum, parseNumeroBR, statusLabels, analitoPorId, type StatusResultado,
} from '../lib/exames';
import { analisarExameIA, estruturarExameIA, GroqError } from '../lib/groq';
import { contextoUsuario } from '../lib/contexto';
import { citacoesConhecimento } from '../lib/conhecimento';
import { hojeLocal, parseLocalISODate } from '../data/date';

const TIPOS: TipoExame[] = ['sangue', 'urina', 'fezes', 'imagem', 'outro'];
const tituloPadrao: Record<TipoExame, string> = {
  sangue: 'Exame de sangue', urina: 'Urina tipo 1', fezes: 'Exame de fezes', imagem: 'Exame de imagem', outro: 'Exame',
};

const corStatus: Record<StatusResultado, { fundo: string; tinta: string; icone: 'check' | 'arrow-down' | 'arrow-up' | 'warning' | 'minus' }> = {
  normal: { fundo: 'var(--color-tint-ok)', tinta: 'var(--color-ok)', icone: 'check' },
  abaixo: { fundo: 'var(--color-tint-warn)', tinta: 'var(--color-warn-ink)', icone: 'arrow-down' },
  acima: { fundo: 'var(--color-tint-danger)', tinta: 'var(--color-danger-ink)', icone: 'arrow-up' },
  alterado: { fundo: 'var(--color-tint-danger)', tinta: 'var(--color-danger-ink)', icone: 'warning' },
  sem_ref: { fundo: 'rgba(0,0,0,0.05)', tinta: 'var(--color-ink-body)', icone: 'minus' },
};

function dataBR(iso: string) {
  return parseLocalISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Aviso() {
  return (
    <p className="text-[12px] text-ink-body text-center leading-relaxed px-2">
      Leitura educativa. Faixas variam entre laboratórios — vale sempre a do seu laudo. Quem interpreta é o seu médico.
    </p>
  );
}

/* ---------------- Lista ---------------- */

export function Exames() {
  const navigate = useNavigate();
  const exames = useExamesStore(s => s.exames);
  const sexo = usePerfilStore(s => s.sexo);
  const [novo, setNovo] = useState(false);
  const ordenados = useMemo(() => [...exames].sort((a, b) => b.data.localeCompare(a.data)), [exames]);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader title="Exames" subtitle="Sangue, urina e outros, com leitura da IA" back backTo="/perfil" className="!mb-1" />
      <Button icon="plus" fullWidth onClick={() => setNovo(true)}>Adicionar exame</Button>
      {!ordenados.length ? (
        <EmptyState
          illustration={<HeartPulse size={64} />}
          title="Nenhum exame ainda"
          description="Cole o texto do laudo, importe o PDF ou digite os valores. O Folio marca o que está dentro ou fora da faixa."
        />
      ) : (
        ordenados.map((e, i) => {
          const c = contarStatus(e, sexo);
          return (
            <Card key={e.id} interactive animate index={i} padding={16} onClick={() => navigate(`/exames/${e.id}`)} aria-label={`${e.titulo}, ${dataBR(e.data)}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[var(--radius-btn)] flex items-center justify-center shrink-0" style={{ background: 'var(--color-tint-danger)' }}>
                  <Icon name={e.tipo === 'imagem' ? 'file' : 'flask'} size={22} color="var(--color-muscle)" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-ink truncate">{e.titulo}</span>
                  <span className="block text-[13px] text-ink-body truncate">
                    {dataBR(e.data)}{e.laboratorio ? ` · ${e.laboratorio}` : ''}
                  </span>
                  {e.resultados.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Pill color="var(--color-tint-ok)" textColor="var(--color-ok)">{c.normal} na faixa</Pill>
                      {c.fora > 0 && <Pill color="var(--color-tint-danger)" textColor="var(--color-danger-ink)">{c.fora} fora</Pill>}
                    </div>
                  )}
                </div>
                <Icon name="chevron-right" size={20} color="var(--color-ink-body)" />
              </div>
            </Card>
          );
        })
      )}
      <Aviso />
      <NovoExameSheet open={novo} onClose={() => setNovo(false)} onCriado={id => { setNovo(false); navigate(`/exames/${id}`); }} />
    </div>
  );
}

/* ---------------- Novo exame ---------------- */

function NovoExameSheet({ open, onClose, onCriado }: { open: boolean; onClose: () => void; onCriado: (id: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Novo exame">
      {open && <FormNovoExame onCriado={onCriado} />}
    </Sheet>
  );
}

function FormNovoExame({ onCriado }: { onCriado: (id: string) => void }) {
  const adicionar = useExamesStore(s => s.adicionar);
  const { groqApiKey, groqModel } = useSettingsStore();
  const [tipo, setTipo] = useState<TipoExame>('sangue');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(hojeLocal());
  const [lab, setLab] = useState('');
  const [texto, setTexto] = useState('');
  const [lendo, setLendo] = useState<string | null>(null);
  const [organizando, setOrganizando] = useState(false);
  const [resultadosIA, setResultadosIA] = useState<ResultadoExame[] | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  const reconhecidos = useMemo(() => (tipo === 'imagem' ? [] : interpretarLaudo(texto, tipo)), [texto, tipo]);
  const resultados = resultadosIA ?? reconhecidos;

  const importar = async (f: File) => {
    try {
      if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
        setLendo('Lendo PDF…');
        const { extrairTextoPdf } = await import('../lib/pdfTexto');
        const t = await extrairTextoPdf(f, (p, total) => setLendo(`Lendo página ${p} de ${total}…`), 30);
        setTexto(t.trim());
      } else {
        setTexto((await f.text()).trim());
      }
      setResultadosIA(null);
      if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, '').slice(0, 60));
    } catch {
      toast.error('Não foi possível ler este arquivo. Tente colar o texto.');
    } finally {
      setLendo(null);
    }
  };

  const organizar = async () => {
    setOrganizando(true);
    try {
      const lista = await estruturarExameIA(groqApiKey, groqModel, texto);
      setResultadosIA(lista.map(r => {
        const an = acharAnalito(r.nome, tipo);
        return { id: novoId('r'), ...r, analitoId: an?.id };
      }));
    } catch (e) {
      toast.error(e instanceof GroqError ? e.message : 'A IA não conseguiu organizar este laudo.');
    } finally {
      setOrganizando(false);
    }
  };

  const salvar = () => {
    const id = adicionar({
      data, tipo, laboratorio: lab.trim(), titulo: titulo.trim() || tituloPadrao[tipo],
      resultados, notas: tipo === 'imagem' || !resultados.length ? texto.trim().slice(0, 8000) : '',
    });
    toast.success(resultados.length ? `${resultados.length} resultados salvos` : 'Exame salvo');
    onCriado(id);
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <span className="block text-[14px] text-ink-body mb-2">Tipo</span>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map(t => (
            <Pill key={t} selected={tipo === t} onClick={() => { setTipo(t); setResultadosIA(null); }}>{tipoExameLabels[t]}</Pill>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Nome (opcional)</span>
        <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={tituloPadrao[tipo]} maxLength={60} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Data da coleta</span>
          <input className="input" type="date" value={data} max={hojeLocal()} onChange={e => setData(e.target.value || hojeLocal())} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Laboratório</span>
          <input className="input" value={lab} onChange={e => setLab(e.target.value)} placeholder="Opcional" maxLength={40} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">{tipo === 'imagem' ? 'Texto do laudo' : 'Cole o texto do laudo (uma linha por resultado)'}</span>
        <textarea
          className="input min-h-[140px] font-mono text-[13px]"
          value={texto}
          onChange={e => { setTexto(e.target.value); setResultadosIA(null); }}
          placeholder={tipo === 'imagem' ? 'Ex.: Ultrassonografia de abdome — conclusão…' : 'Hemoglobina 14,2 g/dL 13,5 a 17,5\nGlicose 92 mg/dL 70 a 99\nColesterol LDL 110 mg/dL < 130'}
        />
      </label>
      <div className="flex flex-wrap gap-2 -mt-1">
        <input ref={arquivo} type="file" accept=".pdf,.txt,.csv,application/pdf,text/plain" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = ''; }} />
        <Button variant="ghost" size="sm" icon="file" loading={!!lendo} onClick={() => arquivo.current?.click()}>
          {lendo ?? 'Importar PDF ou TXT'}
        </Button>
        {groqApiKey && texto.trim().length > 20 && tipo !== 'imagem' && (
          <Button variant="ghost" size="sm" icon="sparkle" loading={organizando} onClick={organizar}>Organizar com a IA</Button>
        )}
      </div>
      {tipo !== 'imagem' && texto.trim() && (
        <div className="rounded-[var(--radius-btn)] p-3 text-[13px]" style={{ background: resultados.length ? 'var(--color-tint-ok)' : 'var(--color-tint-warn)' }}>
          {resultados.length ? (
            <>
              <span className="font-semibold" style={{ color: 'var(--color-ok)' }}>
                {resultados.length} {resultados.length === 1 ? 'resultado reconhecido' : 'resultados reconhecidos'}{resultadosIA ? ' pela IA' : ''}
              </span>
              <span className="block text-ink-body mt-0.5 truncate">{resultados.slice(0, 6).map(r => r.nome).join(', ')}{resultados.length > 6 ? '…' : ''}</span>
            </>
          ) : (
            <span style={{ color: 'var(--color-warn-ink)' }}>
              Nenhum resultado reconhecido. Você pode salvar e digitar os valores depois{groqApiKey ? ', ou usar “Organizar com a IA”' : ''}.
            </span>
          )}
        </div>
      )}
      <Button fullWidth icon="check" onClick={salvar}>Salvar exame</Button>
    </div>
  );
}

/* ---------------- Detalhe ---------------- */

function FaixaBar({ r, min, max, status }: { r: ResultadoExame; min?: number; max?: number; status: StatusResultado }) {
  if (r.valor == null || (min == null && max == null)) return null;
  const v = r.valor;
  const lo = min ?? 0;
  const hi = max ?? Math.max(lo * 2, v * 1.2, 1);
  const span = hi - lo || 1;
  const d0 = Math.min(lo - span * 0.35, v - span * 0.1);
  const d1 = Math.max(hi + span * 0.35, v + span * 0.1);
  const pos = (x: number) => `${((x - d0) / (d1 - d0)) * 100}%`;
  return (
    <div className="relative h-2.5 mt-2 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} aria-hidden>
      <div className="absolute top-0 bottom-0 rounded-full" style={{ left: pos(lo), right: `calc(100% - ${pos(hi)})`, background: 'var(--color-tint-ok)', border: '1px solid var(--color-ok)' }} />
      <div className="absolute top-1/2 w-3.5 h-3.5 -mt-[7px] -ml-[7px] rounded-full border-2" style={{ left: pos(v), background: 'var(--color-surface)', borderColor: corStatus[status].tinta }} />
    </div>
  );
}

function LinhaResultado({ exame, r, todos, onEditar, index }: { exame: Exame; r: ResultadoExame; todos: Exame[]; onEditar: () => void; index: number }) {
  const sexo = usePerfilStore(s => s.sexo);
  const status = statusResultado(r, sexo);
  const ref = referencia(r, sexo);
  const ant = valorAnterior(todos, exame, r);
  const cor = corStatus[status];
  const an = analitoPorId(r.analitoId);
  return (
    <button type="button" onClick={onEditar} className="pressable-soft focus-ring text-left w-full px-4 py-3 anim-rise" style={{ ['--i' as string]: index }}
      aria-label={`${r.nome}: ${valorParaTexto(r)}, ${statusLabels[status]}. Editar`}>
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: cor.fundo }}>
          <Icon name={cor.icone} size={15} color={cor.tinta} strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[15px] font-semibold text-ink truncate">{r.nome}</span>
            <span className="text-[15px] font-semibold tabular shrink-0" style={{ color: status === 'normal' || status === 'sem_ref' ? 'var(--color-ink)' : cor.tinta }}>
              {valorParaTexto(r)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 text-[12.5px] text-ink-body">
            <span className="truncate">
              {ref.fonte ? `Ref.: ${refParaTexto(ref, r.valor != null ? r.unidade : '')}${ref.fonte === 'catalogo' ? ' (geral)' : ''}` : 'Sem referência'}
            </span>
            {ant && (
              <span className="shrink-0 tabular">
                antes {fmtNum(ant.valor)}
                {ant.valor !== r.valor && r.valor != null && (
                  <Icon name={r.valor > ant.valor ? 'arrow-up' : 'arrow-down'} size={12} className="inline ml-0.5 -mt-0.5" />
                )}
              </span>
            )}
          </div>
          <FaixaBar r={r} min={ref.min} max={ref.max} status={status} />
          {an && status !== 'normal' && status !== 'sem_ref' && <p className="text-[12.5px] text-ink-body mt-1.5 leading-snug">{an.sobre}</p>}
        </div>
      </div>
    </button>
  );
}

export function ExameDetalhe() {
  const { exameId } = useParams();
  const navigate = useNavigate();
  const todos = useExamesStore(s => s.exames);
  const exame = todos.find(e => e.id === exameId);
  const { atualizar, remover } = useExamesStore.getState();
  const sexo = usePerfilStore(s => s.sexo);
  const consentimento = usePerfilStore(s => s.consentimentoSaude);
  const setConsentimento = usePerfilStore(s => s.setConsentimento);
  const { groqApiKey, groqModel } = useSettingsStore();
  const [editando, setEditando] = useState<ResultadoExame | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [notas, setNotas] = useState(exame?.notas ?? '');

  const grupos = useMemo(() => {
    if (!exame) return [];
    const mapa = new Map<string, ResultadoExame[]>();
    for (const r of exame.resultados) {
      const g = analitoPorId(r.analitoId)?.grupo ?? 'Outros';
      mapa.set(g, [...(mapa.get(g) ?? []), r]);
    }
    return [...mapa.entries()];
  }, [exame]);

  if (!exame) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <PageHeader title="Exame" back backTo="/exames" />
        <EmptyState title="Exame não encontrado" description="Ele pode ter sido excluído." />
      </div>
    );
  }
  const c = contarStatus(exame, sexo);

  const analisar = async () => {
    if (!groqApiKey) {
      atualizar(exame.id, { analise: { texto: analiseOffline(exame, sexo), em: new Date().toISOString(), origem: 'offline' } });
      return;
    }
    if (!consentimento) { toast.error('Autorize o uso de dados de saúde para a análise da IA.'); return; }
    setAnalisando(true);
    try {
      const texto = exameParaTexto(exame, sexo);
      const cit = await citacoesConhecimento(`${exame.titulo} ${exame.resultados.map(r => r.nome).join(' ')}`, 3);
      const resposta = await analisarExameIA(groqApiKey, groqModel, texto, contextoUsuario(), cit);
      atualizar(exame.id, { analise: { texto: resposta, em: new Date().toISOString(), origem: 'ia' } });
    } catch (e) {
      toast.error(e instanceof GroqError ? e.message : 'Não foi possível analisar agora.');
      atualizar(exame.id, { analise: { texto: analiseOffline(exame, sexo), em: new Date().toISOString(), origem: 'offline' } });
    } finally {
      setAnalisando(false);
    }
  };

  let idx = 0;
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader
        title={exame.titulo}
        subtitle={`${tipoExameLabels[exame.tipo]} · ${dataBR(exame.data)}${exame.laboratorio ? ` · ${exame.laboratorio}` : ''}`}
        back backTo="/exames" className="!mb-1"
        right={<IconButton icon="trash" label="Excluir exame" onClick={() => setExcluir(true)} />}
      />

      {exame.resultados.length > 0 && (
        <div className="grid grid-cols-3 gap-2 anim-rise">
          {[
            { n: c.normal, l: 'na faixa', f: 'var(--color-tint-ok)', t: 'var(--color-ok)' },
            { n: c.fora, l: 'fora', f: c.fora ? 'var(--color-tint-danger)' : 'var(--color-surface)', t: c.fora ? 'var(--color-danger-ink)' : 'var(--color-ink-body)' },
            { n: c.sem_ref, l: 'sem ref.', f: 'var(--color-surface)', t: 'var(--color-ink-body)' },
          ].map(x => (
            <div key={x.l} className="card-border rounded-[var(--radius-card)] p-3 text-center" style={{ background: x.f }}>
              <span className="block text-[22px] font-bold tabular" style={{ color: x.t }}>{x.n}</span>
              <span className="block text-[12.5px] text-ink-body">{x.l}</span>
            </div>
          ))}
        </div>
      )}

      {/* Análise */}
      <Card animate index={idx++} padding={18} accent={exame.analise ? 'var(--color-brand-ghost)' : undefined}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="sparkle" size={18} color="var(--color-brand)" />
          <h3 className="text-[15px] font-semibold text-ink flex-1">Leitura do exame</h3>
          {exame.analise && <span className="text-[12px] text-ink-body">{exame.analise.origem === 'ia' ? 'IA' : 'offline'}</span>}
        </div>
        {exame.analise ? (
          <div className="text-[14px] text-ink leading-relaxed"><RichText text={exame.analise.texto} /></div>
        ) : (
          <p className="text-[14px] text-ink-body leading-relaxed mb-3">
            {groqApiKey ? 'A IA explica o que está fora da faixa, sem diagnosticar, e sugere perguntas para levar ao médico.' : 'Gere um resumo do que está fora da faixa. Com a IA configurada, a explicação fica mais completa.'}
          </p>
        )}
        {groqApiKey && !consentimento && (
          <div className="rounded-[var(--radius-btn)] p-3 mb-3 text-[13px] text-ink-body" style={{ background: 'var(--color-tint-warn)' }}>
            Para enviar os resultados à IA, autorize o uso dos seus dados de saúde.
            <Button variant="text" size="sm" className="!px-0 block" onClick={() => setConsentimento(true)}>Autorizar uso de dados de saúde</Button>
          </div>
        )}
        <Button fullWidth={!exame.analise} variant={exame.analise ? 'ghost' : 'primary'} size={exame.analise ? 'sm' : 'md'} icon="sparkle"
          loading={analisando} onClick={analisar} className={exame.analise ? 'mt-3' : ''}
          disabled={!exame.resultados.length && !exame.notas}>
          {exame.analise ? 'Analisar de novo' : groqApiKey ? 'Analisar com a IA' : 'Gerar resumo'}
        </Button>
      </Card>

      {/* Resultados */}
      {grupos.map(([grupo, lista]) => (
        <Card key={grupo} animate index={idx++} padding={0}>
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-body px-4 pt-3.5 pb-1">{grupo}</h3>
          <div className="divide-y divide-black/[0.06] pb-1">
            {lista.map((r, i) => <LinhaResultado key={r.id} exame={exame} r={r} todos={todos} index={i} onEditar={() => setEditando(r)} />)}
          </div>
        </Card>
      ))}

      <Button variant="ghost" icon="plus" onClick={() => setEditando({ id: novoId('r'), nome: '', valor: null, unidade: '' })}>Adicionar resultado</Button>

      {(exame.tipo === 'imagem' || exame.notas || !exame.resultados.length) && (
        <Card animate index={idx++} padding={18}>
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-semibold text-ink">Laudo e observações</span>
            <textarea className="input min-h-[110px]" value={notas} onChange={e => setNotas(e.target.value)}
              onBlur={() => notas !== exame.notas && atualizar(exame.id, { notas: notas.slice(0, 8000), analise: undefined })}
              placeholder="Conclusão do laudo, orientações do médico…" />
          </label>
        </Card>
      )}

      <Aviso />

      <ResultadoSheet exameId={exame.id} tipo={exame.tipo} alvo={editando} onClose={() => setEditando(null)} />
      <Sheet open={excluir} onClose={() => setExcluir(false)} title="Excluir exame?" variant="modal">
        <p className="text-[15px] text-ink-body leading-relaxed mb-5">Os resultados deste exame serão apagados deste aparelho.</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setExcluir(false)}>Cancelar</Button>
          <Button variant="danger" icon="trash" onClick={() => { remover(exame.id); navigate('/exames', { replace: true }); }}>Excluir</Button>
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- Editar resultado ---------------- */

function ResultadoSheet({ exameId, tipo, alvo, onClose }: { exameId: string; tipo: TipoExame; alvo: ResultadoExame | null; onClose: () => void }) {
  return (
    <Sheet open={!!alvo} onClose={onClose} title={alvo?.nome ? 'Editar resultado' : 'Novo resultado'}>
      {alvo && <FormResultado key={alvo.id} exameId={exameId} tipo={tipo} inicial={alvo} onClose={onClose} />}
    </Sheet>
  );
}

function FormResultado({ exameId, tipo, inicial, onClose }: { exameId: string; tipo: TipoExame; inicial: ResultadoExame; onClose: () => void }) {
  const { salvarResultado, removerResultado } = useExamesStore.getState();
  const existe = useExamesStore(s => s.exames.find(e => e.id === exameId)?.resultados.some(r => r.id === inicial.id));
  const [nome, setNome] = useState(inicial.nome);
  const [valor, setValor] = useState(inicial.valor != null ? fmtNum(inicial.valor).replace(/\./g, '') : inicial.valorTexto ?? '');
  const [unidade, setUnidade] = useState(inicial.unidade);
  const [refMin, setRefMin] = useState(inicial.refMin != null ? String(inicial.refMin).replace('.', ',') : '');
  const [refMax, setRefMax] = useState(inicial.refMax != null ? String(inicial.refMax).replace('.', ',') : '');
  const listaId = 'analitos-lista';

  const escolherNome = (n: string) => {
    setNome(n);
    const an = acharAnalito(n, tipo);
    if (an && !unidade) setUnidade(an.unidade);
  };

  const salvar = () => {
    const an = acharAnalito(nome, tipo);
    const num = /^\s*[\d.,]+\s*$/.test(valor) ? parseNumeroBR(valor.trim(), an) : null;
    const r: ResultadoExame = {
      id: inicial.id,
      nome: nome.trim().slice(0, 60),
      valor: num,
      valorTexto: num == null ? valor.trim().slice(0, 40) : undefined,
      unidade: unidade.trim().slice(0, 20),
      refMin: refMin.trim() ? parseNumeroBR(refMin.trim().replace(/\./g, ','), an) ?? undefined : undefined,
      refMax: refMax.trim() ? parseNumeroBR(refMax.trim().replace(/\./g, ','), an) ?? undefined : undefined,
      refTexto: num == null ? inicial.refTexto : undefined,
      analitoId: an?.id,
    };
    salvarResultado(exameId, r);
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Exame</span>
        <input className="input" list={listaId} value={nome} onChange={e => escolherNome(e.target.value)} placeholder="Ex.: Ferritina" maxLength={60} autoFocus={!inicial.nome} />
        <datalist id={listaId}>
          {analitos.filter(x => tipo === 'outro' || tipo === 'imagem' || x.tipo === tipo).map(x => <option key={x.id} value={x.nome} />)}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Resultado</span>
          <input className="input" value={valor} onChange={e => setValor(e.target.value)} placeholder="Ex.: 14,2 ou Negativo" inputMode="text" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Unidade</span>
          <input className="input" value={unidade} onChange={e => setUnidade(e.target.value)} placeholder="Ex.: g/dL" maxLength={20} />
        </label>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[14px] text-ink-body mb-1.5">Referência do laudo (opcional)</legend>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" value={refMin} onChange={e => setRefMin(e.target.value)} placeholder="Mínimo" inputMode="decimal" aria-label="Referência mínima" />
          <input className="input" value={refMax} onChange={e => setRefMax(e.target.value)} placeholder="Máximo" inputMode="decimal" aria-label="Referência máxima" />
        </div>
        <span className="text-[12.5px] text-ink-body">Sem referência, o Folio usa uma faixa geral para adultos quando conhece o exame.</span>
      </fieldset>
      <div className="flex gap-2">
        {existe && (
          <Button variant="danger" icon="trash" onClick={() => { removerResultado(exameId, inicial.id); onClose(); }}>Remover</Button>
        )}
        <Button className="flex-1" icon="check" disabled={!nome.trim() || !valor.trim()} onClick={salvar}>Salvar</Button>
      </div>
    </div>
  );
}
