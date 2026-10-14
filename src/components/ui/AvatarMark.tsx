import type { ReactNode } from 'react';

type AvatarMarkProps = {
  accentColor?: string;
  size?: number;
  children?: ReactNode;
  /** Iniciais exibidas quando não há children. */
  initials?: string;
  className?: string;
  animate?: boolean;
};

export function AvatarMark({
  accentColor = 'var(--color-brand)',
  size = 44,
  children,
  initials,
  className = '',
  animate = false,
}: AvatarMarkProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${animate ? 'illo-spring' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        border: `2px solid ${accentColor}`,
        background: 'var(--color-surface)',
      }}
    >
      {children ?? (
        <span className="font-semibold text-ink" style={{ fontSize: Math.round(size * 0.36) }}>
          {initials}
        </span>
      )}
    </div>
  );
}
