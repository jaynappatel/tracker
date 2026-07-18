'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { DEFAULT_GOALS, Goals } from '@/lib/types';

export default function GoalsPage() {
  const user = useUser();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('goals').select('*').eq('user_id', user!.id).maybeSingle();
      if (!active) return;
      if (data) setGoals(data as Goals);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user]);

  function update<K extends keyof Goals>(key: K, value: Goals[K]) {
    setGoals({ ...goals, [key]: value });
    setSaved(false);
  }

  async function save() {
    if (!user) return;
    await supabase.from('goals').upsert({ user_id: user.id, ...goals });
    setSaved(true);
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <>
      <div className="card">
        <h3>Your goals</h3>
        <div className="sub">Everything on Today and Weekly is measured against these.</div>
        <div className="grid-2">
          <label className="field"><span>Calorie goal (cal)</span><input type="number" value={goals.calorie_goal} onChange={(e) => update('calorie_goal', Number(e.target.value))} /></label>
          <label className="field"><span>Water goal (oz)</span><input type="number" value={goals.water_goal_oz} onChange={(e) => update('water_goal_oz', Number(e.target.value))} /></label>
        </div>
        <div className="grid-3">
          <label className="field"><span>Protein (g)</span><input type="number" value={goals.protein_goal} onChange={(e) => update('protein_goal', Number(e.target.value))} /></label>
          <label className="field"><span>Carbs (g)</span><input type="number" value={goals.carb_goal} onChange={(e) => update('carb_goal', Number(e.target.value))} /></label>
          <label className="field"><span>Fat (g)</span><input type="number" value={goals.fat_goal} onChange={(e) => update('fat_goal', Number(e.target.value))} /></label>
        </div>
        <div className="grid-2">
          <label className="field"><span>Step goal</span><input type="number" value={goals.step_goal} onChange={(e) => update('step_goal', Number(e.target.value))} /></label>
          <label className="field"><span>Sleep goal (hrs)</span><input type="number" step="0.5" value={goals.sleep_goal_hrs} onChange={(e) => update('sleep_goal_hrs', Number(e.target.value))} /></label>
        </div>
        <label className="field"><span>Weight goal (lbs, optional)</span>
          <input type="number" value={goals.weight_goal_lb ?? ''} onChange={(e) => update('weight_goal_lb', e.target.value ? Number(e.target.value) : null)} />
        </label>
        <button className="btn btn-teal" onClick={save}>Save goals</button>
        {saved && <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--teal)' }}>Saved ✓</span>}
      </div>
      <div className="goal-note">
        Everything you log here — meals, water, birth control, period, GLP-1, sex — is stored in your own Supabase database, protected by row-level security so only your signed-in account can read it. The recipe generator is the only feature that talks to an outside service, and it only ever sends your grocery list text.
      </div>
    </>
  );
}
