'use client';

import { Suspense } from 'react';
import NavTabs from '@/components/NavTabs';
import DateNav from '@/components/DateNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
        <header className="top">
          <div>
            <h1>Ledger</h1>
            <div className="tagline">a running record — food, movement, body, cycle</div>
          </div>
        </header>
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
