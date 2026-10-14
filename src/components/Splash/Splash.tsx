import { useEffect, useState } from 'react';
import { brand } from '../../brand/brand.config';

export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'animate' | 'fade-out' | 'done'>('animate');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade-out'), 2000);
    const t2 = setTimeout(() => {
      setPhase('done');
      onDone();
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (phase === 'done') return null;

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: brand.colors.canvas,
        opacity: phase === 'fade-out' ? 0 : 1,
        transition: 'opacity 200ms ease',
      }}
    >
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={brand.name}
      >
        <style>{`
          .sp-page-blue { stroke-dasharray: 340; stroke-dashoffset: ${reducedMotion ? 0 : 340}; animation: ${reducedMotion ? 'none' : 'draw 0.6s ease forwards'}; }
          .sp-page-black { stroke-dasharray: 340; stroke-dashoffset: ${reducedMotion ? 0 : 340}; animation: ${reducedMotion ? 'none' : 'draw 0.6s 0.1s ease forwards'}; }
          .sp-page-main { stroke-dasharray: 340; stroke-dashoffset: ${reducedMotion ? 0 : 340}; animation: ${reducedMotion ? 'none' : 'draw 0.6s 0.2s ease forwards'}; }
          .sp-f { opacity: ${reducedMotion ? 1 : 0}; animation: ${reducedMotion ? 'none' : 'fadeIn 0.4s 0.7s ease forwards'}; }
          ${[0,1,2,3,4,5,6].map(i =>
            `.sp-vert-${i} { opacity: ${reducedMotion ? 1 : 0}; animation: ${reducedMotion ? 'none' : `fadeIn 0.15s ${0.8 + i * 0.08}s ease forwards`}; }`
          ).join('\n')}
          @keyframes draw { to { stroke-dashoffset: 0; } }
          @keyframes fadeIn { to { opacity: 1; } }
        `}</style>

        <rect x="30" y="12" width="72" height="96" rx="4" stroke="#62aef0" strokeWidth="2.5" fill="none" className="sp-page-blue" />
        <rect x="24" y="8" width="72" height="96" rx="4" stroke="#111111" strokeWidth="2.5" fill="none" className="sp-page-black" />
        <rect x="18" y="4" width="72" height="96" rx="4" fill="#ffffff" stroke="#111111" strokeWidth="2.5" className="sp-page-main" />

        {[20,32,44,56,68,80,92].map((cy, i) => (
          <circle key={i} cx="18" cy={cy} r="3" fill="#0075de" className={`sp-vert-${i}`} />
        ))}

        <path d="M36 24h40v10H48v14h24v10H48v30H36V24z" fill="#111111" className="sp-f" />
      </svg>

      <div
        style={{
          opacity: reducedMotion ? 1 : 0,
          animation: reducedMotion ? 'none' : 'fadeIn 0.4s 1.5s ease forwards',
          marginTop: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: brand.fonts.ui,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: '-0.02em',
            color: brand.colors.ink,
          }}
        >
          {brand.name}
        </div>
        <div
          style={{
            fontFamily: brand.fonts.ui,
            fontSize: 14,
            color: brand.colors.inkBody,
            marginTop: 4,
          }}
        >
          {brand.slogan}
        </div>
      </div>
    </div>
  );
}
