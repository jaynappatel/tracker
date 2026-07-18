'use client';

import { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import NavTabs from '@/components/NavTabs';
import DateNav from '@/components/DateNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
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
        <main>{children}</main>
      </div>
    </AuthProvider>
  );
}
