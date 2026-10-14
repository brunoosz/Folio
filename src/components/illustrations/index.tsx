const motionSafe = '@media (prefers-reduced-motion: no-preference)';

export function ExercisingPerson({ size = 44, color = 'var(--color-muscle)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="10" r="5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M24 17v12M18 22h12M16 40l8-11 8 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="14" y1="22" x2="10" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="34" y1="22" x2="38" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <style>{`${motionSafe} { svg:hover circle { animation: bob 0.6s ease infinite alternate; } } @keyframes bob { to { transform: translateY(-2px); } }`}</style>
    </svg>
  );
}

export function RestingPerson({ size = 44, color = 'var(--color-routine)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="20" cy="12" r="5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M14 40c0-6 3-10 6-12s8-2 8 2-2 6-2 10" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <text x="32" y="16" fontSize="14" fill={color}>z</text>
      <text x="36" y="10" fontSize="10" fill={color} opacity="0.6">z</text>
    </svg>
  );
}

export function StretchingPerson({ size = 44, color = 'var(--color-science)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="10" r="5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M24 17v10M20 40l4-13 4 13" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M16 20c4-2 8 6 16 0" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Sparkle({ size = 20, color = 'var(--color-routine)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2l1.5 5.5L17 10l-5.5 1.5L10 18l-1.5-6.5L3 10l6.5-2.5z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function Doodle({ size = 24, color = 'var(--color-ink-muted)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 18c4-8 8 4 16-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function ArrowDoodle({ size = 24, color = 'var(--color-ink-muted)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16c6-2 10-4 14-10M18 6l-2 6M18 6l-6 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Flower({ size = 22, color = 'var(--color-muscle)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.5" fill="none" />
      <ellipse cx="11" cy="5" rx="2.5" ry="3.5" stroke={color} strokeWidth="1" fill="none" />
      <ellipse cx="11" cy="17" rx="2.5" ry="3.5" stroke={color} strokeWidth="1" fill="none" />
      <ellipse cx="5" cy="11" rx="3.5" ry="2.5" stroke={color} strokeWidth="1" fill="none" />
      <ellipse cx="17" cy="11" rx="3.5" ry="2.5" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
}

export function HeartPulse({ size = 22, color = 'var(--color-muscle)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M11 19s-7-4.5-7-9.5C4 6 6 4 8.5 4c1.5 0 2.5 1 2.5 1s1-1 2.5-1C16 4 18 6 18 9.5S11 19 11 19z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <path d="M6 12h3l1.5-3 2 6 1.5-3h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
