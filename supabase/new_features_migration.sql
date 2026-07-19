-- One-time migration for the July 2026 feature batch (Journal, Draw/gallery,
-- avatar & background settings). Run this whole file in the Supabase SQL
-- Editor. Safe to re-run (create if not exists / on conflict / drop if exists).
--
-- Access pattern matches the rest of the app: OPEN. No authentication —
-- anyone with the project URL + anon key can read and write all of this,
-- and the gallery bucket is fully public (images viewable by bare URL).

-- ---------- journal ----------
create table if not exists journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  date date not null,
  body text not null,
  created_at timestamptz default now()
);
create index if not exists journal_user_date_idx on journal_entries (user_id, date);
alter table journal_entries enable row level security;
drop policy if exists "open access" on journal_entries;
create policy "open access" on journal_entries for all using (true) with check (true);

-- ---------- profile (height, avatar, background carousel setting) ----------
create table if not exists profile (
  user_id uuid primary key,
  height_in numeric,
  avatar_path text,
  bg_carousel boolean default false,
  updated_at timestamptz default now()
);
alter table profile enable row level security;
drop policy if exists "open access" on profile;
create policy "open access" on profile for all using (true) with check (true);

-- ---------- storage: public 'gallery' bucket for drawings & photos ----------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "gallery open read" on storage.objects;
drop policy if exists "gallery open insert" on storage.objects;
drop policy if exists "gallery open update" on storage.objects;
drop policy if exists "gallery open delete" on storage.objects;
create policy "gallery open read"   on storage.objects for select using (bucket_id = 'gallery');
create policy "gallery open insert" on storage.objects for insert with check (bucket_id = 'gallery');
create policy "gallery open update" on storage.objects for update using (bucket_id = 'gallery') with check (bucket_id = 'gallery');
create policy "gallery open delete" on storage.objects for delete using (bucket_id = 'gallery');
