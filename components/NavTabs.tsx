'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  { href: '/today', label: 'Today' },
  { href: '/nutrition', label: 'Nutrition' },
  { href: '/water', label: 'Water' },
  { href: '/movement', label: 'Movement' },
  { href: '/plan', label: 'Plan' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/sleep', label: 'Sleep' },
  { href: '/health', label: 'Health' },
  { href: '/summary', label: 'Weekly' },
  { href: '/goals', label: 'Goals' },
];

export default function NavTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <Link key={t.href} href={query ? `${t.href}?${query}` : t.href} className={pathname === t.href ? 'active' : ''}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
