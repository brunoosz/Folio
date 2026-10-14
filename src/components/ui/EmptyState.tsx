import type { ReactNode } from 'react';

type EmptyStateProps = {
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ illustration, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`stagger flex flex-col items-center justify-center ${compact ? 'py-8' : 'py-16'} px-6 text-center`}>
      {illustration && <div className="mb-4 illo-float">{illustration}</div>}
      <h3 className="text-[17px] font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-[14px] text-ink-body max-w-[300px] leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
