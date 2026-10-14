import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconButton } from './Button';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** 'sheet' = desliza de baixo (padrão); 'modal' = centralizado com escala. */
  variant?: 'sheet' | 'modal';
  children: ReactNode;
};

/** Bottom sheet / modal com animação de entrada e saída, Esc para fechar. */
export function Sheet({ open, onClose, title, variant = 'sheet', children }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [leaving, setLeaving] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  // onClose costuma ser uma arrow inline: guardá-lo em ref evita refazer o efeito
  // (e roubar o foco para o painel) a cada re-render do pai.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (open) { setMounted(true); setLeaving(false); return; }
    if (!mounted) return;
    setLeaving(true);
    const t = window.setTimeout(() => { setMounted(false); setLeaving(false); }, 200);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, mounted]);

  if (!mounted) return null;
  const isSheet = variant === 'sheet';

  return (
    <div className={`fixed inset-0 z-50 flex ${isSheet ? 'items-end' : 'items-center px-4'} justify-center`}>
      <div
        className={`absolute inset-0 bg-black/30 ${leaving ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full bg-surface card-border outline-none max-h-[88dvh] overflow-y-auto ${
          isSheet
            ? `max-w-[560px] rounded-t-[16px] pb-[calc(24px+env(safe-area-inset-bottom))] ${leaving ? 'sheet-exit' : 'sheet-enter'}`
            : `max-w-[420px] rounded-[var(--radius-card)] pb-6 ${leaving ? 'modal-exit' : 'modal-enter'}`
        }`}
      >
        {isSheet && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-black/15" aria-hidden />}
        <div className="flex items-center gap-2 px-5 pt-3 pb-1 min-h-[52px]">
          <h2 className="flex-1 text-[17px] font-semibold text-ink">{title}</h2>
          <IconButton icon="x" label="Fechar" onClick={onClose} className="-mr-2" />
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  );
}
