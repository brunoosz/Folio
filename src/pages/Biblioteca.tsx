import { useMemo, useState, type CSSProperties } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Icon } from '../components/ui/Icon';
import { IconButton, Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { StretchingPerson } from '../components/illustrations';
import { artigos, type ArtigoCientifico } from '../data/ciencia';

/** Minúsculas e sem acentos, para busca tolerante. */
function norm(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function ArtigoCard({ art, aberto, onToggle, index }: { art: ArtigoCientifico; aberto: boolean; onToggle: () => void; index: number }) {
  const corpoId = `art-${art.id}`;
  return (
    <Card animate index={index} padding={0} className={`overflow-hidden transition-colors duration-200 ${aberto ? '!border-black/15' : ''}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        aria-controls={corpoId}
        className="w-full text-left px-5 py-4 min-h-[44px] flex items-start gap-3 cursor-pointer focus-ring rounded-[var(--radius-card)] pressable-soft"
      >
        <div className="w-9 h-9 rounded-[var(--radius-btn)] bg-brand-ghost flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="book" size={18} color="var(--color-science)" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-ink leading-snug">{art.titulo}</h3>
          <p className="text-[13px] text-ink-body mt-1">
            <span className="font-semibold text-science tabular">{art.ano}</span>
            <span aria-hidden> · </span>
            {art.fonte}
          </p>
        </div>
        <Icon
          name="chevron-down"
          size={20}
          color="var(--color-ink-body)"
          className="shrink-0 mt-1"
          style={{ transform: `rotate(${aberto ? 180 : 0}deg)`, transition: 'transform var(--dur) var(--ease-std)' }}
        />
      </button>

      {/* Expansão: grid-rows 0fr → 1fr anima a altura sem medir o conteúdo */}
      <div
        id={corpoId}
        role="region"
        aria-label={art.titulo}
        className="grid"
        style={{
          gridTemplateRows: aberto ? '1fr' : '0fr',
          opacity: aberto ? 1 : 0,
          transition: 'grid-template-rows var(--dur-enter) var(--ease-out), opacity var(--dur) var(--ease-std)',
          visibility: aberto ? 'visible' : 'hidden',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">
            <div className="border-t border-black/[0.06] pt-4">
              <p className="text-[16px] text-ink leading-[1.6]" style={{ fontFamily: 'var(--font-serif)' }}>
                {art.resumo}
              </p>
              <div className="flex gap-1.5 flex-wrap mt-4">
                {art.tags.map(tag => (
                  <Pill key={tag} textColor="var(--color-brand-ink)" className="!text-[12px]">{tag}</Pill>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-[12px] text-ink-body leading-snug flex items-start gap-1.5">
                  <Icon name="info" size={14} className="shrink-0 mt-[1px]" />
                  Resumo informativo, a revisar por profissional.
                </p>
                {art.url && (
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-2 text-[14px] font-medium text-brand hover:underline underline-offset-4 shrink-0 focus-ring rounded-[var(--radius-btn)]"
                  >
                    Ver fonte <Icon name="external-link" size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Biblioteca() {
  const [busca, setBusca] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  // Tags mais frequentes (presentes em 2+ artigos) viram filtros rápidos.
  const tagsFiltro = useMemo(() => {
    const freq = new Map<string, number>();
    artigos.forEach(a => a.tags.forEach(t => freq.set(t, (freq.get(t) ?? 0) + 1)));
    return [...freq.entries()]
      .filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
      .map(([t]) => t);
  }, []);

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    return artigos
      .filter(a => !tag || a.tags.includes(tag))
      .filter(a => !q || norm(`${a.titulo} ${a.resumo} ${a.fonte} ${a.tags.join(' ')}`).includes(q))
      .sort((a, b) => b.ano - a.ano);
  }, [busca, tag]);

  const limpar = () => { setBusca(''); setTag(null); };
  const chaveLista = `${tag ?? ''}|${busca.trim()}`;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <PageHeader title="Biblioteca" subtitle="Ciência sobre treino e saúde, em resumo" back className="!mb-0" />

      {/* Busca */}
      <div className="anim-rise relative" style={{ '--i': 1 } as CSSProperties}>
        <label htmlFor="busca-biblioteca" className="sr-only">Buscar artigos</label>
        <Icon name="search" size={20} color="var(--color-ink-body)" className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="busca-biblioteca"
          type="search"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por tema, título ou fonte"
          autoComplete="off"
          className="w-full min-h-[48px] pl-11 pr-12 rounded-[var(--radius-btn)] bg-surface card-border text-[15px] text-ink placeholder:text-ink-body/80 transition-colors duration-200 focus:border-brand/50"
        />
        {busca && (
          <div className="absolute right-0.5 top-1/2 -translate-y-1/2 anim-fade">
            <IconButton icon="x" label="Limpar busca" size={18} onClick={() => setBusca('')} />
          </div>
        )}
      </div>

      {/* Filtros por tag */}
      <div
        className="anim-rise -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
        style={{ '--i': 2 } as CSSProperties}
        role="group"
        aria-label="Filtrar por tema"
      >
        <Pill onClick={() => setTag(null)} selected={!tag} className="shrink-0">Todos</Pill>
        {tagsFiltro.map(t => (
          <Pill key={t} onClick={() => setTag(cur => (cur === t ? null : t))} selected={tag === t} className="shrink-0 capitalize">
            {t}
          </Pill>
        ))}
      </div>

      <p className="text-[13px] text-ink-body -mt-1 tabular" aria-live="polite">
        {filtrados.length} {filtrados.length === 1 ? 'artigo' : 'artigos'}
        {tag && <> em <span className="font-medium text-ink">{tag}</span></>}
      </p>

      {filtrados.length === 0 ? (
        <Card animate>
          <EmptyState
            compact
            illustration={<StretchingPerson size={64} color="var(--color-science)" />}
            title="Nenhum artigo encontrado"
            description="Tente outra palavra ou remova o filtro de tema."
            action={<Button variant="ghost" icon="refresh" onClick={limpar}>Limpar filtros</Button>}
          />
        </Card>
      ) : (
        <div key={chaveLista} className="flex flex-col gap-3">
          {filtrados.map((art, i) => (
            <ArtigoCard
              key={art.id}
              art={art}
              index={Math.min(i, 10)}
              aberto={expandido === art.id}
              onToggle={() => setExpandido(e => (e === art.id ? null : art.id))}
            />
          ))}
        </div>
      )}

      <p className="text-[12px] text-ink-body text-center leading-relaxed px-4 pt-2">
        Os resumos são informativos e não substituem a orientação de um profissional de saúde ou de Educação Física.
      </p>
    </div>
  );
}
