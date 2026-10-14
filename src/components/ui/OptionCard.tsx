import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconProps } from './Icon';

type OptionCardProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: IconProps['name'];
  /** Cor de acento do ícone. */
  color?: string;
  /** multi = caixa de seleção; single = botão de opção. */
  kind?: 'single' | 'multi';
  index?: number;
  children?: ReactNode;
};

/** Opção grande e tocável para escolhas (pesquisa, filtros, configurações). */
export function OptionCard({
  selected, onClick, title, description, icon, color = 'var(--color-brand)', kind = 'single', index, children,
}: OptionCardProps) {
  return (
    <button
      type="button"
      role={kind === 'multi' ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onClick}
      className={`anim-rise pressable-soft focus-ring w-full text-left min-h-[56px] px-4 py-3 rounded-[var(--radius-card)] border flex items-center gap-3 cursor-pointer transition-colors duration-200 ${
        selected ? 'bg-brand-ghost border-brand' : 'bg-surface border-black/[0.08] hover:border-black/20'
      }`}
      style={index !== undefined ? ({ '--i': index } as CSSProperties) : undefined}
    >
      {icon && (
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2"
          style={{ borderColor: color, background: 'var(--color-surface)' }}
        >
          <Icon name={icon} size={20} color={color} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold text-ink leading-snug">{title}</span>
        {description && <span className="block text-[13px] text-ink-body mt-0.5 leading-snug">{description}</span>}
        {children}
      </span>
      <span
        className={`w-6 h-6 shrink-0 flex items-center justify-center border-2 transition-colors duration-200 ${
          kind === 'multi' ? 'rounded-[6px]' : 'rounded-full'
        } ${selected ? 'bg-brand border-brand' : 'border-black/25 bg-surface'}`}
        aria-hidden
      >
        {selected && <span key="ok" className="anim-pop flex"><Icon name="check" size={14} color="#ffffff" strokeWidth={3} /></span>}
      </span>
    </button>
  );
}
