import { memo, type KeyboardEvent } from 'react';

/*
 * Mapa muscular 2D (frente e costas) com sub-regiões.
 * Formas desenhadas na metade esquerda (x < 100) e espelhadas.
 * Os ids são os mesmos de `musculos` no catálogo (estáveis para o 3D).
 */

type Pt = [number, number];
export type Vista = 'frente' | 'costas';

/** Spline Catmull-Rom fechada → path SVG suave. */
function suave(pts: Pt[], fechado = true): string {
  const n = pts.length;
  if (n < 3) return '';
  const p = (i: number) => pts[(i + n) % n];
  let d = `M${p(0)[0]},${p(0)[1]}`;
  const lim = fechado ? n : n - 1;
  for (let i = 0; i < lim; i++) {
    const p0 = fechado ? p(i - 1) : pts[Math.max(0, i - 1)];
    const p1 = p(i), p2 = p(i + 1);
    const p3 = fechado ? p(i + 2) : pts[Math.min(n - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return fechado ? `${d}Z` : d;
}

const espelhar = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y] as Pt);

/* Contorno do corpo (metade esquerda, do pescoço até a virilha). */
const CONTORNO: Pt[] = [
  [92, 46], [90, 54], [82, 60], [68, 64], [54, 67], [42, 74], [35, 88], [33, 104], [31, 120], [30, 138], [31, 156],
  [26, 170], [23, 190], [24, 210], [27, 226], [23, 238], [24, 251], [30, 258], [36, 253], [38, 241], [39, 228],
  [43, 210], [47, 190], [51, 172], [54, 160], [57, 140], [58, 122], [60, 110], [63, 122], [66, 140], [68, 156],
  [70, 170], [67, 184], [62, 196], [56, 212], [54, 236], [56, 262], [61, 288], [65, 304], [64, 318], [59, 338],
  [61, 358], [68, 380], [72, 394], [67, 404], [69, 412], [86, 412], [88, 404], [88, 394], [91, 374], [94, 350],
  [93, 330], [90, 314], [92, 298], [96, 272], [98, 250], [99, 236],
];
const CORPO = suave([...CONTORNO, ...espelhar(CONTORNO).reverse()]);

type Forma = { id: string; pts: Pt[] };

const FRENTE: Forma[] = [
  { id: 'trapezio_superior', pts: [[90, 52], [84, 58], [72, 62], [62, 66], [70, 70], [82, 67], [91, 62]] },
  { id: 'deltoide_lateral', pts: [[49, 70], [41, 76], [37, 88], [38, 102], [43, 104], [47, 94], [47, 80], [53, 72]] },
  { id: 'deltoide_anterior', pts: [[60, 68], [52, 72], [48, 82], [49, 96], [55, 90], [60, 80], [63, 72]] },
  { id: 'peito_superior', pts: [[98, 70], [84, 70], [70, 72], [65, 78], [65, 86], [76, 84], [90, 82], [98, 82]] },
  { id: 'peito_medio', pts: [[65, 88], [64, 98], [70, 106], [84, 108], [98, 106], [98, 84], [88, 84], [76, 86]] },
  { id: 'peito_inferior', pts: [[70, 108], [76, 116], [88, 120], [98, 118], [98, 108], [84, 110]] },
  { id: 'biceps_cabeca_longa', pts: [[43, 106], [39, 118], [38, 132], [40, 146], [45, 150], [45, 134], [45, 118], [47, 108]] },
  { id: 'biceps_cabeca_curta', pts: [[48, 108], [47, 120], [47, 136], [48, 150], [52, 146], [53, 130], [53, 116], [52, 108]] },
  { id: 'braquial', pts: [[39, 142], [37, 150], [40, 160], [44, 158], [43, 150]] },
  { id: 'braquiorradial', pts: [[37, 161], [31, 172], [27, 190], [27, 204], [32, 204], [36, 186], [41, 168], [43, 161]] },
  { id: 'flexores_antebraco', pts: [[45, 162], [41, 178], [37, 196], [35, 212], [39, 214], [43, 196], [47, 178], [49, 164]] },
  { id: 'obliquos', pts: [[86, 124], [78, 128], [70, 142], [68, 160], [70, 176], [76, 190], [86, 200], [88, 180], [87, 160], [87, 140]] },
  { id: 'reto_abdominal_superior', pts: [[89, 125], [99, 125], [99, 162], [89, 162], [88, 144]] },
  { id: 'reto_abdominal_inferior', pts: [[89, 165], [99, 165], [99, 208], [95, 212], [90, 200], [88, 182]] },
  { id: 'gluteo_medio', pts: [[63, 190], [59, 200], [59, 210], [64, 206], [67, 196]] },
  { id: 'vasto_lateral', pts: [[61, 212], [57, 236], [58, 262], [63, 288], [69, 296], [71, 284], [68, 262], [68, 236], [71, 214]] },
  { id: 'reto_femoral', pts: [[77, 216], [73, 240], [73, 266], [76, 290], [82, 291], [85, 268], [85, 240], [83, 218]] },
  { id: 'vasto_medial', pts: [[86, 262], [90, 278], [90, 294], [84, 302], [78, 298], [82, 286], [84, 272]] },
  { id: 'adutores', pts: [[86, 220], [90, 232], [94, 246], [96, 256], [97, 238], [96, 224], [92, 218]] },
  { id: 'tibial_anterior', pts: [[65, 322], [63, 340], [65, 360], [70, 384], [74, 384], [73, 360], [71, 340], [71, 322]] },
  { id: 'gastrocnemio', pts: [[84, 322], [91, 336], [92, 352], [87, 368], [81, 362], [80, 344], [80, 326]] },
];

const COSTAS: Forma[] = [
  { id: 'trapezio_superior', pts: [[92, 50], [84, 58], [70, 64], [58, 70], [72, 74], [86, 70], [98, 68], [98, 52]] },
  { id: 'trapezio_medio', pts: [[72, 75], [78, 84], [88, 94], [98, 98], [98, 69], [86, 71]] },
  { id: 'trapezio_inferior', pts: [[92, 100], [94, 114], [97, 130], [98, 138], [98, 100]] },
  { id: 'deltoide_lateral', pts: [[49, 70], [41, 76], [37, 88], [38, 102], [41, 100], [43, 88], [47, 78]] },
  { id: 'deltoide_posterior', pts: [[56, 70], [47, 74], [42, 86], [42, 100], [49, 96], [56, 86], [60, 76]] },
  { id: 'manguito_rotador', pts: [[64, 80], [62, 92], [68, 103], [80, 107], [84, 98], [76, 88]] },
  { id: 'latissimo', pts: [[62, 108], [60, 128], [62, 150], [68, 170], [78, 186], [88, 190], [88, 160], [88, 140], [84, 124], [74, 114]] },
  { id: 'redondo_maior', pts: [[60, 100], [60, 108], [66, 114], [76, 113], [72, 106]] },
  { id: 'romboides', pts: [[80, 97], [82, 108], [88, 118], [93, 120], [93, 104], [88, 97]] },
  { id: 'eretores_espinha', pts: [[90, 140], [88, 160], [88, 184], [90, 200], [98, 202], [98, 140]] },
  { id: 'triceps_cabeca_lateral', pts: [[41, 104], [37, 118], [37, 134], [40, 148], [45, 146], [44, 130], [44, 116], [45, 106]] },
  { id: 'triceps_cabeca_longa', pts: [[46, 106], [45, 118], [45, 134], [47, 146], [53, 142], [54, 126], [53, 112], [52, 104]] },
  { id: 'triceps_cabeca_medial', pts: [[43, 147], [44, 156], [49, 160], [53, 152], [49, 148]] },
  { id: 'extensores_antebraco', pts: [[37, 161], [31, 174], [27, 192], [27, 208], [33, 210], [37, 192], [43, 174], [47, 162]] },
  { id: 'gluteo_medio', pts: [[62, 184], [58, 194], [60, 204], [74, 200], [88, 198], [96, 200], [96, 192], [84, 188], [72, 186]] },
  { id: 'gluteo_maximo', pts: [[62, 205], [60, 220], [64, 236], [76, 246], [90, 248], [98, 244], [98, 203], [88, 201], [76, 203]] },
  { id: 'biceps_femoral', pts: [[59, 250], [57, 270], [59, 292], [65, 306], [73, 304], [72, 284], [73, 264], [75, 252]] },
  { id: 'semitendinoso', pts: [[78, 252], [76, 268], [76, 288], [78, 304], [86, 302], [90, 284], [92, 266], [91, 252], [86, 250]] },
  { id: 'adutores', pts: [[93, 254], [94, 266], [96, 278], [97, 262], [97, 252]] },
  { id: 'gastrocnemio', pts: [[66, 320], [61, 336], [63, 354], [71, 368], [78, 362], [78, 344], [79, 326]] },
  { id: 'gastrocnemio', pts: [[81, 326], [81, 346], [81, 362], [87, 366], [93, 352], [92, 334], [86, 322]] },
  { id: 'soleo', pts: [[70, 368], [70, 380], [73, 392], [86, 392], [89, 378], [88, 368], [80, 372]] },
];

/** Ids que aparecem em cada vista (para a busca por toque). */
export const idsPorVista: Record<Vista, Set<string>> = {
  frente: new Set(FRENTE.map(f => f.id)),
  costas: new Set(COSTAS.map(f => f.id)),
};

const PATHS: Record<Vista, { id: string; d: string }[]> = {
  frente: FRENTE.flatMap(f => [{ id: f.id, d: suave(f.pts) }, { id: f.id, d: suave(espelhar(f.pts)) }]),
  costas: COSTAS.flatMap(f => [{ id: f.id, d: suave(f.pts) }, { id: f.id, d: suave(espelhar(f.pts)) }]),
};

/** Linhas de definição (decorativas). */
const DETALHES: Record<Vista, string[]> = {
  frente: [
    'M100,70 L100,212', // linha alba
    'M89,138 L99,138', 'M111,138 L101,138', 'M89,150 L99,150', 'M111,150 L101,150', 'M89,176 L99,176', 'M111,176 L101,176',
    'M97,186 Q100,189 103,186', // umbigo
    'M68,122 Q72,124 74,128', 'M67,130 Q71,132 73,136', 'M132,122 Q128,124 126,128', 'M133,130 Q129,132 127,136', // serrátil
  ],
  costas: ['M100,52 L100,246', 'M98,236 Q100,238 102,236'],
};

export type EstadoMusculo = 'selecionado' | 'grupo' | 'secundario' | 'normal';

type MuscleMapProps = {
  vista: Vista;
  estado: (id: string) => EstadoMusculo;
  nomeDe: (id: string) => string;
  onSelect: (id: string) => void;
  className?: string;
};

const FILL: Record<EstadoMusculo, string> = {
  selecionado: 'var(--color-muscle)',
  grupo: 'var(--color-map-group)',
  secundario: 'var(--color-muscle-secondary)',
  normal: 'var(--color-map-muscle)',
};

function MuscleMapBase({ vista, estado, nomeDe, onSelect, className = '' }: MuscleMapProps) {
  const onKey = (id: string) => (e: KeyboardEvent<SVGPathElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(id); }
  };
  const vistos = new Set<string>();
  return (
    <svg viewBox="0 0 200 430" className={`w-full h-auto ${className}`} role="group" aria-label={`Mapa muscular, vista ${vista === 'frente' ? 'frontal' : 'dorsal'}`}>
      <ellipse cx={100} cy={28} rx={15} ry={18} fill="var(--color-map-skin)" stroke="var(--color-ink)" strokeWidth={1.4} />
      {vista === 'costas' && <path d="M88,30 Q100,40 112,30" stroke="rgba(0,0,0,0.18)" fill="none" strokeWidth={1} />}
      <path d={CORPO} fill="var(--color-map-skin)" stroke="var(--color-ink)" strokeWidth={1.4} strokeLinejoin="round" />
      {PATHS[vista].map((p, i) => {
        const st = estado(p.id);
        // Só a primeira forma de cada músculo entra na ordem de tabulação.
        const focavel = !vistos.has(p.id);
        vistos.add(p.id);
        return (
          <path
            key={`${p.id}-${i}`}
            d={p.d}
            fill={FILL[st]}
            stroke={st === 'normal' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.35)'}
            strokeWidth={0.8}
            className="muscle-region cursor-pointer"
            role="button"
            tabIndex={focavel ? 0 : -1}
            aria-label={nomeDe(p.id)}
            aria-pressed={st === 'selecionado'}
            onClick={() => onSelect(p.id)}
            onKeyDown={onKey(p.id)}
          >
            <title>{nomeDe(p.id)}</title>
          </path>
        );
      })}
      {DETALHES[vista].map((d, i) => (
        <path key={i} d={d} stroke="rgba(0,0,0,0.22)" strokeWidth={0.8} fill="none" pointerEvents="none" />
      ))}
    </svg>
  );
}

export const MuscleMap = memo(MuscleMapBase);
