import { Icon, type IconName } from './Icon';

type P = { active?: boolean; size?: number };
const make = (name: IconName) =>
  function NavGlyph({ active = false, size = 24 }: P) {
    return (
      <Icon
        name={name}
        size={size}
        strokeWidth={active ? 2.1 : 1.8}
        color={active ? 'var(--color-brand)' : 'var(--color-ink-muted)'}
      />
    );
  };

export const HomeIcon = make('home');
export const DumbbellIcon = make('dumbbell');
export const BodyIcon = make('body');
export const RotinaIcon = make('clock');
export const PerfilIcon = make('user');
