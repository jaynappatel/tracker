'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { DEFAULT_GOALS, Goals, WaterEntry } from '@/lib/types';
import { ProgressBar } from '@/components/Widgets';

export default function WaterPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [customOz, setCustomOz] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [goalsRes, entriesRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('water_entries').select('*').eq('user_id', uid).eq('date', date).order('logged_at', { ascending: false }),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      setEntries((entriesRes.data as WaterEntry[]) || []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, date]);

  async function addOz(amount: number) {
    if (!user || amount <= 0) return;
    const { data } = await supabase.from('water_entries').insert({ user_id: user.id, date, oz: amount }).select().single();
    if (data) setEntries([data as WaterEntry, ...entries]);
  }

  async function removeEntry(id: string | undefined, idx: number) {
    if (id) await supabase.from('water_entries').delete().eq('id', id);
    setEntries(entries.filter((_, i) => i !== idx));
  }

  if (loading) return <div className="empty-note">Loading…</div>;
  const totalOz = entries.reduce((sum, e) => sum + e.oz, 0);

  return (
    <>
      <div className="card">
        <h3>Water — {totalOz} / {goals.water_goal_oz} oz</h3>
        <ProgressBar value={totalOz} goal={goals.water_goal_oz} />
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => addOz(8)}>+8 oz</button>
          <button className="btn btn-ghost" onClick={() => addOz(16)}>+16 oz</button>
          <button className="btn btn-ghost" onClick={() => addOz(24)}>+24 oz</button>
          <input type="number" placeholder="custom" style={{ maxWidth: 90 }} value={customOz} onChange={(e) => setCustomOz(e.target.value)} />
          <button className="btn btn-teal" onClick={() => { addOz(Number(customOz)); setCustomOz(''); }}>Add</button>
        </div>
      </div>
      <div className="card">
        <h3>Log</h3>
        <div className="entry-list">
          {entries.length === 0
            ? <div className="empty-note">No water logged yet today.</div>
            : entries.map((e, i) => (
              <div className="entry" key={e.id ?? i}>
                <span>{e.oz} oz</span>
                <span className="meta">
                  {e.logged_at ? new Date(e.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  <button className="del" onClick={() => removeEntry(e.id, i)}>&times;</button>
                </span>
              </div>
            ))}
        </div>
      </div>
      <div className="card">
        <h3>Reminders</h3>
        <div className="sub">This app can't send push notifications on its own — set a couple of alarms on your phone as a backup, every 2 hours during the day works well for both water and meals.</div>
      </div>
    </>
  );
}
