import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  accent?: string;
  /** Feedback de toque (escala sutil) + cursor; use quando o cartão é clicável. */
  interactive?: boolean;
  /** Animação de entrada (sobe + aparece). */
  animate?: boolean;
  /** Índice para escalonar a entrada (45ms por item). */
  index?: number;
  /** Padding interno em px (padrão 24). */
  padding?: number;
  children?: ReactNode;
};

export function Card({
  accent,
  interactive = false,
  animate = false,
  index,
  padding = 24,
  children,
  className = '',
  style,
  onClick,
  onKeyDown,
  ...rest
}: CardProps) {
  const cls = [
    'card-border rounded-[var(--radius-card)]',
    interactive ? 'pressable-soft hover-lift cursor-pointer focus-ring' : '',
    animate ? 'anim-rise' : '',
    className,
  ].join(' ');

  return (
    <div
      className={cls}
      style={{
        background: accent ?? 'var(--color-surface)',
        padding,
        ...(index !== undefined ? ({ '--i': index } as CSSProperties) : null),
        ...style,
      }}
      onClick={onClick}
      role={interactive && onClick ? 'button' : rest.role}
      tabIndex={interactive && onClick ? 0 : rest.tabIndex}
      onKeyDown={
        interactive && onClick
          ? e => {
              onKeyDown?.(e);
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                (e.currentTarget as HTMLDivElement).click();
              }
            }
          : onKeyDown
      }
      {...rest}
    >
      {children}
    </div>
  );
}
