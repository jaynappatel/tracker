'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/AuthContext';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate, parseDate } from '@/lib/dateHelpers';
import BodySilhouette from '@/components/BodySilhouette';

interface HealthState {
  glp1: boolean;
  birth_control: boolean;
  period: boolean;
  sex: boolean;
}

interface WeightRow {
  date: string;
  weight_lb: number;
}

const DEFAULT_HEALTH: HealthState = { glp1: false, birth_control: false, period: false, sex: false };

// Compare the latest check-in to one from roughly two weeks earlier (or the
// oldest we have) to get a gentle trend, then nudge the silhouette's width
// by a fraction of a percent per pound. Subtle on purpose.
function weightTrend(weights: WeightRow[]) {
  if (weights.length < 2) return null;
  const latest = weights[weights.length - 1];
  const latestTime = parseDate(latest.date).getTime();
  const twoWeeksBefore = latestTime - 14 * 24 * 3600 * 1000;
  let baseline = weights[0];
  for (const w of weights) {
    if (parseDate(w.date).getTime() <= twoWeeksBefore) baseline = w;
    else break;
  }
  if (baseline.date === latest.date) baseline = weights[0];
  const delta = latest.weight_lb - baseline.weight_lb;
  const spanDays = Math.max(1, Math.round((latestTime - parseDate(baseline.date).getTime()) / (24 * 3600 * 1000)));
  return { latest, delta, spanDays, factor: 1 + delta * 0.006 };
}

export default function HealthPage() {
  const user = useUser();
  const { date } = useSelectedDate();
  const [health, setHealth] = useState<HealthState>(DEFAULT_HEALTH);
  const [weights, setWeights] = useState<WeightRow[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      setLoading(true);
      const uid = user!.id;
      const [healthRes, weightsRes] = await Promise.all([
        supabase.from('health_logs').select('*').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('weights').select('date, weight_lb').eq('user_id', uid).order('date').limit(120),
      ]);
      if (!active) return;
      setHealth(healthRes.data ? (healthRes.data as any) : DEFAULT_HEALTH);
      const rows = (weightsRes.data as WeightRow[]) || [];
      setWeights(rows);
      setWeightInput(String(rows.find((w) => w.date === date)?.weight_lb ?? ''));
      setWeightSaved(false);
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

  async function saveWeight() {
    if (!user || !weightInput) return;
    const weight_lb = Number(weightInput);
    if (!weight_lb) return;
    await supabase.from('weights').upsert({ user_id: user.id, date, weight_lb });
    const next = weights.filter((w) => w.date !== date);
    next.push({ date, weight_lb });
    next.sort((a, b) => (a.date < b.date ? -1 : 1));
    setWeights(next);
    setWeightSaved(true);
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  const trend = weightTrend(weights);
  const latestWeight = weights.length ? weights[weights.length - 1].weight_lb : null;

  let trendNote = 'Log a weight most days and the little figure will quietly follow your trend.';
  let trendTag: string | null = null;
  if (trend) {
    const lbs = Math.abs(trend.delta).toFixed(1);
    if (trend.delta <= -0.5) {
      trendNote = `Down ${lbs} lb over the last ${trend.spanDays} days — steady work, and it shows.`;
      trendTag = 'trending down';
    } else if (trend.delta >= 0.5) {
      trendNote = `Up ${lbs} lb over the last ${trend.spanDays} days. Trends wobble — showing up is the win.`;
      trendTag = 'trending up';
    } else {
      trendNote = `Holding steady over the last ${trend.spanDays} days.`;
      trendTag = 'steady';
    }
  }

  return (
    <>
      <div className="card">
        <h3>Body check-in</h3>
        <div className="sub">A daily weigh-in, just for the trend line — the figure shifts gently with it.</div>
        <div className="body-viz">
          <BodySilhouette factor={trend?.factor ?? 1} />
          <div className="body-copy">
            <div className="trend-num">{latestWeight != null ? `${latestWeight} lb` : '—'}</div>
            <div className="trend-note">{trendNote}</div>
            {trendTag && <span className="trend-tag">{trendTag}</span>}
            <div className="row" style={{ marginTop: 14 }}>
              <input
                type="number"
                step="0.1"
                placeholder="lbs today"
                style={{ maxWidth: 120 }}
                value={weightInput}
                onChange={(e) => { setWeightInput(e.target.value); setWeightSaved(false); }}
              />
              <button className="btn btn-teal" onClick={saveWeight}>Save</button>
              {weightSaved && <span style={{ fontSize: 12, color: 'var(--teal)' }}>Saved ✓</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Health log — {niceDate(date)}</h3>
        <ToggleRow name="GLP-1 shot" note="Weekly dose" checked={health.glp1} onChange={(v) => toggle('glp1', v)} />
        <ToggleRow name="Birth control" note="Daily" checked={health.birth_control} onChange={(v) => toggle('birth_control', v)} />
        <ToggleRow name="Period" note="Mark days of your cycle" checked={health.period} onChange={(v) => toggle('period', v)} />
        <ToggleRow name="Sex" checked={health.sex} onChange={(v) => toggle('sex', v)} />
      </div>
    </>
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
