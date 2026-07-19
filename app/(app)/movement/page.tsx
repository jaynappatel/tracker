'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { parseDate } from '@/lib/dateHelpers';
import { DEFAULT_GOALS, DEFAULT_ROTATION, Exercise, Goals, WORKOUT_TYPES, WeeklyPlanExercise } from '@/lib/types';
import { ProgressBar, WorkoutSuggestion } from '@/components/Widgets';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MovementPage() {
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [steps, setSteps] = useState('');
  const [rotation, setRotation] = useState<string[]>(DEFAULT_ROTATION);
  const [workoutType, setWorkoutType] = useState('Rest');
  const [done, setDone] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [planExercises, setPlanExercises] = useState<WeeklyPlanExercise[]>([]);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('');
  const [exReps, setExReps] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [loading, setLoading] = useState(true);

  const weekday = parseDate(date).getDay();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const uid = SINGLE_USER_ID;
      const [goalsRes, stepsRes, rotationRes, workoutRes, planExRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('steps').select('count').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('rotation').select('days').eq('user_id', uid).maybeSingle(),
        supabase.from('workout_logs').select('*').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('weekly_plan_exercises').select('*').eq('user_id', uid).order('created_at'),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      setSteps(stepsRes.data ? String((stepsRes.data as any).count) : '');
      const days = (rotationRes.data?.days as string[]) || DEFAULT_ROTATION;
      setRotation(days);
      const wo = workoutRes.data as any;
      setWorkoutType(wo?.type || days[weekday] || 'Rest');
      setDone(!!wo?.done);
      setExercises(wo?.exercises || []);
      setPlanExercises((planExRes.data as WeeklyPlanExercise[]) || []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  async function saveSteps() {
    const v = Number(steps);
    await supabase.from('steps').upsert({ user_id: SINGLE_USER_ID, date, count: v });
  }

  async function updateRotationDay(dayIdx: number, value: string) {
    const next = [...rotation];
    next[dayIdx] = value;
    setRotation(next);
    await supabase.from('rotation').upsert({ user_id: SINGLE_USER_ID, days: next });
  }

  async function saveWorkoutLog(next: { done?: boolean; exercises?: Exercise[] }) {
    const payload = {
      user_id: SINGLE_USER_ID,
      date,
      type: workoutType,
      done: next.done ?? done,
      exercises: next.exercises ?? exercises,
    };
    await supabase.from('workout_logs').upsert(payload);
  }

  async function toggleDone(checked: boolean) {
    setDone(checked);
    await saveWorkoutLog({ done: checked });
  }

  async function addExercise() {
    if (!exName.trim()) return;
    const next = [...exercises, { name: exName.trim(), sets: exSets || '-', reps: exReps || '-', weight: exWeight || '-' }];
    setExercises(next);
    await saveWorkoutLog({ exercises: next });
    setExName(''); setExSets(''); setExReps(''); setExWeight('');
  }

  async function removeExercise(idx: number) {
    const next = exercises.filter((_, i) => i !== idx);
    setExercises(next);
    await saveWorkoutLog({ exercises: next });
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <>
      <div className="card">
        <h3>Steps — {steps || 0} / {goals.step_goal}</h3>
        <ProgressBar value={Number(steps) || 0} goal={goals.step_goal} variant="gold" />
        <div className="row" style={{ marginTop: 12 }}>
          <input type="number" placeholder="steps today" value={steps} onChange={(e) => setSteps(e.target.value)} style={{ maxWidth: 140 }} />
          <button className="btn btn-teal" onClick={saveSteps}>Save</button>
        </div>
        <div className="sub" style={{ marginTop: 10 }}>Manual entry for now — pull this from your phone's Health / Fit app (Pacer syncs to both) at the end of the day.</div>
      </div>

      <div className="card">
        <h3>Weekly workout rotation</h3>
        <div className="sub">Set your regime once — the day's type shows up automatically here and on Today.</div>
        <div className="week-grid">
          {DAY_NAMES.map((d, i) => (
            <div className="week-day" key={d}>
              <div className="d">{d}</div>
              <select value={rotation[i]} onChange={(e) => updateRotationDay(i, e.target.value)}>
                {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ marginBottom: 0 }}>Today's workout</h3>
          <span className={`type-chip ${workoutType === 'Rest' ? 'gold' : ''}`}>{workoutType}</span>
        </div>
        {workoutType !== 'Rest' && <div className="sub">This week&apos;s options for {workoutType} days, from your Plan.</div>}
        <WorkoutSuggestion type={workoutType} exercises={planExercises} />
        <div className="toggle-row" style={{ marginTop: 14 }}>
          <div><div className="name">Mark today's workout as done</div></div>
          <label className="switch"><input type="checkbox" checked={done} onChange={(e) => toggleDone(e.target.checked)} /><span className="track" /></label>
        </div>
        <div className="grid-4">
          <input type="text" placeholder="Exercise" value={exName} onChange={(e) => setExName(e.target.value)} />
          <input type="number" placeholder="Sets" value={exSets} onChange={(e) => setExSets(e.target.value)} />
          <input type="number" placeholder="Reps" value={exReps} onChange={(e) => setExReps(e.target.value)} />
          <input type="number" placeholder="Weight" value={exWeight} onChange={(e) => setExWeight(e.target.value)} />
        </div>
        <button className="btn btn-teal btn-sm" onClick={addExercise} style={{ marginTop: 8 }}>Add exercise</button>
        <div className="entry-list">
          {exercises.length === 0
            ? <div className="empty-note">No exercises logged for today yet.</div>
            : exercises.map((x, i) => (
              <div className="entry" key={i}>
                <span>{x.name}</span>
                <span className="meta">{x.sets}×{x.reps} @ {x.weight}<button className="del" onClick={() => removeExercise(i)}>&times;</button></span>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
