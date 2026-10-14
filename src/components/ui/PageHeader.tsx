import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from './Button';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Mostra botão voltar (navigate(-1), ou para `backTo` se informado). */
  back?: boolean;
  backTo?: string;
  /** Ação à direita (ex.: <IconButton icon="settings" label="Configurações" />). */
  right?: ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, back = false, backTo, right, className = '' }: PageHeaderProps) {
  const navigate = useNavigate();
  const goBack = () => {
    if (backTo) navigate(backTo);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <header className={`anim-fade flex items-center gap-2 min-h-[56px] mb-4 ${back ? '-ml-2' : ''} ${className}`}>
      {back && <IconButton icon="chevron-left" label="Voltar" onClick={goBack} />}
      <div className="flex-1 min-w-0">
        <h1 className="text-[24px] font-bold text-ink tracking-tight-title leading-tight break-words">{title}</h1>
        {subtitle && <p className="text-[14px] text-ink-body mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
    </header>
  );
}
