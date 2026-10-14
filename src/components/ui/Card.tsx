import type { ReactNode, HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: string;
  children: ReactNode;
};

export function Card({ accent, children, className = '', style, ...rest }: CardProps) {
  return (
    <div
      className={`card-border rounded-[var(--radius-card)] ${className}`}
      style={{
        background: accent ?? 'var(--color-surface)',
        padding: '24px',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
