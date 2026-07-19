'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { useSelectedDate } from '@/lib/useSelectedDate';
import { niceDate } from '@/lib/dateHelpers';
import { JournalEntry } from '@/lib/types';

export default function JournalPage() {
  const { date } = useSelectedDate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', SINGLE_USER_ID)
        .eq('date', date)
        .order('created_at');
      if (!active) return;
      setEntries((data as JournalEntry[]) || []);
      setEditingId(null);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [date]);

  async function addEntry() {
    if (!draft.trim()) return;
    const { data } = await supabase
      .from('journal_entries')
      .insert({ user_id: SINGLE_USER_ID, date, body: draft.trim() })
      .select()
      .single();
    if (data) setEntries([...entries, data as JournalEntry]);
    setDraft('');
  }

  async function saveEdit(id: string) {
    if (!editDraft.trim()) return;
    const { data } = await supabase
      .from('journal_entries')
      .update({ body: editDraft.trim() })
      .eq('id', id)
      .select()
      .single();
    if (data) setEntries(entries.map((e) => (e.id === id ? (data as JournalEntry) : e)));
    setEditingId(null);
  }

  async function deleteEntry(id: string | undefined) {
    if (!id) return;
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(entries.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function timeOf(e: JournalEntry) {
    return e.created_at
      ? new Date(e.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : '';
  }

  if (loading) return <div className="empty-note">Loading…</div>;

  return (
    <>
      <div className="card">
        <h3>Journal — {niceDate(date)}</h3>
        <div className="sub">Whatever&apos;s on your mind. Each save is its own entry.</div>
        <textarea
          rows={5}
          placeholder="Dear diary…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-teal" style={{ marginTop: 10 }} onClick={addEntry} disabled={!draft.trim()}>
          Save entry
        </button>
      </div>

      <div className="card">
        <h3>Entries this day</h3>
        {entries.length === 0
          ? <div className="empty-note">Nothing written for this day yet.</div>
          : entries.map((e) => (
            <div className="journal-entry" key={e.id}>
              <div className="stamp-time">{timeOf(e)}</div>
              {editingId === e.id ? (
                <>
                  <textarea rows={4} value={editDraft} onChange={(ev) => setEditDraft(ev.target.value)} style={{ margin: '8px 0' }} />
                  <div className="entry-actions">
                    <button className="btn btn-teal btn-sm" onClick={() => saveEdit(e.id!)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="body-text">{e.body}</div>
                  <div className="entry-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(e.id ?? null); setEditDraft(e.body); }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deleteEntry(e.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
      </div>
    </>
  );
}
