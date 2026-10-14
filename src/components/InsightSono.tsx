import { useNavigate } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { useAguaSonoStore, insightSono } from '../hooks/useAguaSonoStore';

const estilo = {
  bom: { fundo: 'var(--color-brand-ghost)', cor: 'var(--color-science)', icone: 'moon' as const },
  atencao: { fundo: 'var(--color-tint-warn)', cor: 'var(--color-warn-ink)', icone: 'moon' as const },
  alerta: { fundo: 'var(--color-tint-danger)', cor: 'var(--color-vermillion)', icone: 'warning' as const },
};

/** Cartão com a leitura do sono da última noite (some se não houver registro). */
export function InsightSono({ compacto = false, className = '' }: { compacto?: boolean; className?: string }) {
  const navigate = useNavigate();
  const sono = useAguaSonoStore(s => s.sono);
  const metaSonoH = useAguaSonoStore(s => s.metaSonoH);
  const insight = insightSono(sono, metaSonoH);
  if (!insight || (compacto && insight.nivel === 'bom')) return null;
  const e = estilo[insight.nivel];
  return (
    <button
      type="button"
      onClick={() => navigate('/rotina')}
      className={`anim-rise pressable-soft focus-ring w-full text-left rounded-[var(--radius-card)] card-border p-4 flex items-start gap-3 ${className}`}
      style={{ background: e.fundo }}
    >
      <Icon name={e.icone} size={22} color={e.cor} className="mt-0.5" />
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-ink">{insight.titulo}</span>
        <span className="block text-[14px] text-ink-body leading-relaxed mt-0.5">{insight.texto}</span>
      </span>
    </button>
  );
}
