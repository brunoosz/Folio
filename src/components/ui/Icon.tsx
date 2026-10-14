import type { CSSProperties, ReactNode } from 'react';

/** Conjunto de ícones de traço único, grade 24px. */
const paths = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5a.5.5 0 0 0 .5.5H10v-5.5h4V20h4a.5.5 0 0 0 .5-.5V10" /></>,
  dumbbell: <><path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" /></>,
  body: <><circle cx="12" cy="4.5" r="2.5" /><path d="M6 9h12M12 9v5.5M12 14.5 8.5 21M12 14.5l3.5 6.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2.5" /></>,
  rotina: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.8-3.7 3.9-5.5 7.5-5.5s6.7 1.8 7.5 5.5" /></>,
  chat: <><path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20.5l1.4-4.6A7.5 7.5 0 1 1 20 12.5Z" /></>,
  book: <><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2 2 4-4" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v4.5H8" /><path d="M12 8v4l2.5 2" /></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
  'chevron-left': <path d="m15 5-7 7 7 7" />,
  'chevron-right': <path d="m9 5 7 7-7 7" />,
  'chevron-down': <path d="m5 9 7 7 7-7" />,
  'chevron-up': <path d="m5 15 7-7 7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  filter: <path d="M4 5h16l-6 7.5V19l-4 1.5v-8Z" />,
  swap: <><path d="M7 4 3.5 7.5 7 11" /><path d="M3.5 7.5H17" /><path d="m17 13 3.5 3.5L17 20" /><path d="M20.5 16.5H7" /></>,
  'drag-handle': <><circle cx="9" cy="6" r=".8" /><circle cx="15" cy="6" r=".8" /><circle cx="9" cy="12" r=".8" /><circle cx="15" cy="12" r=".8" /><circle cx="9" cy="18" r=".8" /><circle cx="15" cy="18" r=".8" /></>,
  play: <path d="M7 4.5v15l12-7.5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  flag: <><path d="M5 21V4" /><path d="M5 4.5h11l-2 4 2 4H5" /></>,
  trash: <><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6 6.5l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 10.5v6M14 10.5v6" /></>,
  edit: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14 8 3 3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>,
  warning: <><path d="M10.3 4.2 2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4M12 17v.01" /></>,
  sparkle: <><path d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" /><path d="M19 16.5c.2 1.3.9 2 2 2.2-1.1.2-1.8.9-2 2.3-.2-1.4-.9-2.1-2-2.3 1.1-.2 1.8-.9 2-2.2Z" /></>,
  droplet: <path d="M12 3.5s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10.5 12 3.5 12 3.5Z" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  pill: <><rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)" /><path d="m8.8 8.8 6.4 6.4" /></>,
  cup: <><path d="M6 8h12l-1.3 11.6a1.5 1.5 0 0 1-1.5 1.4H8.8a1.5 1.5 0 0 1-1.5-1.4Z" /><path d="M5 8h14M12 8l1.5-5H16" /></>,
  utensils: <><path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10" /><path d="M17 21V3c-2 1-3.5 3.5-3.5 7v3H17" /></>,
  stretch: <><circle cx="12" cy="4.5" r="2" /><path d="M4 8.5c3 1.2 5.5 1.5 8 1.5s5-.3 8-1.5M12 10v4.5M12 14.5l-5 6M12 14.5l5 6" /></>,
  flame: <path d="M12 21c3.9 0 7-2.7 7-6.5 0-4.8-4.3-6.4-5-11-2 1.7-3.4 4-3.5 6.5-.9-.6-1.6-1.6-2-2.5C6.3 9.2 5 11.6 5 14.5 5 18.3 8.1 21 12 21Z" />,
  trophy: <><path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z" /><path d="M7.5 6H4.5v1.5A3 3 0 0 0 7.6 10.5M16.5 6h3v1.5a3 3 0 0 1-3.1 3" /><path d="M12 13.5V17M8.5 20.5h7M9.5 20.5c0-2 1-3.5 2.5-3.5s2.5 1.5 2.5 3.5" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  send: <><path d="M21 3 10.5 13.5" /><path d="M21 3 14.5 21l-4-7.5L3 9.5Z" /></>,
  key: <><circle cx="7.5" cy="15.5" r="4" /><path d="m10.5 12.5 9-9M16.5 6.5l2.5 2.5M14 9l2 2" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M10.6 6.1A9 9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.4 3.2M6.6 7.1C4 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.6-.6 5-1.5" /><path d="M9.9 10a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>,
  logout: <><path d="M14.5 4.5H18a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3.5" /><path d="M10 8 6 12l4 4M6 12h10" /></>,
  'external-link': <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></>,
  refresh: <><path d="M20 11.5A8 8 0 0 0 5.6 7M4 12.5A8 8 0 0 0 18.4 17" /><path d="M5 3v4.5h4.5M19 21v-4.5h-4.5" /></>,
  'wifi-off': <><path d="M3 3l18 18" /><path d="M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.2-2.4M19 12.5a10 10 0 0 0-2.2-1.6M2 9a15 15 0 0 1 4.3-2.6M22 9a15 15 0 0 0-9.8-3.9" /><path d="M12 19.5v.01" /></>,
  heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  more: <><circle cx="5.5" cy="12" r=".8" /><circle cx="12" cy="12" r=".8" /><circle cx="18.5" cy="12" r=".8" /></>,
  download: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  upload: <><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4.5 19.5h15" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r=".8" /></>,
  timer: <><circle cx="12" cy="13.5" r="7.5" /><path d="M12 13.5V10M9.5 2.5h5M18.5 6.5l1.5-1.5" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" /><path d="M10 21h4" /></>,
  scale: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12" /></>,
  copy: <><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h3.5" /></>,
  trigo: <><path d="M12 21V7" /><path d="M12 8c-2.5-.5-4-2.5-4-5 2.5.5 4 2.5 4 5Z" /><path d="M12 8c2.5-.5 4-2.5 4-5-2.5.5-4 2.5-4 5Z" /><path d="M12 14c-2.5-.5-4-2.5-4-5 2.5.5 4 2.5 4 5Z" /><path d="M12 14c2.5-.5 4-2.5 4-5-2.5.5-4 2.5-4 5Z" /></>,
  coxa: <><path d="M16 3.8a5 5 0 0 1 1.2 8l-3.4 3.4-5-5 3.4-3.4A5 5 0 0 1 16 3.8Z" /><path d="m8.8 10.2-3.3 3.3" /><circle cx="4.6" cy="16.2" r="1.7" /><circle cx="7.8" cy="19.4" r="1.7" /><path d="m10.5 15.2-3 3" /></>,
  ovo: <path d="M12 3c3.6 0 6.5 6.2 6.5 10.6a6.5 6.5 0 0 1-13 0C5.5 9.2 8.4 3 12 3Z" />,
  feijao: <><path d="M7.4 18.6c-3-3-2.5-9 2-11.6 2.6-1.4 5.1-.5 5.6 1.5.4 1.6-1 2.6-1 4.1s2 2.5 1.5 4.6c-.8 3-5.6 4-8.1 1.4Z" /><path d="M10 11.5c.6-.8 1.6-1.3 2.6-1.2" /></>,
  leite: <><path d="M9 3h6v3l2 3v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9l2-3Z" /><path d="M7 12.5h10" /></>,
  maca: <><path d="M12 7.5c-1.6-1.1-5.2-1.6-6.6 1.5-1.4 3-.4 7.2 1.6 9.7s3.6 2 5 1c1.4 1 3 1.5 5-1s3-6.7 1.6-9.7C17.2 5.9 13.6 6.4 12 7.5Z" /><path d="M12 7.5c0-2 .9-3.6 2.5-4.5" /></>,
  abacate: <><path d="M12 3c3 0 5 4.2 5.6 8.6A5.6 5.6 0 0 1 12 21a5.6 5.6 0 0 1-5.6-9.4C7 7.2 9 3 12 3Z" /><circle cx="12" cy="15" r="2.6" /></>,
  folha: <><path d="M5 19c0-8.2 5.2-14 14-14 0 9.2-6.2 14-14 14Z" /><path d="m5 19 8-8" /></>,
  prato: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5" /></>,
  flask: <><path d="M9.5 3h5M10.2 3v6.2L5.2 18a2 2 0 0 0 1.8 3h10a2 2 0 0 0 1.8-3l-5-8.8V3" /><path d="M7.4 15h9.2" /></>,
  file: <><path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5Z" /><path d="M14 3v4.5h4.5M9 13h6M9 17h4" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10.2 5-3v9.6l-5-3" /></>,
  note: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;
export const iconNames = Object.keys(paths) as IconName[];

// Aliases convenientes
const aliases: Record<string, IconName> = {
  close: 'x', gear: 'settings', admin: 'shield', water: 'droplet', sleep: 'moon',
  supplement: 'pill', shake: 'cup', meal: 'utensils', yoga: 'stretch', streak: 'flame',
};
export type IconAlias = 'close' | 'gear' | 'admin' | 'water' | 'sleep' | 'supplement' | 'shake' | 'meal' | 'yoga' | 'streak';

export type IconProps = {
  name: IconName | IconAlias;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /** Rótulo acessível; sem ele o ícone é decorativo (aria-hidden). */
  label?: string;
};

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8, className = '', style, label }: IconProps) {
  const key = (aliases[name] ?? name) as IconName;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {paths[key]}
    </svg>
  );
}
