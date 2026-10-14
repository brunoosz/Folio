import { useId } from 'react';

/** Interruptor com rótulo (role=switch, alvo de 44px). */
export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 min-h-[44px]">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[15px] text-ink font-medium cursor-pointer">{label}</label>
        {description && <p className="text-[13px] text-ink-body mt-0.5 leading-snug">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="focus-ring pressable relative shrink-0 w-[52px] h-[44px] flex items-center cursor-pointer"
      >
        <span
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[30px] rounded-[var(--radius-pill)] transition-std"
          style={{ background: checked ? 'var(--color-brand)' : 'var(--color-hairline-strong)' }}
        />
        <span
          className="absolute top-1/2 left-[3px] w-[24px] h-[24px] -mt-[12px] rounded-full bg-white transition-std"
          style={{ transform: `translateX(${checked ? 22 : 0}px)` }}
        />
      </button>
    </div>
  );
}
