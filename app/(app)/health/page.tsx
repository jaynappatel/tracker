'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate, parseDate } from '@/lib/dateHelpers';
import BodySilhouette from '@/components/BodySilhouette';
import { DEFAULT_PROFILE, Profile } from '@/lib/types';
import { GalleryImage, galleryUrl, listGalleryImages } from '@/lib/gallery';

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
  const { date } = useSelectedDate();
  const [health, setHealth] = useState<HealthState>(DEFAULT_HEALTH);
  const [weights, setWeights] = useState<WeightRow[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [weightSaved, setWeightSaved] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [picking, setPicking] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const uid = SINGLE_USER_ID;
      const [healthRes, weightsRes, profileRes] = await Promise.all([
        supabase.from('health_logs').select('*').eq('user_id', uid).eq('date', date).maybeSingle(),
        supabase.from('weights').select('date, weight_lb').eq('user_id', uid).order('date').limit(120),
        supabase.from('profile').select('*').eq('user_id', uid).maybeSingle(),
      ]);
      if (!active) return;
      setHealth(healthRes.data ? (healthRes.data as any) : DEFAULT_HEALTH);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      const rows = (weightsRes.data as WeightRow[]) || [];
      setWeights(rows);
      setWeightInput(String(rows.find((w) => w.date === date)?.weight_lb ?? ''));
      setWeightSaved(false);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  async function toggle(key: keyof HealthState, value: boolean) {
    const next = { ...health, [key]: value };
    setHealth(next);
    await supabase.from('health_logs').upsert({ user_id: SINGLE_USER_ID, date, ...next });
  }

  async function saveWeight() {
    if (!weightInput) return;
    const weight_lb = Number(weightInput);
    if (!weight_lb) return;
    await supabase.from('weights').upsert({ user_id: SINGLE_USER_ID, date, weight_lb });
    const next = weights.filter((w) => w.date !== date);
    next.push({ date, weight_lb });
    next.sort((a, b) => (a.date < b.date ? -1 : 1));
    setWeights(next);
    setWeightSaved(true);
  }

  async function openPicker() {
    setPicking(true);
    if (gallery === null) setGallery(await listGalleryImages());
  }

  async function chooseAvatar(name: string | null) {
    const next = { ...profile, avatar_path: name };
    setProfile(next);
    setPicking(false);
    await supabase.from('profile').upsert({ user_id: SINGLE_USER_ID, ...next });
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
          {profile.avatar_path ? (
            // custom avatar gets the same gentle trend response as the
            // sketch figure: a few percent of horizontal scale
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="avatar-img"
              src={galleryUrl(profile.avatar_path)}
              alt="your avatar"
              style={{ transform: `scale(${Math.min(1.08, Math.max(0.92, trend?.factor ?? 1))}, 1)` }}
            />
          ) : (
            <BodySilhouette factor={trend?.factor ?? 1} />
          )}
          <div className="body-copy">
            <div className="trend-num">{latestWeight != null ? `${latestWeight} lb` : '—'}</div>
            <div className="trend-note">{trendNote}</div>
            {profile.height_in != null && (
              <div className="trend-note">Height: {Math.floor(profile.height_in / 12)}&prime;{Math.round(profile.height_in % 12)}&Prime;</div>
            )}
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
            <div className="row" style={{ marginTop: 10 }}>
              {!picking && (
                <button className="btn btn-ghost btn-sm" onClick={openPicker}>
                  {profile.avatar_path ? 'Change avatar' : 'Use one of your drawings as your avatar'}
                </button>
              )}
              {profile.avatar_path && !picking && (
                <button className="btn btn-ghost btn-sm" onClick={() => chooseAvatar(null)}>Back to the sketch figure</button>
              )}
            </div>
          </div>
        </div>
        {picking && (
          <div style={{ marginTop: 14 }}>
            <div className="sub" style={{ margin: 0 }}>Pick from your gallery (draw more on the Draw tab):</div>
            {gallery === null
              ? <div className="empty-note">Loading gallery…</div>
              : gallery.length === 0
                ? <div className="empty-note">No saved drawings or photos yet — visit the Draw tab first.</div>
                : (
                  <div className="gallery-grid">
                    {gallery.map((img) => (
                      <button
                        className={`gallery-item ${profile.avatar_path === img.name ? 'selected' : ''}`}
                        key={img.name}
                        onClick={() => chooseAvatar(img.name)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.name} loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setPicking(false)}>Close</button>
          </div>
        )}
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
