import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const links: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/treino', label: 'Treino', icon: 'dumbbell' },
  { to: '/rotina', label: 'Rotina', icon: 'clock' },
  { to: '/nutricao', label: 'Nutrição', icon: 'utensils' },
  { to: '/mapa', label: 'Mapa', icon: 'body' },
  { to: '/perfil', label: 'Perfil', icon: 'user' },
];

/** Rotas em que a barra inferior aparece (abas principais). */
export const NAV_ROUTES = links.map(l => l.to);

export function BottomNav() {
  const { pathname } = useLocation();
  const activeIndex = links.findIndex(l => (l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)));
  const pct = 100 / links.length;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface card-border border-b-0 border-x-0 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="relative mx-auto max-w-[560px] flex items-stretch h-[64px]">
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="nav-indicator"
            style={{ width: `calc(${pct}% - 32px)`, transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 32}px + 16px))` }}
          />
        )}
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="nav-item pressable flex-1 flex flex-col items-center gap-0.5 min-h-[44px] justify-center rounded-[var(--radius-btn)]"
          >
            {({ isActive }) => (
              <>
                <span className="nav-item-icon">
                  <Icon
                    name={icon}
                    strokeWidth={isActive ? 2.1 : 1.8}
                    color={isActive ? 'var(--color-brand)' : 'var(--color-ink-muted)'}
                  />
                </span>
                <span
                  className="text-[12px] font-medium transition-colors duration-200 whitespace-nowrap"
                  style={{ color: isActive ? 'var(--color-brand)' : 'var(--color-ink-subtle)' }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
