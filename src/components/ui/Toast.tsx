import { create } from 'zustand';
import { useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; message: string; leaving: boolean };

type ToastState = {
  items: ToastItem[];
  push: (message: string, kind?: ToastKind, durationMs?: number) => void;
  dismiss: (id: number) => void;
  clear: () => void;
};

let seq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  push(message, kind = 'success', durationMs = 2800) {
    const id = ++seq;
    set(s => ({ items: [...s.items.slice(-2), { id, kind, message, leaving: false }] }));
    window.setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss(id) {
    set(s => ({ items: s.items.map(t => (t.id === id ? { ...t, leaving: true } : t)) }));
    window.setTimeout(() => set(s => ({ items: s.items.filter(t => t.id !== id) })), 200);
  },
  clear() {
    get().items.forEach(t => get().dismiss(t.id));
  },
}));

/** Atalho global: toast.success('Salvo'), toast.error('Falhou'), toast.info('...'). */
export const toast = {
  success: (m: string, ms?: number) => useToastStore.getState().push(m, 'success', ms),
  error: (m: string, ms?: number) => useToastStore.getState().push(m, 'error', ms ?? 4000),
  info: (m: string, ms?: number) => useToastStore.getState().push(m, 'info', ms),
  clear: () => useToastStore.getState().clear(),
};

const meta: Record<ToastKind, { icon: IconName; color: string }> = {
  success: { icon: 'check', color: '#1a7f37' },
  error: { icon: 'warning', color: 'var(--color-vermillion)' },
  info: { icon: 'info', color: 'var(--color-brand)' },
};

export function Toaster() {
  const items = useToastStore(s => s.items);
  const dismiss = useToastStore(s => s.dismiss);
  // No Assistente a barra de pergunta fica fixa acima da navegação: o toast sobe junto.
  const { pathname } = useLocation();
  const offset = pathname === '/assistente' ? 196 : 80;
  return (
    <div
      aria-live="polite"
      className="fixed left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none"
      style={{ bottom: `calc(${offset}px + env(safe-area-inset-bottom))` }}
    >
      {items.map(t => (
        <button
          key={t.id}
          type="button"
          role={t.kind === 'error' ? 'alert' : 'status'}
          onClick={() => dismiss(t.id)}
          className={`${t.leaving ? 'toast-exit' : 'toast-enter'} pointer-events-auto w-full max-w-[420px] min-h-[48px] flex items-center gap-3 px-4 py-3 bg-surface card-border rounded-[var(--radius-card)] text-left cursor-pointer`}
        >
          <Icon name={meta[t.kind].icon} size={20} color={meta[t.kind].color} strokeWidth={2.2} />
          <span className="flex-1 text-[14px] text-ink font-medium">{t.message}</span>
          <Icon name="x" size={16} color="var(--color-ink-muted)" label="Fechar" />
        </button>
      ))}
    </div>
  );
}
