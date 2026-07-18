'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { DEFAULT_GOALS, Goals, Meal, Recipe, sumMeals } from '@/lib/types';

export default function NutritionPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const [groceries, setGroceries] = useState('');
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [goalsRes, mealsRes, weightRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('meals').select('*').eq('user_id', uid).eq('date', date).order('created_at'),
        supabase.from('weights').select('weight_lb').eq('user_id', uid).eq('date', date).maybeSingle(),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      setMeals((mealsRes.data as Meal[]) || []);
      setWeight(weightRes.data ? String((weightRes.data as any).weight_lb) : '');
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, date]);

  async function addMeal() {
    if (!mealName.trim() || !user) return;
    const entry = {
      user_id: user.id,
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

  async function saveWeight() {
    if (!weight || !user) return;
    await supabase.from('weights').upsert({ user_id: user.id, date, weight_lb: Number(weight) });
  }

  async function generateRecipes() {
    if (!groceries.trim()) return;
    setGenLoading(true);
    setGenError(null);
    setRecipes(null);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groceries }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecipes(data.recipes);
    } catch (e: any) {
      setGenError("Couldn't generate recipes right now. Try again in a moment.");
    } finally {
      setGenLoading(false);
    }
  }

  async function addRecipeToLog(r: Recipe) {
    if (!user) return;
    const entry = { user_id: user.id, date, name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat };
    const { data } = await supabase.from('meals').insert(entry).select().single();
    if (data) setMeals([...meals, data as Meal]);
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  const totals = sumMeals(meals);

  return (
    <>
      <div className="card">
        <h3>Generate recipes from your groceries</h3>
        <div className="sub">Paste what you bought — get recipe ideas with estimated calories & macros, ready to drop into today's log.</div>
        <label className="field"><span>Groceries</span>
          <textarea value={groceries} onChange={(e) => setGroceries(e.target.value)} placeholder="chicken breast, broccoli, brown rice, eggs, greek yogurt, spinach..." />
        </label>
        <button className="btn btn-teal" onClick={generateRecipes} disabled={genLoading}>
          {genLoading ? <><span className="spinner" /> Thinking...</> : 'Generate recipes'}
        </button>
        {genError && <div className="empty-note">{genError}</div>}
        {recipes && recipes.map((r, i) => (
          <div className="recipe-card" key={i}>
            <h4>{r.name}</h4>
            <div className="macros-inline">{r.calories} cal · P{r.protein} C{r.carbs} F{r.fat} · serves {r.servings}</div>
            <ul>{r.ingredients.map((ing, j) => <li key={j}>{ing}</li>)}</ul>
            <ol>{r.instructions.map((step, j) => <li key={j}>{step}</li>)}</ol>
            <button className="btn btn-teal btn-sm" onClick={() => addRecipeToLog(r)}>Add to today's log</button>
          </div>
        ))}
      </div>

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

      <div className="card">
        <h3>Weight check-in</h3>
        <div className="row">
          <input type="number" placeholder="lbs" step="0.1" style={{ maxWidth: 120 }} value={weight} onChange={(e) => setWeight(e.target.value)} />
          <button className="btn btn-ghost" onClick={saveWeight}>Save</button>
        </div>
      </div>
    </>
  );
}
