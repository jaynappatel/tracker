'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate } from '@/lib/dateHelpers';

interface HealthState {
  glp1: boolean;
  birth_control: boolean;
  period: boolean;
  sex: boolean;
}

const DEFAULT_HEALTH: HealthState = { glp1: false, birth_control: false, period: false, sex: false };

export default function HealthPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [health, setHealth] = useState<HealthState>(DEFAULT_HEALTH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('health_logs').select('*').eq('user_id', user!.id).eq('date', date).maybeSingle();
      if (!active) return;
      setHealth(data ? (data as any) : DEFAULT_HEALTH);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, date]);

  async function toggle(key: keyof HealthState, value: boolean) {
    if (!user) return;
    const next = { ...health, [key]: value };
    setHealth(next);
    await supabase.from('health_logs').upsert({ user_id: user.id, date, ...next });
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <div className="card">
      <h3>Health log — {niceDate(date)}</h3>
      <ToggleRow name="GLP-1 shot" note="Weekly dose" checked={health.glp1} onChange={(v) => toggle('glp1', v)} />
      <ToggleRow name="Birth control" note="Daily" checked={health.birth_control} onChange={(v) => toggle('birth_control', v)} />
      <ToggleRow name="Period" note="Mark days of your cycle" checked={health.period} onChange={(v) => toggle('period', v)} />
      <ToggleRow name="Sex" checked={health.sex} onChange={(v) => toggle('sex', v)} />
    </div>
  );
}

function ToggleRow({ name, note, checked, onChange }: { name: string; note?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="name">{name}</div>
        {note && <div className="note">{note}</div>}
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" />
      </label>
    </div>
  );
}
