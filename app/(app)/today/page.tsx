'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { parseDate } from '@/lib/dateHelpers';
import { DEFAULT_GOALS, DEFAULT_ROTATION, Goals, Meal, WeeklyPlanExercise, sumMeals, pct } from '@/lib/types';
import { Stamp, ProgressBar, WorkoutSuggestion } from '@/components/Widgets';
import Link from 'next/link';

export default function TodayPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterOz, setWaterOz] = useState(0);
  const [steps, setSteps] = useState<number | null>(null);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [sleepLogged, setSleepLogged] = useState(false);
  const [healthLogged, setHealthLogged] = useState(false);
  const [todaysType, setTodaysType] = useState('Rest');
  const [planExercises, setPlanExercises] = useState<WeeklyPlanExercise[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [goalsRes, mealsRes, waterRes, stepsRes, workoutRes, sleepRes, healthRes, rotationRes, planExRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('meals').select('*').eq('user_id', uid).eq('date', date),
        supabase.from('water_entries').select('oz').eq('user_id', uid).eq('date', date),
        supabase.from('steps').select('count').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('workout_logs').select('done').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('sleep_logs').select('hours').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('health_logs').select('*').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('rotation').select('days').eq('user_id', uid).maybeSingle(),
        supabase.from('weekly_plan_exercises').select('*').eq('user_id', uid).order('created_at'),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      setMeals((mealsRes.data as Meal[]) || []);
      setWaterOz((waterRes.data || []).reduce((sum, r: any) => sum + r.oz, 0));
      setSteps(stepsRes.data ? (stepsRes.data as any).count : null);
      setWorkoutDone(!!workoutRes.data?.done);
      setSleepLogged(!!sleepRes.data);
      const h = healthRes.data as any;
      setHealthLogged(!!h && (h.glp1 || h.birth_control || h.period || h.sex));
      const rotation = (rotationRes.data?.days as string[]) || DEFAULT_ROTATION;
      setTodaysType(rotation[parseDate(date).getDay()] || 'Rest');
      setPlanExercises((planExRes.data as WeeklyPlanExercise[]) || []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, date]);

  if (loading) return <div className="empty-note">Loading…</div>;

  const totals = sumMeals(meals);

  return (
    <>
      <div className="card">
        <h3>Today at a glance</h3>
        <div className="stamp-row">
          <Stamp label="Meals" done={meals.length > 0} />
          <Stamp label="Water" done={waterOz >= goals.water_goal_oz} />
          <Stamp label="Steps" done={steps !== null && steps >= goals.step_goal} />
          <Stamp label="Workout" done={workoutDone} />
          <Stamp label="Sleep" done={sleepLogged} />
          <Stamp label="Health" done={healthLogged} />
        </div>
      </div>

      <div className="card">
        <h3>Calories</h3>
        <div className="stat-line"><span className="lbl">Logged</span><span className="num">{totals.calories} / {goals.calorie_goal} cal</span></div>
        <ProgressBar value={totals.calories} goal={goals.calorie_goal} />
        <div className="macro-grid">
          <div className="macro-cell"><div className="val">{totals.protein}g</div><div className="lbl">Protein · {goals.protein_goal}g</div></div>
          <div className="macro-cell"><div className="val">{totals.carbs}g</div><div className="lbl">Carbs · {goals.carb_goal}g</div></div>
          <div className="macro-cell"><div className="val">{totals.fat}g</div><div className="lbl">Fat · {goals.fat_goal}g</div></div>
          <div className="macro-cell"><div className="val">{meals.length}</div><div className="lbl">Meals logged</div></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Water</h3>
          <div className="stat-line"><span className="lbl">Logged</span><span className="num">{waterOz} / {goals.water_goal_oz} oz</span></div>
          <ProgressBar value={waterOz} goal={goals.water_goal_oz} />
        </div>
        <div className="card">
          <h3>Steps</h3>
          <div className="stat-line"><span className="lbl">Logged</span><span className="num">{steps ?? '—'} / {goals.step_goal}</span></div>
          <ProgressBar value={steps || 0} goal={goals.step_goal} variant="gold" />
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ marginBottom: 0 }}>Today&apos;s workout</h3>
          <span className={`type-chip ${todaysType === 'Rest' ? 'gold' : ''}`}>
            {todaysType}{workoutDone ? ' · done ✓' : ''}
          </span>
        </div>
        <WorkoutSuggestion type={todaysType} exercises={planExercises} />
        {todaysType !== 'Rest' && (
          <Link href={`/movement?date=${date}`} className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
            Go log it &rarr;
          </Link>
        )}
      </div>
    </>
  );
}
