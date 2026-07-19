// Small line-art doodle icons for the daily stamp row. Outline style,
// stroke = currentColor so the Stamp's done/undone state colors them.

const STROKE = { stroke: 'currentColor', strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export type DoodleName = 'meals' | 'water' | 'steps' | 'workout' | 'sleep' | 'health';

export function DoodleIcon({ name, size = 26 }: { name: DoodleName; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 26 26', 'aria-hidden': true as const };
  switch (name) {
    case 'meals': // apple with a leaf
      return (
        <svg {...props}>
          <path {...STROKE} d="M13 8.5 C 10 5.5, 5 6.5, 4.5 11 C 4 16, 8 21.5, 11 21.5 C 12 21.5, 12.3 21 13 21 C 13.7 21, 14 21.5, 15 21.5 C 18 21.5, 22 16, 21.5 11 C 21 6.5, 16 5.5, 13 8.5 Z" />
          <path {...STROKE} d="M13 8 C 13 5.5, 14.5 4, 16.5 3.5" />
          <path {...STROKE} d="M13.5 6 C 15.5 5, 17.5 5.5, 18.5 7 C 16.5 8, 14.5 7.5, 13.5 6 Z" />
        </svg>
      );
    case 'water': // droplet
      return (
        <svg {...props}>
          <path {...STROKE} d="M13 3.5 C 16.5 8.5, 20 12.5, 20 16 C 20 20, 17 22.5, 13 22.5 C 9 22.5, 6 20, 6 16 C 6 12.5, 9.5 8.5, 13 3.5 Z" />
          <path {...STROKE} d="M10 16.5 C 10 18.3, 11 19.5, 12.5 19.8" opacity="0.7" />
        </svg>
      );
    case 'steps': // two little footprints
      return (
        <svg {...props}>
          <ellipse {...STROKE} cx="8.5" cy="8" rx="3.1" ry="4.6" transform="rotate(-12 8.5 8)" />
          <path {...STROKE} d="M7 14.2 C 7.4 15.8, 9.4 15.9, 10 14.6" transform="rotate(-12 8.5 14.5)" />
          <ellipse {...STROKE} cx="17.5" cy="14.5" rx="3.1" ry="4.6" transform="rotate(12 17.5 14.5)" />
          <path {...STROKE} d="M16 20.7 C 16.4 22.3, 18.4 22.4, 19 21.1" transform="rotate(12 17.5 21)" />
        </svg>
      );
    case 'workout': // dumbbell
      return (
        <svg {...props}>
          <path {...STROKE} d="M9 13 h8" />
          <rect {...STROKE} x="5" y="8.5" width="3.4" height="9" rx="1.5" />
          <rect {...STROKE} x="17.6" y="8.5" width="3.4" height="9" rx="1.5" />
          <path {...STROKE} d="M3 11 v4 M23 11 v4" />
        </svg>
      );
    case 'sleep': // crescent moon and star
      return (
        <svg {...props}>
          <path {...STROKE} d="M16.5 4.5 C 12 5.5, 9 9.5, 9.5 14 C 10 18.5, 14 21.5, 18.5 21 C 16 20, 13.5 17.5, 13.2 13.8 C 12.9 10, 14.5 6.5, 16.5 4.5 Z" />
          <path {...STROKE} d="M20 8 l0.9 2.1 2.1 0.9 -2.1 0.9 -0.9 2.1 -0.9 -2.1 -2.1 -0.9 2.1 -0.9 Z" strokeWidth={1.4} />
        </svg>
      );
    case 'health': // heart
      return (
        <svg {...props}>
          <path {...STROKE} d="M13 21 C 8 17, 4 13.5, 4 9.5 C 4 6.5, 6.3 4.5, 9 4.5 C 10.7 4.5, 12.2 5.4, 13 6.8 C 13.8 5.4, 15.3 4.5, 17 4.5 C 19.7 4.5, 22 6.5, 22 9.5 C 22 13.5, 18 17, 13 21 Z" />
        </svg>
      );
  }
}
