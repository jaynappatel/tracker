'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { fmtDate, weekStartOf } from '@/lib/dateHelpers';
import {
  DAY_NAMES_SHORT,
  DEFAULT_ROTATION,
  MEAL_SLOTS,
  WORKOUT_TYPES,
  WeeklyPlanExercise,
  WeeklyPlanMeal,
  WeeklyRecipe,
} from '@/lib/types';

// Everything on this page is hand-entered. Jayna writes the week's plan
// herself (e.g. with Claude in a separate chat) and types/pastes it in here.
// Nothing regenerates — entries persist exactly as saved until edited.

const EMPTY_RECIPE: WeeklyRecipe = {
  name: '', ingredients: '', instructions: '',
  calories: 0, protein: 0, carbs: 0, fat: 0, servings: 1,
};

const EMPTY_EXERCISE: WeeklyPlanExercise = {
  workout_type: 'Push', name: '', sets: '', reps: '', notes: '', video_url: '',
};

export default function PlanPage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [rotation, setRotation] = useState<string[]>(DEFAULT_ROTATION);
  const [recipes, setRecipes] = useState<WeeklyRecipe[]>([]);
  const [meals, setMeals] = useState<WeeklyPlanMeal[]>([]);
  const [exercises, setExercises] = useState<WeeklyPlanExercise[]>([]);

  // recipe form
  const [recipeForm, setRecipeForm] = useState<WeeklyRecipe>(EMPTY_RECIPE);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [showRecipeForm, setShowRecipeForm] = useState(false);

  // meal form
  const [mealDay, setMealDay] = useState(0);
  const [mealSlot, setMealSlot] = useState('Dinner');
  const [mealDesc, setMealDesc] = useState('');

  // exercise form
  const [exForm, setExForm] = useState<WeeklyPlanExercise>(EMPTY_EXERCISE);
  const [editingExId, setEditingExId] = useState<string | null>(null);

  const weekStart = weekStartOf(fmtDate(new Date()));

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [rotationRes, recipesRes, mealsRes, exRes] = await Promise.all([
        supabase.from('rotation').select('days').eq('user_id', uid).maybeSingle(),
        supabase.from('weekly_recipes').select('*').eq('user_id', uid).order('created_at'),
        supabase.from('weekly_plan_meals').select('*').eq('user_id', uid).order('day_of_week').order('created_at'),
        supabase.from('weekly_plan_exercises').select('*').eq('user_id', uid).order('created_at'),
      ]);
      if (!active) return;
      setRotation((rotationRes.data?.days as string[]) || DEFAULT_ROTATION);
      setRecipes((recipesRes.data as WeeklyRecipe[]) || []);
      setMeals((mealsRes.data as WeeklyPlanMeal[]) || []);
      setExercises((exRes.data as WeeklyPlanExercise[]) || []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user]);

  // ----- rotation -----
  async function updateRotationDay(dayIdx: number, value: string) {
    if (!user) return;
    const next = [...rotation];
    next[dayIdx] = value;
    setRotation(next);
    await supabase.from('rotation').upsert({ user_id: user.id, days: next });
  }

  // ----- recipes -----
  function startEditRecipe(r: WeeklyRecipe) {
    setRecipeForm({ ...r });
    setEditingRecipeId(r.id ?? null);
    setShowRecipeForm(true);
  }

  async function saveRecipe() {
    if (!user || !recipeForm.name.trim()) return;
    const payload = {
      user_id: user.id,
      week_start_date: weekStart,
      name: recipeForm.name.trim(),
      ingredients: recipeForm.ingredients,
      instructions: recipeForm.instructions,
      calories: Number(recipeForm.calories) || 0,
      protein: Number(recipeForm.protein) || 0,
      carbs: Number(recipeForm.carbs) || 0,
      fat: Number(recipeForm.fat) || 0,
      servings: Number(recipeForm.servings) || 1,
    };
    if (editingRecipeId) {
      const { data } = await supabase.from('weekly_recipes').update(payload).eq('id', editingRecipeId).select().single();
      if (data) setRecipes(recipes.map((r) => (r.id === editingRecipeId ? (data as WeeklyRecipe) : r)));
    } else {
      const { data } = await supabase.from('weekly_recipes').insert(payload).select().single();
      if (data) setRecipes([...recipes, data as WeeklyRecipe]);
    }
    setRecipeForm(EMPTY_RECIPE);
    setEditingRecipeId(null);
    setShowRecipeForm(false);
  }

  async function deleteRecipe(id: string | undefined) {
    if (!id) return;
    await supabase.from('weekly_recipes').delete().eq('id', id);
    setRecipes(recipes.filter((r) => r.id !== id));
    if (editingRecipeId === id) { setRecipeForm(EMPTY_RECIPE); setEditingRecipeId(null); setShowRecipeForm(false); }
  }

  // ----- meal plan -----
  async function addMeal() {
    if (!user || !mealDesc.trim()) return;
    const payload = { user_id: user.id, week_start_date: weekStart, day_of_week: mealDay, slot: mealSlot, description: mealDesc.trim() };
    const { data } = await supabase.from('weekly_plan_meals').insert(payload).select().single();
    if (data) {
      setMeals([...meals, data as WeeklyPlanMeal].sort((a, b) => a.day_of_week - b.day_of_week));
    }
    setMealDesc('');
  }

  async function deleteMeal(id: string | undefined) {
    if (!id) return;
    await supabase.from('weekly_plan_meals').delete().eq('id', id);
    setMeals(meals.filter((m) => m.id !== id));
  }

  // ----- exercise plan -----
  function startEditExercise(x: WeeklyPlanExercise) {
    setExForm({ ...x });
    setEditingExId(x.id ?? null);
  }

  async function saveExercise() {
    if (!user || !exForm.name.trim()) return;
    const payload = {
      user_id: user.id,
      week_start_date: weekStart,
      workout_type: exForm.workout_type,
      name: exForm.name.trim(),
      sets: exForm.sets,
      reps: exForm.reps,
      notes: exForm.notes,
      video_url: exForm.video_url.trim(),
    };
    if (editingExId) {
      const { data } = await supabase.from('weekly_plan_exercises').update(payload).eq('id', editingExId).select().single();
      if (data) setExercises(exercises.map((x) => (x.id === editingExId ? (data as WeeklyPlanExercise) : x)));
    } else {
      const { data } = await supabase.from('weekly_plan_exercises').insert(payload).select().single();
      if (data) setExercises([...exercises, data as WeeklyPlanExercise]);
    }
    setExForm({ ...EMPTY_EXERCISE, workout_type: exForm.workout_type });
    setEditingExId(null);
  }

  async function deleteExercise(id: string | undefined) {
    if (!id) return;
    await supabase.from('weekly_plan_exercises').delete().eq('id', id);
    setExercises(exercises.filter((x) => x.id !== id));
    if (editingExId === id) { setExForm(EMPTY_EXERCISE); setEditingExId(null); }
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  const mealsByDay: Record<number, WeeklyPlanMeal[]> = {};
  meals.forEach((m) => { (mealsByDay[m.day_of_week] ||= []).push(m); });

  const exerciseTypes = WORKOUT_TYPES.filter((t) => exercises.some((x) => x.workout_type === t));

  return (
    <>
      <div className="goal-note">
        This is your hand-written plan for the week — recipes, meals, and workout options.
        Update it whenever you like (once a week works well); it stays exactly as you wrote it until you change it.
      </div>

      {/* ---------- rotation ---------- */}
      <div className="card">
        <h3>Workout rotation</h3>
        <div className="sub">Which type of day each weekday is. Today and Movement read from this.</div>
        <div className="week-grid">
          {DAY_NAMES_SHORT.map((d, i) => (
            <div className="week-day" key={d}>
              <div className="d">{d}</div>
              <select value={rotation[i]} onChange={(e) => updateRotationDay(i, e.target.value)}>
                {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- recipes ---------- */}
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ marginBottom: 0 }}>This week&apos;s recipes</h3>
          {!showRecipeForm && (
            <button className="btn btn-teal btn-sm" onClick={() => { setRecipeForm(EMPTY_RECIPE); setEditingRecipeId(null); setShowRecipeForm(true); }}>
              + Add recipe
            </button>
          )}
        </div>
        <div className="sub">Your cook-list for the week. Per-serving macros.</div>

        {showRecipeForm && (
          <div style={{ marginBottom: 14 }}>
            <div className="grid-2">
              <label className="field"><span>Recipe name</span>
                <input type="text" value={recipeForm.name} onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })} placeholder="e.g. Sheet-pan salmon & veg" />
              </label>
              <label className="field"><span>Servings</span>
                <input type="number" min={1} value={recipeForm.servings} onChange={(e) => setRecipeForm({ ...recipeForm, servings: Number(e.target.value) })} />
              </label>
            </div>
            <div className="grid-4">
              <label className="field"><span>Cal</span><input type="number" value={recipeForm.calories || ''} onChange={(e) => setRecipeForm({ ...recipeForm, calories: Number(e.target.value) })} /></label>
              <label className="field"><span>Pro (g)</span><input type="number" value={recipeForm.protein || ''} onChange={(e) => setRecipeForm({ ...recipeForm, protein: Number(e.target.value) })} /></label>
              <label className="field"><span>Carb (g)</span><input type="number" value={recipeForm.carbs || ''} onChange={(e) => setRecipeForm({ ...recipeForm, carbs: Number(e.target.value) })} /></label>
              <label className="field"><span>Fat (g)</span><input type="number" value={recipeForm.fat || ''} onChange={(e) => setRecipeForm({ ...recipeForm, fat: Number(e.target.value) })} /></label>
            </div>
            <label className="field"><span>Ingredients (one per line)</span>
              <textarea rows={4} value={recipeForm.ingredients} onChange={(e) => setRecipeForm({ ...recipeForm, ingredients: e.target.value })} />
            </label>
            <label className="field"><span>Instructions</span>
              <textarea rows={4} value={recipeForm.instructions} onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })} />
            </label>
            <div className="row">
              <button className="btn btn-teal" onClick={saveRecipe}>{editingRecipeId ? 'Save changes' : 'Add recipe'}</button>
              <button className="btn btn-ghost" onClick={() => { setShowRecipeForm(false); setEditingRecipeId(null); setRecipeForm(EMPTY_RECIPE); }}>Cancel</button>
            </div>
          </div>
        )}

        {recipes.length === 0 && !showRecipeForm
          ? <div className="empty-note">No recipes yet — add the ones you&apos;re cooking this week.</div>
          : (
            <div className="recipe-grid">
              {recipes.map((r) => (
                <div className="recipe-card" key={r.id}>
                  <h4>{r.name}</h4>
                  <div className="macros-inline">
                    {r.calories} cal · P{r.protein} C{r.carbs} F{r.fat} · {r.servings} serving{r.servings === 1 ? '' : 's'}
                  </div>
                  {r.ingredients && (
                    <details>
                      <summary>Ingredients</summary>
                      <div className="recipe-body">{r.ingredients}</div>
                    </details>
                  )}
                  {r.instructions && (
                    <details>
                      <summary>Instructions</summary>
                      <div className="recipe-body">{r.instructions}</div>
                    </details>
                  )}
                  <div className="card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEditRecipe(r)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteRecipe(r.id)} style={{ color: 'var(--coral)' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ---------- meal plan ---------- */}
      <div className="card">
        <h3>This week&apos;s meals</h3>
        <div className="sub">A simple day-by-day eating plan. Free text — reference your recipes above.</div>
        <div className="grid-3">
          <label className="field"><span>Day</span>
            <select value={mealDay} onChange={(e) => setMealDay(Number(e.target.value))}>
              {DAY_NAMES_SHORT.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </label>
          <label className="field"><span>Slot</span>
            <select value={mealSlot} onChange={(e) => setMealSlot(e.target.value)}>
              {MEAL_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field"><span>&nbsp;</span>
            <button className="btn btn-teal" style={{ width: '100%', justifyContent: 'center' }} onClick={addMeal}>Add</button>
          </label>
        </div>
        <label className="field"><span>What&apos;s the meal?</span>
          <input type="text" value={mealDesc} onChange={(e) => setMealDesc(e.target.value)} placeholder="e.g. Salmon bowl leftovers + side salad" onKeyDown={(e) => { if (e.key === 'Enter') addMeal(); }} />
        </label>

        {meals.length === 0
          ? <div className="empty-note">No meals planned yet.</div>
          : DAY_NAMES_SHORT.map((d, i) => (
            mealsByDay[i]?.length ? (
              <div key={d}>
                <div className="plan-day-label">{d}</div>
                {mealsByDay[i].map((m) => (
                  <div className="entry" key={m.id}>
                    <span><span className="plan-meal-slot">{m.slot}</span>{m.description}</span>
                    <span className="meta"><button className="del" onClick={() => deleteMeal(m.id)}>&times;</button></span>
                  </div>
                ))}
              </div>
            ) : null
          ))}
      </div>

      {/* ---------- exercise plan ---------- */}
      <div className="card">
        <h3>This week&apos;s exercises</h3>
        <div className="sub">
          Options per workout type. Whatever you list under a type shows up on Today &amp; Movement
          when the rotation lands on that day. Paste a video link if you want a form reference.
        </div>
        <div className="grid-2">
          <label className="field"><span>Workout type</span>
            <select value={exForm.workout_type} onChange={(e) => setExForm({ ...exForm, workout_type: e.target.value })}>
              {WORKOUT_TYPES.filter((t) => t !== 'Rest').map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field"><span>Exercise</span>
            <input type="text" value={exForm.name} onChange={(e) => setExForm({ ...exForm, name: e.target.value })} placeholder="e.g. Incline dumbbell press" />
          </label>
        </div>
        <div className="grid-3">
          <label className="field"><span>Sets</span><input type="text" value={exForm.sets} onChange={(e) => setExForm({ ...exForm, sets: e.target.value })} placeholder="3" /></label>
          <label className="field"><span>Reps</span><input type="text" value={exForm.reps} onChange={(e) => setExForm({ ...exForm, reps: e.target.value })} placeholder="8–10" /></label>
          <label className="field"><span>Notes</span><input type="text" value={exForm.notes} onChange={(e) => setExForm({ ...exForm, notes: e.target.value })} placeholder="optional" /></label>
        </div>
        <label className="field"><span>Video link (optional)</span>
          <input type="url" value={exForm.video_url} onChange={(e) => setExForm({ ...exForm, video_url: e.target.value })} placeholder="https://youtube.com/…" />
        </label>
        <div className="row">
          <button className="btn btn-teal" onClick={saveExercise}>{editingExId ? 'Save changes' : 'Add exercise'}</button>
          {editingExId && <button className="btn btn-ghost" onClick={() => { setEditingExId(null); setExForm(EMPTY_EXERCISE); }}>Cancel</button>}
        </div>

        {exercises.length === 0
          ? <div className="empty-note" style={{ marginTop: 10 }}>No exercises planned yet.</div>
          : exerciseTypes.map((t) => (
            <div key={t} style={{ marginTop: 16 }}>
              <span className="type-chip">{t}</span>
              {exercises.filter((x) => x.workout_type === t).map((x) => (
                <div className="exercise-option" key={x.id}>
                  <div>
                    <div className="ex-name">{x.name}</div>
                    {(x.sets || x.reps) && <div className="ex-detail">{x.sets || '—'} × {x.reps || '—'}</div>}
                    {x.notes && <div className="ex-notes">{x.notes}</div>}
                  </div>
                  <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    {x.video_url && <a className="watch-link" href={x.video_url} target="_blank" rel="noopener noreferrer">▶ Watch</a>}
                    <button className="btn btn-ghost btn-sm" onClick={() => startEditExercise(x)}>Edit</button>
                    <button className="del" style={{ background: 'none', border: 'none', fontSize: 16, color: 'var(--ink-faint)' }} onClick={() => deleteExercise(x.id)}>&times;</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
