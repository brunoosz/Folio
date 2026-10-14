export function HomeIcon({ active = false }: { active?: boolean }) {
  const c = active ? 'var(--color-brand)' : 'var(--color-ink-muted)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" /><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

export function DumbbellIcon({ active = false }: { active?: boolean }) {
  const c = active ? 'var(--color-brand)' : 'var(--color-ink-muted)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M6 7v10M18 7v10M8 9v6M16 9v6M8 12h8M4 9v6M20 9v6" />
    </svg>
  );
}

export function BodyIcon({ active = false }: { active?: boolean }) {
  const c = active ? 'var(--color-brand)' : 'var(--color-ink-muted)';
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" /><path d="M12 10v6M8 22l4-6 4 6M7 13h10" />
    </svg>
  );
}
