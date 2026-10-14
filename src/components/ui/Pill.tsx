import type { ReactNode } from 'react';

type PillProps = {
  color?: string;
  children: ReactNode;
  className?: string;
};

export function Pill({ color = 'var(--color-brand-ghost)', children, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[13px] font-medium rounded-[var(--radius-pill)] ${className}`}
      style={{ background: color, color: 'var(--color-ink)' }}
    >
      {children}
    </span>
  );
}
