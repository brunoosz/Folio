import type { PontoCarga } from '../lib/progressao';

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/**
 * Carga estimada para 12 repetições: histórico real (linha cheia)
 * e projeção das próximas semanas (linha tracejada).
 */
export function ProgressaoChart({ reais, projecao }: { reais: PontoCarga[]; projecao: { semana: number; carga12: number }[] }) {
  const w = 320, h = 140, padX = 8, padY = 14;
  const valores = [...reais.map(r => r.carga12), ...projecao.map(p => p.carga12)];
  if (!valores.length) return null;
  const max = Math.max(...valores) * 1.08;
  const min = Math.min(...valores) * 0.85;
  const nReais = reais.length;
  const nProj = Math.max(0, projecao.length - 1);
  const total = Math.max(1, nReais - 1 + nProj);
  const x = (i: number) => padX + (i / total) * (w - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / Math.max(0.001, max - min)) * (h - padY * 2);

  const ptsReais = reais.map((r, i) => [x(i), y(r.carga12)] as const);
  const inicioProj = Math.max(0, nReais - 1);
  const ptsProj = projecao.map((p, i) => [x(inicioProj + i), y(p.carga12)] as const);
  const linha = (pts: readonly (readonly [number, number])[]) => pts.map(p => `${p[0]},${p[1]}`).join(' ');
  const ultimaProj = projecao[projecao.length - 1];
  const resumo = `Carga estimada para 12 repetições. ${nReais ? `Última registrada: ${nf.format(reais[nReais - 1].carga12)} kg.` : ''} ${
    ultimaProj ? `Projeção em ${ultimaProj.semana} semanas: ${nf.format(ultimaProj.carga12)} kg.` : ''}`;

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${w} ${h + 18}`} width="100%" role="img" aria-label={resumo} className="block overflow-visible">
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={0} x2={w} y1={padY + f * (h - padY * 2)} y2={padY + f * (h - padY * 2)} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
        ))}
        <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
        {ptsProj.length > 1 && (
          <polyline points={linha(ptsProj)} fill="none" stroke="var(--color-science)" strokeWidth={2} strokeDasharray="5 5"
            strokeLinecap="round" className="anim-fade" style={{ animationDelay: '500ms' }} />
        )}
        {ptsReais.length > 1 && (
          <polyline points={linha(ptsReais)} fill="none" stroke="var(--color-muscle)" strokeWidth={2.5} strokeLinejoin="round"
            strokeLinecap="round" pathLength={1} strokeDasharray={1}
            style={{ strokeDashoffset: 1, animation: 'f-draw 720ms var(--ease-out) 80ms both' }} />
        )}
        {ptsReais.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="var(--color-surface)" stroke="var(--color-muscle)" strokeWidth={2}
            className="anim-pop" style={{ animationDelay: `${200 + i * 40}ms` }} />
        ))}
        {ultimaProj && ptsProj.length > 1 && (
          <g className="anim-fade" style={{ animationDelay: '700ms' }}>
            <circle cx={ptsProj[ptsProj.length - 1][0]} cy={ptsProj[ptsProj.length - 1][1]} r={3.5} fill="var(--color-science)" />
            <text x={ptsProj[ptsProj.length - 1][0] - 4} y={ptsProj[ptsProj.length - 1][1] - 8} textAnchor="end" fontSize={11} fill="var(--color-science)" fontWeight={600}>
              {nf.format(ultimaProj.carga12)} kg
            </text>
          </g>
        )}
        {nReais > 1 && (
          <text x={ptsReais[0][0]} y={h + 14} fontSize={10} fill="var(--color-ink-body)">{ddmm(reais[0].data)}</text>
        )}
        {nReais > 0 && (
          <text x={x(inicioProj)} y={h + 14} fontSize={10} fill="var(--color-ink-body)" textAnchor={nReais > 1 ? 'middle' : 'start'}>hoje</text>
        )}
        {ultimaProj && <text x={w - padX} y={h + 14} fontSize={10} fill="var(--color-ink-body)" textAnchor="end">+{ultimaProj.semana} sem</text>}
      </svg>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-ink-body">
        <span className="inline-flex items-center gap-1.5"><span className="w-4 h-[3px] rounded bg-muscle" />Seu histórico</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-science" />Projeção estimada</span>
      </figcaption>
    </figure>
  );
}
