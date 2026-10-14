import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'text';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
};

const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out min-h-[44px] px-5 py-2.5 rounded-[var(--radius-btn)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[15px]';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:brightness-110 active:brightness-95',
  ghost: 'bg-transparent text-brand border border-brand/20 hover:bg-brand-ghost active:bg-brand-ghost/80',
  text: 'bg-transparent text-brand hover:underline p-0 min-h-0',
};

export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
