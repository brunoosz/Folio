import type { ReactNode } from 'react';

type EmptyStateProps = {
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ illustration, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {illustration && <div className="mb-4">{illustration}</div>}
      <h3 className="text-[17px] font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-[14px] text-ink-body max-w-[280px]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
