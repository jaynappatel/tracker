'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext<{ user: User | null }>({ user: null });

// Auth is a shared-password gate: /login POSTs the password to
// app/api/gate/route.ts, which verifies it server-side and signs into the
// one Supabase account there. This provider only checks for the resulting
// session — no credentials of any kind exist in client code or the bundle.
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session) router.replace('/login');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace('/login');
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [router]);

  if (loading) {
    return <div className="empty-note" style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }
  if (!user) return null; // redirecting to /login

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useUser(): User | null {
  return useContext(AuthContext).user;
}
