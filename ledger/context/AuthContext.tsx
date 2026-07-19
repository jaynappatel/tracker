'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext<{ user: User | null }>({ user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (!data.session) router.replace('/login');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) router.replace('/login');
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="empty-note" style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }
  if (!user) return null; // redirect is already underway

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useUser(): User | null {
  return useContext(AuthContext).user;
}
