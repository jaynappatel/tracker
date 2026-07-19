'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate, to12h } from '@/lib/dateHelpers';

export default function SchedulePage() {
  const { date } = useSelectedDate();
  const [workStart, setWorkStart] = useState('');
  const [workEnd, setWorkEnd] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('schedule').select('*').eq('user_id', SINGLE_USER_ID).eq('date', date).maybeSingle();
      if (!active) return;
      setWorkStart(data ? (data as any).work_start?.slice(0, 5) || '' : '');
      setWorkEnd(data ? (data as any).work_end?.slice(0, 5) || '' : '');
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  async function save() {
    await supabase.from('schedule').upsert({ user_id: SINGLE_USER_ID, date, work_start: workStart || null, work_end: workEnd || null });
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  let suggestion = 'Set your work hours to get a suggested workout window.';
  if (workStart && workEnd) {
    const [eh, em] = workEnd.split(':').map(Number);
    let suggestH = eh + 1;
    if (suggestH >= 24) suggestH -= 24;
    const timeStr = `${String(suggestH).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
    suggestion = `Best window today: around ${to12h(timeStr)} — an hour after work ends, so you're not lifting on a completely empty tank or rushing straight from your desk.`;
  }

  return (
    <>
      <div className="card">
        <h3>Work hours — {niceDate(date)}</h3>
        <div className="grid-2">
          <label className="field"><span>Start</span><input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} /></label>
          <label className="field"><span>End</span><input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} /></label>
        </div>
        <button className="btn btn-teal" onClick={save}>Save</button>
      </div>
      <div className="card">
        <h3>Suggested workout window</h3>
        <p style={{ margin: 0, fontSize: 14 }}>{suggestion}</p>
      </div>
    </>
  );
}
