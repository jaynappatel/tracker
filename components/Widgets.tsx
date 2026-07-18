export function Stamp({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`stamp ${done ? 'done' : ''}`}>
      <div className="ring">{done ? '✓' : ''}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export function ProgressBar({ value, goal, variant }: { value: number; goal: number; variant?: 'gold' | 'coral' }) {
  const p = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="bar-track">
      <div className={`bar-fill ${variant ?? ''}`} style={{ width: `${p}%` }} />
    </div>
  );
}
