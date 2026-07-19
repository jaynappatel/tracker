'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { DEFAULT_GOALS, Goals, Meal, sumMeals } from '@/lib/types';

export default function NutritionPage() {
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const uid = SINGLE_USER_ID;
      const [goalsRes, mealsRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('meals').select('*').eq('user_id', uid).eq('date', date).order('created_at'),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      setMeals((mealsRes.data as Meal[]) || []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  async function addMeal() {
    if (!mealName.trim()) return;
    const entry = {
      user_id: SINGLE_USER_ID,
      date,
      name: mealName.trim(),
      calories: Number(mealCal) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
    };
    const { data } = await supabase.from('meals').insert(entry).select().single();
    if (data) setMeals([...meals, data as Meal]);
    setMealName(''); setMealCal(''); setMealProtein(''); setMealCarbs(''); setMealFat('');
  }

  async function deleteMeal(id: string | undefined, idx: number) {
    if (id) await supabase.from('meals').delete().eq('id', id);
    setMeals(meals.filter((_, i) => i !== idx));
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  const totals = sumMeals(meals);

  return (
    <>
      <div className="card">
        <h3>Log a meal</h3>
        <div className="grid-2">
          <label className="field"><span>Food / meal name</span><input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Chicken & rice bowl" /></label>
          <label className="field"><span>Calories</span><input type="number" min={0} value={mealCal} onChange={(e) => setMealCal(e.target.value)} /></label>
        </div>
        <div className="grid-3">
          <label className="field"><span>Protein (g)</span><input type="number" min={0} value={mealProtein} onChange={(e) => setMealProtein(e.target.value)} /></label>
          <label className="field"><span>Carbs (g)</span><input type="number" min={0} value={mealCarbs} onChange={(e) => setMealCarbs(e.target.value)} /></label>
          <label className="field"><span>Fat (g)</span><input type="number" min={0} value={mealFat} onChange={(e) => setMealFat(e.target.value)} /></label>
        </div>
        <button className="btn btn-teal" onClick={addMeal}>Add to today's log</button>
      </div>

      <div className="card">
        <h3>Today's log — {totals.calories} cal</h3>
        <div className="macro-grid">
          <div className="macro-cell"><div className="val">{totals.calories}</div><div className="lbl">of {goals.calorie_goal} cal</div></div>
          <div className="macro-cell"><div className="val">{totals.protein}g</div><div className="lbl">of {goals.protein_goal}g pro</div></div>
          <div className="macro-cell"><div className="val">{totals.carbs}g</div><div className="lbl">of {goals.carb_goal}g carb</div></div>
          <div className="macro-cell"><div className="val">{totals.fat}g</div><div className="lbl">of {goals.fat_goal}g fat</div></div>
        </div>
        <div className="entry-list">
          {meals.length === 0
            ? <div className="empty-note">Nothing logged yet today.</div>
            : meals.map((m, i) => (
              <div className="entry" key={m.id ?? i}>
                <span>{m.name}</span>
                <span className="meta">{m.calories} cal · P{m.protein} C{m.carbs} F{m.fat}
                  <button className="del" onClick={() => deleteMeal(m.id, i)}>&times;</button>
                </span>
              </div>
            ))}
        </div>
      </div>

    </>
  );
}
