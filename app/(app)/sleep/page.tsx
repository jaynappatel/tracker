'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate } from '@/lib/dateHelpers';
import { DEFAULT_GOALS, Goals } from '@/lib/types';

const QUALITIES = ['Poor', 'Fair', 'Good', 'Great'];

export default function SleepPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('Good');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [goalsRes, sleepRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', uid).maybeSingle(),
        supabase.from('sleep_logs').select('*').eq('user_id', uid).eq('date', date).maybeSingle(),
      ]);
      if (!active) return;
      if (goalsRes.data) setGoals(goalsRes.data as Goals);
      const s = sleepRes.data as any;
      setHours(s ? String(s.hours) : '');
      setQuality(s?.quality || 'Good');
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, date]);

  async function save() {
    if (!user || !hours) return;
    await supabase.from('sleep_logs').upsert({ user_id: user.id, date, hours: Number(hours), quality });
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <div className="card">
      <h3>Sleep — {niceDate(date)}</h3>
      <label className="field"><span>Hours slept</span>
        <input type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 7.5" />
      </label>
      <label className="field"><span>Quality</span>
        <div className="pill-toggle">
          {QUALITIES.map((q) => (
            <button key={q} className={quality === q ? 'active' : ''} onClick={() => setQuality(q)} type="button">{q}</button>
          ))}
        </div>
      </label>
      <button className="btn btn-teal" onClick={save} style={{ marginTop: 6 }}>Save</button>
      <div className="sub" style={{ marginTop: 12 }}>Goal: {goals.sleep_goal_hrs} hrs</div>
    </div>
  );
}
