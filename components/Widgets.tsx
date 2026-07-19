import Link from 'next/link';
import { WeeklyPlanExercise } from '@/lib/types';
import { DoodleIcon, DoodleName } from '@/components/DoodleIcons';

const ICON_BY_LABEL: Record<string, DoodleName> = {
  meals: 'meals',
  water: 'water',
  steps: 'steps',
  workout: 'workout',
  sleep: 'sleep',
  health: 'health',
};

export function Stamp({ label, done }: { label: string; done: boolean }) {
  const icon = ICON_BY_LABEL[label.toLowerCase()];
  return (
    <div className={`stamp ${done ? 'done' : ''}`}>
      <div className="ring">{icon ? <DoodleIcon name={icon} /> : done ? '✓' : ''}</div>
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

// The day's workout suggestion: the rotation's type for today plus whatever
// exercise options were hand-entered for that type on the Plan page.
export function WorkoutSuggestion({ type, exercises }: { type: string; exercises: WeeklyPlanExercise[] }) {
  if (type === 'Rest') {
    return <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>Rest day — recovery counts too. Stretch, walk, hydrate.</p>;
  }
  const options = exercises.filter((x) => x.workout_type === type);
  if (options.length === 0) {
    return (
      <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
        No exercises entered for {type} days yet — add some on the <Link href="/plan" style={{ color: 'var(--teal)', fontWeight: 600 }}>Plan</Link> page.
      </p>
    );
  }
  return (
    <div>
      {options.map((x) => (
        <div className="exercise-option" key={x.id ?? x.name}>
          <div>
            <div className="ex-name">{x.name}</div>
            {(x.sets || x.reps) && <div className="ex-detail">{x.sets || '—'} × {x.reps || '—'}</div>}
            {x.notes && <div className="ex-notes">{x.notes}</div>}
          </div>
          {x.video_url && <a className="watch-link" href={x.video_url} target="_blank" rel="noopener noreferrer">▶ Watch</a>}
        </div>
      ))}
    </div>
  );
}
