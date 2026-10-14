import type { ReactNode, MouseEventHandler } from 'react';
import { Icon, type IconProps } from './Icon';

type PillProps = {
  color?: string;
  textColor?: string;
  icon?: IconProps['name'];
  /** Quando definido, a pílula vira um botão (ex.: filtro). */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  selected?: boolean;
  children: ReactNode;
  className?: string;
};

export function Pill({ color, textColor, icon, onClick, selected, children, className = '' }: PillProps) {
  const bg = color ?? (selected ? 'var(--color-brand)' : 'var(--color-brand-ghost)');
  const fg = textColor ?? (selected && !color ? '#ffffff' : 'var(--color-ink)');
  const cls = `inline-flex items-center gap-1.5 px-3 py-1 text-[13px] font-medium rounded-[var(--radius-pill)] transition-colors duration-200 ${className}`;
  const content = (
    <>
      {icon && <Icon name={icon} size={14} strokeWidth={2} />}
      {children}
    </>
  );
  if (onClick) {
    // Filtro: sem cor própria, o selecionado usa fundo fantasma + borda da marca
    // (o azul preenchido fica reservado ao botão principal da tela).
    const chipBg = color ?? (selected ? 'var(--color-brand-ghost)' : 'var(--color-surface)');
    const chipFg = textColor ?? (color ? 'var(--color-ink)' : selected ? 'var(--color-brand)' : 'var(--color-ink-body)');
    const chipBorder = color ? 'transparent' : selected ? 'var(--color-brand)' : 'rgba(0,0,0,0.08)';
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${cls} border pressable focus-ring min-h-[36px] cursor-pointer relative after:absolute after:-inset-1 after:content-['']`}
        style={{ background: chipBg, color: chipFg, borderColor: chipBorder }}
      >
        {content}
      </button>
    );
  }
  return (
    <span className={cls} style={{ background: bg, color: fg }}>
      {content}
    </span>
  );
}
