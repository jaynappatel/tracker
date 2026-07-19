'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext<{ user: User | null }>({ user: null });

// This is a single-user personal app — there's no login screen. Instead we
// silently sign in with the one account's credentials, which live only in
// env vars (never committed). The account itself is created once directly
// in the Supabase dashboard (Authentication > Users > Add user), not via
// any in-app signup form.
const APP_EMAIL = process.env.NEXT_PUBLIC_APP_EMAIL as string;
const APP_PASSWORD = process.env.NEXT_PUBLIC_APP_PASSWORD as string;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function ensureSignedIn() {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        if (active) { setUser(data.session.user); setLoading(false); }
        return;
      }

      if (!APP_EMAIL || !APP_PASSWORD) {
        if (active) {
          setAuthError('Missing NEXT_PUBLIC_APP_EMAIL / NEXT_PUBLIC_APP_PASSWORD env vars.');
          setLoading(false);
        }
        return;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: APP_EMAIL,
        password: APP_PASSWORD,
      });
      if (!active) return;
      if (error) {
        setAuthError(error.message);
        setLoading(false);
        return;
      }
      setUser(signInData.user);
      setLoading(false);
    }

    ensureSignedIn();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return <div className="empty-note" style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }
  if (authError) {
    return (
      <div className="empty-note" style={{ padding: 40, textAlign: 'center' }}>
        Couldn't sign in automatically: {authError}
      </div>
    );
  }
  if (!user) return null;

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useUser(): User | null {
  return useContext(AuthContext).user;
}
