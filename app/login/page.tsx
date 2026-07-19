'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Single shared password gate. The password is checked server-side
// (app/api/gate/route.ts); on success the server returns Supabase session
// tokens and we adopt them here, so everything downstream is a normal
// authenticated Supabase session and RLS keeps working unchanged.

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(res.status === 401 ? 'Wrong password.' : 'Something went wrong — try again.');
        setBusy(false);
        return;
      }
      const { access_token, refresh_token } = await res.json();
      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (sessionError) {
        setError(sessionError.message);
        setBusy(false);
        return;
      }
      router.replace('/today');
    } catch {
      setError('Something went wrong — try again.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <header className="top" style={{ padding: '0 0 18px' }}>
        <div>
          <h1>Ledger</h1>
          <div className="tagline">a running record — food, movement, body, cycle</div>
        </div>
      </header>
      <div className="card">
        <h3>Enter password</h3>
        <form onSubmit={submit}>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </label>
          <button className="btn btn-teal" type="submit" disabled={busy || !password}>
            {busy ? 'Checking…' : 'Unlock'}
          </button>
          {error && <div className="error-note">{error}</div>}
        </form>
      </div>
    </div>
  );
}
