import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { AvatarMark } from './ui/AvatarMark';
import { Button, IconButton } from './ui/Button';
import { Icon } from './ui/Icon';
import { ProgressBar } from './ui/ProgressBar';
import { toast } from './ui/Toast';

interface Descanso { itemId: string; nome: string; total: number; fim: number }

interface DescansoState {
  atual: Descanso | null;
  iniciar: (itemId: string, nome: string, segundos: number) => void;
  alternar: (itemId: string, nome: string, segundos: number) => void;
  parar: () => void;
  mais15: () => void;
}

/** Cronômetro de descanso global: continua ao trocar entre a lista e a ficha do exercício. */
export const useDescansoStore = create<DescansoState>((set, get) => ({
  atual: null,
  iniciar: (itemId, nome, segundos) => set({ atual: { itemId, nome, total: segundos, fim: Date.now() + segundos * 1000 } }),
  alternar: (itemId, nome, segundos) => {
    if (get().atual?.itemId === itemId) set({ atual: null });
    else get().iniciar(itemId, nome, segundos);
  },
  parar: () => set({ atual: null }),
  mais15: () => set(s => (s.atual ? { atual: { ...s.atual, fim: s.atual.fim + 15000, total: s.atual.total + 15 } } : s)),
}));

export function fmtTempo(seg: number) {
  const s = Math.max(0, Math.ceil(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Montado uma vez no app: avisa quando o descanso acaba. */
export function DescansoWatcher() {
  const atual = useDescansoStore(s => s.atual);
  const parar = useDescansoStore(s => s.parar);
  useEffect(() => {
    if (!atual) return;
    const t = window.setTimeout(() => {
      parar();
      try { navigator.vibrate?.([180, 80, 180]); } catch { /* sem vibração */ }
      toast.info('Descanso concluído. Bora para a próxima série!');
    }, Math.max(0, atual.fim - Date.now()));
    return () => window.clearTimeout(t);
  }, [atual, parar]);
  return null;
}

export function DescansoBar() {
  const atual = useDescansoStore(s => s.atual);
  const parar = useDescansoStore(s => s.parar);
  const mais15 = useDescansoStore(s => s.mais15);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!atual) return;
    const t = window.setInterval(() => setAgora(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [atual]);

  if (!atual) return null;
  const restante = Math.max(0, (atual.fim - agora) / 1000);

  return (
    <div className="sticky top-[calc(8px+env(safe-area-inset-top))] z-20 anim-rise" role="timer" aria-live="off">
      <div className="card-border rounded-[var(--radius-card)] bg-surface p-3 flex items-center gap-3">
        <AvatarMark accentColor="var(--color-routine)" size={40}>
          <Icon name="timer" size={20} color="var(--color-ink)" />
        </AvatarMark>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-ink-body truncate">Descanso · {atual.nome}</p>
          <p className="text-[20px] font-bold tabular leading-tight">{fmtTempo(restante)}</p>
          <ProgressBar value={restante / atual.total} color="var(--color-routine)" height={4} className="mt-1" label="Tempo de descanso restante" />
        </div>
        <Button variant="text" size="sm" onClick={mais15} aria-label="Adicionar 15 segundos">+15s</Button>
        <IconButton icon="x" label="Parar descanso" onClick={parar} />
      </div>
    </div>
  );
}
