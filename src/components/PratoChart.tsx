import { Icon } from './ui/Icon';
import { grupoPrato, montarPrato } from '../lib/alimentos';

/**
 * "Prato" da refeição: um círculo dividido por grupo alimentar, em cores claras,
 * com o ícone de cada grupo na fatia e a legenda escrita ao lado.
 */
export function PratoChart({ itens, size = 168, legenda = true, titulo }: { itens: string[]; size?: number; legenda?: boolean; titulo?: string }) {
  const fatias = montarPrato(itens);
  if (!fatias.length) return null;
  const r = 46, cx = 50, cy = 50, rInt = 17;
  let ang = -90;
  const arcos = fatias.map(f => {
    const ini = ang;
    const fim = ang + f.fracao * 360;
    ang = fim;
    const meio = (ini + fim) / 2;
    return { ...f, ini, fim, meio };
  });
  const pt = (a: number, raio: number) => [cx + raio * Math.cos((a * Math.PI) / 180), cy + raio * Math.sin((a * Math.PI) / 180)];
  const caminho = (ini: number, fim: number) => {
    if (fim - ini >= 359.99) {
      return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 M${cx - rInt},${cy} a${rInt},${rInt} 0 1,1 ${rInt * 2},0 a${rInt},${rInt} 0 1,1 ${-rInt * 2},0`;
    }
    const [x1, y1] = pt(ini, r), [x2, y2] = pt(fim, r), [x3, y3] = pt(fim, rInt), [x4, y4] = pt(ini, rInt);
    const grande = fim - ini > 180 ? 1 : 0;
    return `M${x1},${y1} A${r},${r} 0 ${grande} 1 ${x2},${y2} L${x3},${y3} A${rInt},${rInt} 0 ${grande} 0 ${x4},${y4} Z`;
  };
  const descricao = fatias.map(f => `${grupoPrato[f.grupo].nome}: ${f.itens.join(', ')}`).join('. ');

  return (
    <div className={`flex ${legenda ? 'items-center gap-4' : 'justify-center'}`}>
      <div className="relative shrink-0 anim-scale" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${titulo ? `${titulo}. ` : ''}${descricao}`}>
          {arcos.map((a, i) => (
            <path key={a.grupo} d={caminho(a.ini, a.fim)} fill={grupoPrato[a.grupo].cor} stroke="var(--color-surface)" strokeWidth={1.5}
              className="anim-fade" style={{ animationDelay: `${i * 70}ms` }} fillRule="evenodd" />
          ))}
        </svg>
        {/* Ícones no meio de cada fatia */}
        {arcos.map(a => {
          if (a.fracao < 0.08) return null;
          const [x, y] = pt(a.meio, (r + rInt) / 2);
          const s = Math.max(12, size * 0.11);
          return (
            <span key={a.grupo} className="absolute flex items-center justify-center pointer-events-none" aria-hidden
              style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2 }}>
              <Icon name={grupoPrato[a.grupo].icone} size={s} color={grupoPrato[a.grupo].tinta} strokeWidth={2} />
            </span>
          );
        })}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <Icon name="utensils" size={size * 0.13} color="var(--color-ink-body)" />
        </span>
      </div>
      {legenda && (
        <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
          {fatias.map(f => (
            <li key={f.grupo} className="flex items-start gap-2 text-[13px] leading-snug">
              <span className="w-3 h-3 rounded-full shrink-0 mt-[3px]" style={{ background: grupoPrato[f.grupo].cor }} aria-hidden />
              <span className="min-w-0">
                <span className="font-semibold text-ink">{grupoPrato[f.grupo].nome}</span>
                <span className="text-ink-body"> · {f.itens.join(', ')}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
