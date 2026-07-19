'use client';

import { ReactNode, useEffect, useState } from 'react';

// Soft deterrent only — NOT security. This password is a plain string in
// client code, visible to anyone who reads the bundle, and the database is
// open-access regardless of this screen. It just stops casual passers-by
// from seeing the UI. Edit the line below to change the password:
const GATE_PASSWORD = '1234';

const STORAGE_KEY = 'gate-unlocked';

export default function SimpleGate({ children }: { children: ReactNode }) {
  // null = still checking localStorage (render nothing to avoid a gate flash)
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (input === GATE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  }

  if (unlocked === null) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="card" style={{ maxWidth: 360, margin: '32px auto 0' }}>
      <h3>Password, please</h3>
      <form onSubmit={submit}>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={input}
            autoFocus
            onChange={(e) => { setInput(e.target.value); setError(false); }}
          />
        </label>
        <button className="btn btn-teal" type="submit" disabled={!input}>Enter</button>
        {error && <div className="error-note">That&apos;s not it — try again.</div>}
      </form>
    </div>
  );
}
