import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { artigos } from '../data/ciencia';

export function Biblioteca() {
  const [filtro, setFiltro] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  const allTags = [...new Set(artigos.flatMap(a => a.tags))];

  const filtrados = filtro
    ? artigos.filter(a => a.tags.includes(filtro) || a.titulo.toLowerCase().includes(filtro.toLowerCase()))
    : artigos;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-[24px] font-bold tracking-tight-title">Biblioteca</h1>
      <p className="text-[13px] text-ink-muted -mt-2">
        Artigos científicos selecionados sobre treino e saúde.
      </p>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro('')}
          className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-pill)] cursor-pointer transition-colors ${
            !filtro ? 'bg-science text-white' : 'bg-brand-ghost text-ink-body'
          }`}
        >
          Todos
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => setFiltro(f => f === tag ? '' : tag)}
            className={`px-3 py-1 text-[12px] font-medium rounded-[var(--radius-pill)] cursor-pointer transition-colors ${
              filtro === tag ? 'bg-science text-white' : 'bg-brand-ghost text-ink-body'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtrados.map(art => (
          <Card key={art.id}>
            <button
              onClick={() => setExpandido(e => e === art.id ? null : art.id)}
              className="w-full text-left cursor-pointer"
            >
              <h3 className="text-[15px] font-semibold leading-snug">{art.titulo}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[12px] text-science font-medium">{art.ano}</span>
                <span className="text-[12px] text-ink-muted">{art.fonte}</span>
              </div>
            </button>

            {expandido === art.id && (
              <div className="mt-3 pt-3 border-t border-black/5">
                <p className="text-[14px] text-ink-body leading-relaxed" style={{ fontFamily: 'var(--font-serif)' }}>
                  {art.resumo}
                </p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {art.tags.map(tag => (
                    <Pill key={tag} color="var(--color-brand-ghost)">
                      <span className="text-[11px] text-science">{tag}</span>
                    </Pill>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-ink-muted text-center">
        {filtrados.length} artigo{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
