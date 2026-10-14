export function LogoMark({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Folio"
    >
      {/* Stacked pages */}
      <rect x="30" y="12" width="72" height="96" rx="4" stroke="#62aef0" strokeWidth="2.5" fill="none" className="logo-page-blue" />
      <rect x="24" y="8" width="72" height="96" rx="4" stroke="#111111" strokeWidth="2.5" fill="none" className="logo-page-black" />
      <rect x="18" y="4" width="72" height="96" rx="4" fill="#ffffff" stroke="#111111" strokeWidth="2.5" className="logo-page-main" />

      {/* Spine vertebrae */}
      <circle cx="18" cy="20" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="32" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="44" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="56" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="68" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="80" r="3" fill="#0075de" className="logo-vert" />
      <circle cx="18" cy="92" r="3" fill="#0075de" className="logo-vert" />

      {/* F letterform */}
      <path
        d="M36 24h40v10H48v14h24v10H48v30H36V24z"
        fill="#111111"
        className="logo-f"
      />
    </svg>
  );
}

export function Wordmark({ className = '', size = 28 }: { className?: string; size?: number }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: '-0.02em',
        color: '#111111',
      }}
    >
      Folio
    </span>
  );
}
