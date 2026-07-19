'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { last7Days, weekdayName } from '@/lib/dateHelpers';
import { DEFAULT_GOALS, Goals, Meal, sumMeals } from '@/lib/types';

interface DayRow {
  date: string;
  calories: number;
  protein: number;
  water: number;
  steps: number;
  sleep: number;
  worked: boolean;
}

export default function SummaryPage() {
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const uid = SINGLE_USER_ID;
      const days = last7Days(date);

      const [goalsRes, mealsRes, waterRes, stepsRes, sleepRes, workoutRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('meals').select('*').eq('user_id', uid).in('date', days),
        supabase.from('water_entries').select('date, oz').eq('user_id', uid).in('date', days),
        supabase.from('steps').select('date, count').eq('user_id', uid).in('date', days),
        supabase.from('sleep_logs').select('date, hours').eq('user_id', uid).in('date', days),
        supabase.from('workout_logs').select('date, done').eq('user_id', uid).in('date', days),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);

      const mealsByDay: Record<string, Meal[]> = {};
      (mealsRes.data as Meal[] || []).forEach((m) => { (mealsByDay[m.date] ||= []).push(m); });
      const waterByDay: Record<string, number> = {};
      (waterRes.data || []).forEach((w: any) => { waterByDay[w.date] = (waterByDay[w.date] || 0) + w.oz; });
      const stepsByDay: Record<string, number> = {};
      (stepsRes.data || []).forEach((s: any) => { stepsByDay[s.date] = s.count; });
      const sleepByDay: Record<string, number> = {};
      (sleepRes.data || []).forEach((s: any) => { sleepByDay[s.date] = s.hours; });
      const workoutByDay: Record<string, boolean> = {};
      (workoutRes.data || []).forEach((w: any) => { workoutByDay[w.date] = w.done; });

      const built = days.map((d) => {
        const totals = sumMeals(mealsByDay[d] || []);
        return {
          date: d,
          calories: totals.calories,
          protein: totals.protein,
          water: waterByDay[d] || 0,
          steps: stepsByDay[d] || 0,
          sleep: sleepByDay[d] || 0,
          worked: !!workoutByDay[d],
        };
      });
      setRows(built);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  if (loading) return <div className="empty-note">Loading…</div>;

  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const avgCal = avg(rows.map((r) => r.calories));
  const avgPro = avg(rows.map((r) => r.protein));
  const avgWater = avg(rows.map((r) => r.water));
  const avgSteps = avg(rows.map((r) => r.steps));
  const avgSleep = avg(rows.map((r) => r.sleep));
  const workouts = rows.filter((r) => r.worked).length;

  const chartData = rows.map((r) => ({ day: weekdayName(r.date), Calories: r.calories }));

  return (
    <>
      <div className="weekly-stats">
        <Stat big={avgCal} lbl="Avg calories/day" vs={`goal ${goals.calorie_goal}`} />
        <Stat big={`${avgPro}g`} lbl="Avg protein/day" vs={`goal ${goals.protein_goal}g`} />
        <Stat big={`${avgWater}oz`} lbl="Avg water/day" vs={`goal ${goals.water_goal_oz}oz`} />
        <Stat big={avgSteps} lbl="Avg steps/day" vs={`goal ${goals.step_goal}`} />
        <Stat big={`${avgSleep}h`} lbl="Avg sleep/night" vs={`goal ${goals.sleep_goal_hrs}h`} />
        <Stat big={`${workouts}/7`} lbl="Workouts logged" />
      </div>
      <div className="card">
        <h3>Calories, last 7 days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="#EAE6D8" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#5B6355', fontFamily: 'IBM Plex Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#5B6355', fontFamily: 'IBM Plex Mono', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 12, borderRadius: 8, borderColor: '#D9D4C2' }} />
            <Bar dataKey="Calories" fill="#3E6B64" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function Stat({ big, lbl, vs }: { big: string | number; lbl: string; vs?: string }) {
  return (
    <div className="weekly-stat">
      <div className="big">{big}</div>
      <div className="lbl">{lbl}</div>
      {vs && <div className="vs">{vs}</div>}
    </div>
  );
}
