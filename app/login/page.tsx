'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmNote, setConfirmNote] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      router.replace('/today');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) { setError(error.message); return; }
      setConfirmNote(true);
    }
  }

  return (
    <div className="auth-shell">
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Ledger</h1>
      <div className="tagline" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--ink-faint)', marginBottom: 24 }}>
        a running record — food, movement, body, cycle
      </div>

      <div className="auth-tabs">
        <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(null); setConfirmNote(false); }}>Sign in</button>
        <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(null); setConfirmNote(false); }}>Create account</button>
      </div>

      {confirmNote ? (
        <div className="card">
          <p style={{ margin: 0 }}>Account created. Depending on your Supabase project settings, you may need to confirm your email before signing in — check your inbox, then switch to Sign in above.</p>
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          <label className="field"><span>Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field"><span>Password</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="error-note">{error}</div>}
          <button className="btn btn-teal" type="submit" disabled={loading} style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>
            {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      )}

      {mode === 'signup' && !confirmNote && (
        <p style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
          This is a single-user app — create your one account here, then just sign in from now on, including from your phone.
        </p>
      )}
    </div>
  );
}
