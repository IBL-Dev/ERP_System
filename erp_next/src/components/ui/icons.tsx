type IconProps = { className?: string };

const base = {
  viewBox: "0 0 16 16",
  "aria-hidden": true,
  focusable: false,
} as const;

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="currentColor">
      <path d="M1.5 3.5a1 1 0 011-1h3.2l1.6 1.8h6.2a1 1 0 011 1v7.2a1 1 0 01-1 1h-11a1 1 0 01-1-1z" />
    </svg>
  );
}

export function DocIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
      <path d="M4 1.5h5.5L13 5v9a.5.5 0 01-.5.5h-8A.5.5 0 014 14z" />
      <path d="M9.5 1.5V5H13" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3.5L10.5 8 6 12.5" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l6-5.5L14 8M3.5 7v6.5H7V10h2v3.5h3.5V7" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}
