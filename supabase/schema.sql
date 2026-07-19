-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- It creates one table per section of the app.
--
-- !! NO ACCESS CONTROL !! There is no login and the RLS policies below allow
-- everything. Anyone with the Supabase project URL and anon key (both shipped
-- in the app's public JS bundle) can read and write every row here, including
-- the health log. The user_id column remains only because the app keys rows
-- by a fixed constant UUID (lib/singleUser.ts) — it protects nothing.

create extension if not exists "pgcrypto";

-- ---------- goals (one row per user) ----------
create table if not exists goals (
  user_id uuid primary key,
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
  user_id uuid not null,
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
  user_id uuid not null,
  date date not null,
  oz int not null,
  logged_at timestamptz default now()
);
create index if not exists water_user_date_idx on water_entries (user_id, date);

-- ---------- weight check-ins ----------
create table if not exists weights (
  user_id uuid not null,
  date date not null,
  weight_lb numeric not null,
  primary key (user_id, date)
);

-- ---------- steps ----------
create table if not exists steps (
  user_id uuid not null,
  date date not null,
  count int not null,
  primary key (user_id, date)
);

-- ---------- weekly workout rotation (one row per user) ----------
create table if not exists rotation (
  user_id uuid primary key,
  days jsonb not null default '["Rest","Push","Pull","Legs","Rest","Full Body","Cardio"]'
);

-- ---------- workout logs ----------
create table if not exists workout_logs (
  user_id uuid not null,
  date date not null,
  type text,
  done boolean default false,
  exercises jsonb default '[]',
  primary key (user_id, date)
);

-- ---------- work schedule ----------
create table if not exists schedule (
  user_id uuid not null,
  date date not null,
  work_start time,
  work_end time,
  primary key (user_id, date)
);

-- ---------- sleep ----------
create table if not exists sleep_logs (
  user_id uuid not null,
  date date not null,
  hours numeric,
  quality text,
  primary key (user_id, date)
);

-- ---------- health log: GLP-1, birth control, period, sex ----------
create table if not exists health_logs (
  user_id uuid not null,
  date date not null,
  glp1 boolean default false,
  birth_control boolean default false,
  period boolean default false,
  sex boolean default false,
  primary key (user_id, date)
);

-- ---------- weekly plan: recipes ----------
-- Manually entered once a week (Jayna writes these herself, e.g. with Claude
-- in a separate chat, then pastes them in). Rows persist until edited/deleted
-- — nothing in the app regenerates them.
create table if not exists weekly_recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  week_start_date date,
  name text not null,
  ingredients text default '',
  instructions text default '',
  calories int default 0,
  protein int default 0,
  carbs int default 0,
  fat int default 0,
  servings int default 1,
  created_at timestamptz default now()
);
create index if not exists weekly_recipes_user_idx on weekly_recipes (user_id, week_start_date);

-- ---------- weekly plan: meals (what to eat, day by day) ----------
create table if not exists weekly_plan_meals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  week_start_date date,
  day_of_week int not null default 0, -- 0=Sun .. 6=Sat
  slot text default 'Dinner',         -- Breakfast / Lunch / Dinner / Snack
  description text not null,
  created_at timestamptz default now()
);
create index if not exists weekly_plan_meals_user_idx on weekly_plan_meals (user_id, week_start_date);

-- ---------- weekly plan: exercises (options per workout type) ----------
-- The Movement/Today pages surface the rows whose workout_type matches the
-- rotation's type for that day. video_url is an optional pasted link
-- (YouTube / Instagram / anything).
create table if not exists weekly_plan_exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  week_start_date date,
  workout_type text not null default 'Full Body',
  name text not null,
  sets text default '',
  reps text default '',
  notes text default '',
  video_url text default '',
  created_at timestamptz default now()
);
create index if not exists weekly_plan_exercises_user_idx on weekly_plan_exercises (user_id, workout_type);

-- ================= ROW LEVEL SECURITY: OPEN =================
-- RLS stays enabled but every policy allows everything to everyone.
-- This is deliberate (no-login personal app) and means the anon key grants
-- full read/write on all rows. There is no protection on this data.

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
alter table weekly_recipes enable row level security;
alter table weekly_plan_meals enable row level security;
alter table weekly_plan_exercises enable row level security;

drop policy if exists "own rows only" on goals;
drop policy if exists "own rows only" on meals;
drop policy if exists "own rows only" on water_entries;
drop policy if exists "own rows only" on weights;
drop policy if exists "own rows only" on steps;
drop policy if exists "own rows only" on rotation;
drop policy if exists "own rows only" on workout_logs;
drop policy if exists "own rows only" on schedule;
drop policy if exists "own rows only" on sleep_logs;
drop policy if exists "own rows only" on health_logs;
drop policy if exists "own rows only" on weekly_recipes;
drop policy if exists "own rows only" on weekly_plan_meals;
drop policy if exists "own rows only" on weekly_plan_exercises;

create policy "open access" on goals for all using (true) with check (true);
create policy "open access" on meals for all using (true) with check (true);
create policy "open access" on water_entries for all using (true) with check (true);
create policy "open access" on weights for all using (true) with check (true);
create policy "open access" on steps for all using (true) with check (true);
create policy "open access" on rotation for all using (true) with check (true);
create policy "open access" on workout_logs for all using (true) with check (true);
create policy "open access" on schedule for all using (true) with check (true);
create policy "open access" on sleep_logs for all using (true) with check (true);
create policy "open access" on health_logs for all using (true) with check (true);
create policy "open access" on weekly_recipes for all using (true) with check (true);
create policy "open access" on weekly_plan_meals for all using (true) with check (true);
create policy "open access" on weekly_plan_exercises for all using (true) with check (true);
