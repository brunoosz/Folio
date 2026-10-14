import type { ReactNode } from 'react';

type AvatarMarkProps = {
  accentColor?: string;
  size?: number;
  children: ReactNode;
  className?: string;
};

export function AvatarMark({
  accentColor = 'var(--color-brand)',
  size = 44,
  children,
  className = '',
}: AvatarMarkProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        border: `2px solid ${accentColor}`,
        background: 'var(--color-surface)',
      }}
    >
      {children}
    </div>
  );
}
