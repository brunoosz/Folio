import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { brand } from '../../brand/brand.config';

const EXIT_AT = 1900; // ms — início da saída
const EXIT_MS = 360; // duração da saída

type SplashProps = {
  /** Chamado quando a saída começa (bom momento para montar o app por baixo). */
  onReveal?: () => void;
  /** Chamado quando a abertura terminou e pode ser desmontada. */
  onDone: () => void;
};

const F_PATH = 'M36 24h40v10H48v14h24v10H48v30H36V24z';
const VERTS = [20, 32, 44, 56, 68, 80, 92];

export function Splash({ onReveal, onDone }: SplashProps) {
  const reduced =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
      document.documentElement.classList.contains('reduce-motion'));
  const [exiting, setExiting] = useState(false);
  const finished = useRef(false);
  const exitStarted = useRef(false);
  const cbs = useRef({ onReveal, onDone });
  cbs.current = { onReveal, onDone };

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    cbs.current.onDone();
  }, []);

  const startExit = useCallback(() => {
    if (exitStarted.current) return;
    exitStarted.current = true;
    cbs.current.onReveal?.();
    setExiting(true);
  }, []);

  // Linha do tempo principal
  useEffect(() => {
    if (reduced) {
      cbs.current.onReveal?.();
      finish();
      return;
    }
    const t = window.setTimeout(startExit, EXIT_AT);
    return () => window.clearTimeout(t);
  }, [reduced, startExit, finish]);

  // Ao sair, desmonta após a animação
  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(finish, EXIT_MS + 40);
    return () => window.clearTimeout(t);
  }, [exiting, finish]);

  // Pular com teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') startExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startExit]);

  if (reduced) return null;

  return (
    <div
      className={`splash ${exiting ? 'is-exit' : ''}`}
      onClick={startExit}
      role="button"
      tabIndex={-1}
      aria-label={`${brand.name} — ${brand.slogan}. Toque para pular a abertura.`}
    >
      <div className="splash-stage flex flex-col items-center">
        <svg
          className="splash-logo"
          width="128"
          height="128"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <clipPath id="splash-f-clip">
              <path d={F_PATH} />
            </clipPath>
          </defs>

          <rect className="sp-stroke sp-p1" pathLength={1} x="30" y="12" width="72" height="96" rx="4" stroke={brand.colors.muscleSecondary} strokeWidth="2.5" />
          <rect className="sp-stroke sp-p2" pathLength={1} x="24" y="8" width="72" height="96" rx="4" stroke={brand.colors.ink} strokeWidth="2.5" />
          <rect className="sp-paper" x="18" y="4" width="72" height="96" rx="4" fill={brand.colors.surface} />
          <rect className="sp-stroke sp-p3" pathLength={1} x="18" y="4" width="72" height="96" rx="4" stroke={brand.colors.ink} strokeWidth="2.5" />

          {VERTS.map((cy, i) => (
            <circle
              key={cy}
              className="sp-vert"
              style={{ '--i': i } as CSSProperties}
              cx="18"
              cy={cy}
              r="3"
              fill={brand.colors.brand}
            />
          ))}

          <path className="sp-f-outline" pathLength={1} d={F_PATH} stroke={brand.colors.ink} strokeWidth="1.5" strokeLinejoin="round" />
          <g clipPath="url(#splash-f-clip)">
            <rect className="sp-f-mask" x="36" y="24" width="40" height="64" fill={brand.colors.ink} />
          </g>
        </svg>

        <div
          className="splash-word mt-5"
          style={{ fontFamily: brand.fonts.ui, fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', color: brand.colors.ink }}
        >
          {brand.name}
        </div>
        <div className="splash-slogan mt-1 text-[15px]" style={{ color: brand.colors.inkBody }}>
          {brand.slogan}
        </div>
      </div>

      <span className="splash-skip absolute bottom-[calc(28px+env(safe-area-inset-bottom))] text-[13px]" style={{ color: brand.colors.inkBody }}>
        Toque para pular
      </span>
    </div>
  );
}
