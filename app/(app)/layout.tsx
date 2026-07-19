'use client';

import { Suspense } from 'react';
import NavTabs from '@/components/NavTabs';
import DateNav from '@/components/DateNav';
import HeaderBanner from '@/components/HeaderBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
        <HeaderBanner title="Ledger" tagline="a running record — food, movement, body, cycle" />
        <Suspense fallback={null}>
          <DateNav />
          <NavTabs />
        </Suspense>
        <main>
          <Suspense fallback={null}>{children}</Suspense>
        </main>
    </div>
  );
}
