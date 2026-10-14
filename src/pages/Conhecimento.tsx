import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Icon, type IconName } from '../components/ui/Icon';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Sheet } from '../components/ui/Sheet';
import { toast } from '../components/ui/Toast';
import { StretchingPerson } from '../components/illustrations';
import { useAuthStore } from '../hooks/useAuthStore';
import { useConhecimentoStore, tipoDocLabels, type DocConhecimento, type TipoDoc } from '../hooks/useConhecimentoStore';
import { salvarTrechos, removerTrechos, trechosDoDoc, buscarConhecimento, type Achado, type Trecho } from '../lib/conhecimento';

const TIPOS: TipoDoc[] = ['artigo', 'livro', 'apostila', 'video', 'site', 'nota'];
const iconeTipo: Record<TipoDoc, IconName> = { artigo: 'book', livro: 'book', apostila: 'file', video: 'video', site: 'link', nota: 'note' };
const LIMITE_CARACTERES = 3_000_000;

function fmtTamanho(n: number) {
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi caracteres` : n >= 1000 ? `${Math.round(n / 1000)} mil caracteres` : `${n} caracteres`;
}

function Interruptor({ ligado, onChange, label }: { ligado: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={label} onClick={() => onChange(!ligado)}
      className="focus-ring relative w-[52px] h-[44px] shrink-0 flex items-center justify-center cursor-pointer">
      <span className="block w-[44px] h-[26px] rounded-full transition-colors duration-200" style={{ background: ligado ? 'var(--color-brand)' : 'rgba(0,0,0,0.18)' }} />
      <span className="absolute top-1/2 -mt-[11px] w-[22px] h-[22px] rounded-full bg-white transition-transform duration-200"
        style={{ left: 6, transform: `translateX(${ligado ? 18 : 2}px)` }} />
    </button>
  );
}

export function Conhecimento() {
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const docs = useConhecimentoStore(s => s.docs);
  const { atualizar, remover } = useConhecimentoStore.getState();
  const [novo, setNovo] = useState(false);
  const [aberto, setAberto] = useState<DocConhecimento | null>(null);
  const [filtro, setFiltro] = useState<TipoDoc | null>(null);
  const totalTrechos = docs.reduce((s, d) => s + d.trechos, 0);
  const lista = useMemo(() => docs.filter(d => !filtro || d.tipo === filtro), [docs, filtro]);

  if (usuario?.role !== 'admin') {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <PageHeader title="Acesso restrito" back />
        <EmptyState title="Somente o dono do app" description="A base de conhecimento da IA é gerenciada pelo administrador."
          action={<Button variant="ghost" icon="home" onClick={() => navigate('/')}>Voltar ao início</Button>} />
      </div>
    );
  }

  const excluir = async (d: DocConhecimento) => {
    await removerTrechos(d.id).catch(() => undefined);
    remover(d.id);
    setAberto(null);
    toast.success('Material removido');
  };

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-3">
      <PageHeader title="Base de conhecimento" subtitle="Materiais que a IA consulta para responder" back className="!mb-1" />

      <Card animate index={0} accent="var(--color-brand-ghost)" padding={18}>
        <div className="flex gap-3">
          <Icon name="sparkle" size={22} color="var(--color-brand)" className="shrink-0 mt-0.5" />
          <div className="text-[14px] text-ink-body leading-relaxed">
            <p className="text-ink font-semibold mb-1">Como a IA usa seus materiais</p>
            Cada material é dividido em trechos e guardado neste aparelho. A cada pergunta, os trechos mais parecidos vão junto
            para a IA, que responde citando a fonte. É como dar à IA uma estante de consulta — o modelo em si não é re-treinado.
          </div>
        </div>
        {docs.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <Pill color="var(--color-surface)">{docs.length} {docs.length === 1 ? 'material' : 'materiais'}</Pill>
            <Pill color="var(--color-surface)">{totalTrechos} trechos</Pill>
            <Pill color="var(--color-surface)">{docs.filter(d => d.ativo).length} em uso</Pill>
          </div>
        )}
      </Card>

      <Button fullWidth icon="plus" onClick={() => setNovo(true)}>Adicionar material</Button>

      {docs.length > 0 && (
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar por tipo">
          <Pill onClick={() => setFiltro(null)} selected={!filtro} className="shrink-0">Todos</Pill>
          {TIPOS.filter(t => docs.some(d => d.tipo === t)).map(t => (
            <Pill key={t} onClick={() => setFiltro(f => (f === t ? null : t))} selected={filtro === t} className="shrink-0">{tipoDocLabels[t]}</Pill>
          ))}
        </div>
      )}

      {!docs.length ? (
        <EmptyState illustration={<StretchingPerson size={64} />} title="Nenhum material ainda"
          description="Adicione artigos científicos, livros e apostilas em PDF, transcrições de vídeos, sites e suas anotações." />
      ) : (
        lista.map((d, i) => (
          <Card key={d.id} animate index={i} padding={14}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAberto(d)} className="pressable-soft focus-ring flex-1 min-w-0 flex items-center gap-3 text-left rounded-[var(--radius-btn)] min-h-[48px]">
                <span className="w-10 h-10 rounded-[var(--radius-btn)] flex items-center justify-center shrink-0" style={{ background: d.ativo ? 'var(--color-brand-ghost)' : 'rgba(0,0,0,0.05)' }}>
                  <Icon name={iconeTipo[d.tipo]} size={20} color={d.ativo ? 'var(--color-science)' : 'var(--color-ink-body)'} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-[15px] font-semibold truncate ${d.ativo ? 'text-ink' : 'text-ink-body'}`}>{d.titulo}</span>
                  <span className="block text-[13px] text-ink-body truncate">
                    {tipoDocLabels[d.tipo]}{d.autor ? ` · ${d.autor}` : ''}{d.ano ? ` · ${d.ano}` : ''} · {d.trechos} trechos
                  </span>
                </span>
              </button>
              <Interruptor ligado={d.ativo} onChange={v => atualizar(d.id, { ativo: v })} label={`Usar ${d.titulo} nas respostas`} />
            </div>
          </Card>
        ))
      )}

      {docs.length > 0 && <TestarBusca />}

      <p className="text-[12px] text-ink-body text-center leading-relaxed px-2">
        Use apenas materiais que você tem direito de usar. Tudo fica neste aparelho; com o Supabase, a busca ganha embeddings e sincronização.
      </p>

      <Sheet open={novo} onClose={() => setNovo(false)} title="Adicionar material">
        {novo && <FormMaterial onPronto={() => setNovo(false)} />}
      </Sheet>
      <Sheet open={!!aberto} onClose={() => setAberto(null)} title={aberto?.titulo ?? ''}>
        {aberto && <DetalheMaterial doc={aberto} onExcluir={() => excluir(aberto)} />}
      </Sheet>
    </div>
  );
}

/* ---------------- Adicionar ---------------- */

function FormMaterial({ onPronto }: { onPronto: () => void }) {
  const adicionar = useConhecimentoStore(s => s.adicionar);
  const [tipo, setTipo] = useState<TipoDoc>('artigo');
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [ano, setAno] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [texto, setTexto] = useState('');
  const [lendo, setLendo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);

  const importar = async (f: File) => {
    try {
      let t: string;
      if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
        setLendo('Lendo PDF…');
        const { extrairTextoPdf } = await import('../lib/pdfTexto');
        t = await extrairTextoPdf(f, (p, total) => setLendo(`Página ${p} de ${total}…`));
      } else {
        t = await f.text();
        // Legendas .srt/.vtt: remove numeração e marcações de tempo.
        if (/\.(srt|vtt)$/i.test(f.name)) t = t.replace(/^WEBVTT.*$/m, '').replace(/^\d+\s*$/gm, '').replace(/^[\d:.,]+\s*-->\s*[\d:.,]+.*$/gm, '').replace(/\n{2,}/g, '\n');
      }
      if (!t.trim()) { toast.error('Não encontrei texto neste arquivo (PDF escaneado precisa de OCR).'); return; }
      setTexto(t.trim().slice(0, LIMITE_CARACTERES));
      if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 80));
    } catch {
      toast.error('Não foi possível ler este arquivo.');
    } finally {
      setLendo(null);
    }
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const id = `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      const conteudo = [url && tipo !== 'nota' ? `Fonte: ${url}` : '', texto.trim()].filter(Boolean).join('\n\n');
      const n = await salvarTrechos(id, conteudo);
      adicionar({
        id, tipo, titulo: titulo.trim(), autor: autor.trim(), ano: ano.trim(), url: url.trim(),
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10),
        trechos: n, caracteres: conteudo.length, ativo: true, criadoEm: new Date().toISOString(),
      });
      toast.success(`Material adicionado (${n} ${n === 1 ? "trecho" : "trechos"})`);
      onPronto();
    } catch {
      toast.error('Não foi possível salvar neste aparelho (armazenamento cheio ou bloqueado).');
    } finally {
      setSalvando(false);
    }
  };

  const dica: Record<TipoDoc, string> = {
    artigo: 'Importe o PDF do artigo ou cole o resumo e as conclusões.',
    livro: 'Importe o PDF (com texto selecionável) ou cole os capítulos que interessam.',
    apostila: 'Importe o PDF ou cole o conteúdo.',
    video: 'Cole a transcrição (no YouTube: “…” › Mostrar transcrição) ou importe a legenda .srt/.vtt. O app não baixa vídeos.',
    site: 'Cole o texto da página — o app não acessa sites sozinho.',
    nota: 'Escreva com suas palavras: protocolos, orientações, observações.',
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex flex-wrap gap-2">
        {TIPOS.map(t => <Pill key={t} selected={tipo === t} onClick={() => setTipo(t)}>{tipoDocLabels[t]}</Pill>)}
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Título</span>
        <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={120}
          placeholder={tipo === 'video' ? 'Ex.: Aula sobre hipertrofia' : 'Ex.: Resistance training for hypertrophy'} />
      </label>
      {tipo !== 'nota' && (
        <div className="grid grid-cols-[1fr_96px] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] text-ink-body">{tipo === 'video' ? 'Canal / autor' : 'Autor(es)'}</span>
            <input className="input" value={autor} onChange={e => setAutor(e.target.value)} maxLength={80} placeholder="Opcional" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[14px] text-ink-body">Ano</span>
            <input className="input tabular" value={ano} onChange={e => setAno(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="2024" />
          </label>
        </div>
      )}
      {tipo !== 'nota' && (
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] text-ink-body">Link (DOI, vídeo ou página)</span>
          <input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" maxLength={300} />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Conteúdo</span>
        <textarea className="input min-h-[150px]" value={texto} onChange={e => setTexto(e.target.value.slice(0, LIMITE_CARACTERES))} placeholder={dica[tipo]} />
        <span className="text-[12.5px] text-ink-body">{texto ? fmtTamanho(texto.length) : dica[tipo]}</span>
      </label>
      {tipo !== 'nota' && (
        <div>
          <input ref={arquivo} type="file" className="hidden" accept=".pdf,.txt,.md,.srt,.vtt,application/pdf,text/plain,text/markdown"
            onChange={e => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = ''; }} />
          <Button variant="ghost" size="sm" icon="upload" loading={!!lendo} onClick={() => arquivo.current?.click()}>
            {lendo ?? 'Importar arquivo (PDF, TXT, MD, SRT)'}
          </Button>
        </div>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] text-ink-body">Etiquetas (separadas por vírgula)</span>
        <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="hipertrofia, proteína, sono" maxLength={160} />
      </label>
      <Button fullWidth icon="check" loading={salvando} disabled={!titulo.trim() || texto.trim().length < 40 || !!lendo} onClick={salvar}>
        Salvar material
      </Button>
    </div>
  );
}

/* ---------------- Detalhe ---------------- */

function DetalheMaterial({ doc, onExcluir }: { doc: DocConhecimento; onExcluir: () => void }) {
  const [trechos, setTrechos] = useState<Trecho[] | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => { trechosDoDoc(doc.id).then(setTrechos).catch(() => setTrechos([])); }, [doc.id]);
  return (
    <div className="flex flex-col gap-3 pb-2">
      <p className="text-[14px] text-ink-body">
        {tipoDocLabels[doc.tipo]}{doc.autor ? ` · ${doc.autor}` : ''}{doc.ano ? ` · ${doc.ano}` : ''} · {fmtTamanho(doc.caracteres)} · {doc.trechos} trechos
      </p>
      {doc.url && (
        <a href={doc.url} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-1.5 text-[14px] text-brand font-medium min-h-[44px] break-all">
          <Icon name="external-link" size={16} className="shrink-0" /> {doc.url}
        </a>
      )}
      {doc.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{doc.tags.map(t => <Pill key={t}>{t}</Pill>)}</div>}
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-body mt-1">Prévia</h3>
      {trechos === null ? <div className="skeleton" style={{ height: 90 }} /> : (
        <div className="flex flex-col gap-2">
          {trechos.slice(0, 3).map(t => (
            <p key={t.id} className="text-[13.5px] text-ink leading-relaxed bg-canvas rounded-[var(--radius-btn)] p-3" style={{ fontFamily: 'var(--font-serif)' }}>
              {t.texto.slice(0, 380)}{t.texto.length > 380 ? '…' : ''}
            </p>
          ))}
          {trechos.length > 3 && <span className="text-[13px] text-ink-body">+ {trechos.length - 3} trechos</span>}
        </div>
      )}
      {confirmar ? (
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmar(false)}>Cancelar</Button>
          <Button variant="danger" className="flex-1" icon="trash" onClick={onExcluir}>Excluir de vez</Button>
        </div>
      ) : (
        <Button variant="danger" icon="trash" className="mt-2" onClick={() => setConfirmar(true)}>Excluir material</Button>
      )}
    </div>
  );
}

/* ---------------- Teste ---------------- */

function TestarBusca() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Achado[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const buscar = async () => {
    if (!q.trim()) return;
    setBuscando(true);
    try { setRes(await buscarConhecimento(q, 4)); } finally { setBuscando(false); }
  };
  return (
    <Card animate padding={18}>
      <h3 className="text-[15px] font-semibold text-ink mb-1">Testar o que a IA encontraria</h3>
      <p className="text-[13px] text-ink-body mb-3">Digite uma pergunta e veja os trechos que iriam junto com ela.</p>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); void buscar(); }}>
        <input className="input flex-1" value={q} onChange={e => setQ(e.target.value)} placeholder="Ex.: quantas séries por semana?" aria-label="Pergunta de teste" />
        <IconButton icon="search" label="Buscar" type="submit" disabled={buscando} className="!bg-brand-ghost !text-brand" />
      </form>
      {res && (
        <div className="flex flex-col gap-2 mt-3 anim-fade">
          {!res.length && <p className="text-[13px] text-ink-body">Nenhum trecho parecido. Tente outras palavras ou adicione materiais sobre o tema.</p>}
          {res.map((a, i) => (
            <div key={a.trecho.id} className="rounded-[var(--radius-btn)] bg-canvas p-3">
              <span className="block text-[12.5px] font-semibold text-science mb-1">[{i + 1}] {a.doc.titulo}</span>
              <p className="text-[13px] text-ink leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>{a.trecho.texto.slice(0, 280)}…</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
