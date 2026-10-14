import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconProps } from './Icon';

type Variant = 'primary' | 'ghost' | 'text' | 'danger';
type Size = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: IconProps['name'];
  iconRight?: IconProps['name'];
  children?: ReactNode;
};

const base =
  'pressable focus-ring inline-flex items-center justify-center gap-2 font-medium min-h-[44px] rounded-[var(--radius-btn)] cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed';

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-[15px]',
  sm: 'px-3.5 py-2 text-[14px]',
};

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-[#0068c5] active:bg-[#005fb3]',
  ghost: 'bg-transparent text-brand border border-brand/25 hover:bg-brand-ghost active:bg-brand-ghost',
  text: 'bg-transparent text-brand hover:underline underline-offset-4 px-2',
  danger: 'bg-transparent text-vermillion border border-vermillion/30 hover:bg-[#fdecea] active:bg-[#fdecea]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 18 : 20;
  return (
    <button
      type={type}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="spin" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

/** Botão só com ícone (44×44), sempre com rótulo acessível. */
export function IconButton({
  icon,
  label,
  size = 22,
  className = '',
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconProps['name']; label: string; size?: number }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`pressable focus-ring inline-flex items-center justify-center w-[44px] h-[44px] rounded-full text-ink hover:bg-black/[0.05] active:bg-black/[0.08] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
