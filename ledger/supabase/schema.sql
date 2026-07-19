-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- It creates one table per section of the app, all scoped to a single user
-- via row-level security, so even with the public anon key, nobody but the
-- signed-in owner can read or write these rows.

create extension if not exists "pgcrypto";

-- ---------- goals (one row per user) ----------
create table if not exists goals (
  user_id uuid references auth.users on delete cascade primary key,
  calorie_goal int default 2000,
  protein_goal int default 150,
  carb_goal int default 200,
  fat_goal int default 60,
  water_goal_oz int default 100,
  step_goal int default 10000,
  sleep_goal_hrs numeric default 8,
  weight_goal_lb numeric,
  updated_at timestamptz default now()
);

-- ---------- meals (many rows per day) ----------
create table if not exists meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  name text not null,
  calories int default 0,
  protein int default 0,
  carbs int default 0,
  fat int default 0,
  created_at timestamptz default now()
);
create index if not exists meals_user_date_idx on meals (user_id, date);

-- ---------- water entries ----------
create table if not exists water_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  oz int not null,
  logged_at timestamptz default now()
);
create index if not exists water_user_date_idx on water_entries (user_id, date);

-- ---------- weight check-ins ----------
create table if not exists weights (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  weight_lb numeric not null,
  primary key (user_id, date)
);

-- ---------- steps ----------
create table if not exists steps (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  count int not null,
  primary key (user_id, date)
);

-- ---------- weekly workout rotation (one row per user) ----------
create table if not exists rotation (
  user_id uuid references auth.users on delete cascade primary key,
  days jsonb not null default '["Rest","Push","Pull","Legs","Rest","Full Body","Cardio"]'
);

-- ---------- workout logs ----------
create table if not exists workout_logs (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  type text,
  done boolean default false,
  exercises jsonb default '[]',
  primary key (user_id, date)
);

-- ---------- work schedule ----------
create table if not exists schedule (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  work_start time,
  work_end time,
  primary key (user_id, date)
);

-- ---------- sleep ----------
create table if not exists sleep_logs (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  hours numeric,
  quality text,
  primary key (user_id, date)
);

-- ---------- health log: GLP-1, birth control, period, sex ----------
create table if not exists health_logs (
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  glp1 boolean default false,
  birth_control boolean default false,
  period boolean default false,
  sex boolean default false,
  primary key (user_id, date)
);

-- ================= ROW LEVEL SECURITY =================
-- Every table: enable RLS, then allow a user full access to rows where
-- user_id = their own auth id, and nothing else. This is what makes it
-- safe to put the anon key in client-side code.

alter table goals enable row level security;
alter table meals enable row level security;
alter table water_entries enable row level security;
alter table weights enable row level security;
alter table steps enable row level security;
alter table rotation enable row level security;
alter table workout_logs enable row level security;
alter table schedule enable row level security;
alter table sleep_logs enable row level security;
alter table health_logs enable row level security;

create policy "own rows only" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on meals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on water_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on weights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on steps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on rotation for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on workout_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on sleep_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows only" on health_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
