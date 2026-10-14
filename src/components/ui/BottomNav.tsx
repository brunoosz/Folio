import { NavLink } from 'react-router-dom';
import { HomeIcon, DumbbellIcon, BodyIcon } from './NavIcon';

const links = [
  { to: '/', label: 'Início', Icon: HomeIcon },
  { to: '/treino', label: 'Treino', Icon: DumbbellIcon },
  { to: '/mapa', label: 'Mapa', Icon: BodyIcon },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface card-border border-b-0 border-x-0 flex justify-around items-center h-[64px] pb-[env(safe-area-inset-bottom)]">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] justify-center"
        >
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? 'var(--color-brand)' : 'var(--color-ink-muted)' }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
