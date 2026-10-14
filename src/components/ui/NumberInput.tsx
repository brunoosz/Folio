import { useEffect, useRef, useState } from 'react';

/** Formata número com vírgula decimal (pt-BR). */
export function fmtNum(n: number | null | undefined, casas = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '';
  const r = Math.round(n * 10 ** casas) / 10 ** casas;
  return String(r).replace('.', ',');
}

type NumberInputProps = {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  decimal?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Unidade exibida dentro do campo (ex.: "kg"). */
  unit?: string;
  /** Esconde o rótulo visualmente (continua acessível). */
  hideLabel?: boolean;
  size?: 'md' | 'lg';
  className?: string;
  autoFocus?: boolean;
};

/** Campo numérico que aceita vírgula ou ponto e mantém o rascunho enquanto digita. */
export function NumberInput({
  id, label, value, onChange, decimal = false, min = 0, max = 99999, placeholder, disabled, unit,
  hideLabel = false, size = 'md', className = '', autoFocus,
}: NumberInputProps) {
  const [draft, setDraft] = useState(fmtNum(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(fmtNum(value));
  }, [value]);

  const handle = (raw: string) => {
    const limpo = decimal ? raw.replace(/[^\d.,]/g, '').replace(/\./g, ',') : raw.replace(/\D/g, '');
    const partes = limpo.split(',');
    const texto = decimal && partes.length > 1 ? `${partes[0]},${partes.slice(1).join('').slice(0, 2)}` : limpo;
    setDraft(texto);
    if (texto === '' || texto === ',') { onChange(null); return; }
    const n = Number(texto.replace(',', '.'));
    if (Number.isFinite(n)) onChange(Math.min(max, n));
  };

  const commit = () => {
    focused.current = false;
    if (value !== null && value < min) onChange(min);
    setDraft(fmtNum(value !== null && value < min ? min : value));
  };

  const h = size === 'lg' ? 'h-[56px] text-[22px] font-semibold' : 'h-[44px] text-[15px] font-medium';

  return (
    <div className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-[14px] text-ink-body'}>{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoComplete="off"
          enterKeyHint="done"
          value={draft}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onFocus={e => { focused.current = true; e.currentTarget.select(); }}
          onBlur={commit}
          onChange={e => handle(e.target.value)}
          className={`w-full ${h} text-center tabular bg-canvas rounded-[var(--radius-btn)] card-border transition-colors duration-200 focus:bg-surface disabled:opacity-60 ${unit ? 'pr-9 pl-3' : 'px-2'}`}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-body pointer-events-none">{unit}</span>
        )}
      </div>
    </div>
  );
}
