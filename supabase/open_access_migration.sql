-- One-time migration for an EXISTING live database, run in the Supabase SQL
-- Editor. Converts the auth-scoped schema to the no-login, open-access setup.
--
-- !! WARNING !! After section 3 runs, anyone with the project URL + anon key
-- (both public in the app's JS bundle) can read and write every row,
-- including the health log. This is irreversible exposure once deployed.

-- ---------- 1. drop the foreign keys to auth.users ----------
-- The app now writes a fixed constant UUID (lib/singleUser.ts) that has no
-- matching row in auth.users; without this, every insert fails.
alter table goals                 drop constraint if exists goals_user_id_fkey;
alter table meals                 drop constraint if exists meals_user_id_fkey;
alter table water_entries         drop constraint if exists water_entries_user_id_fkey;
alter table weights               drop constraint if exists weights_user_id_fkey;
alter table steps                 drop constraint if exists steps_user_id_fkey;
alter table rotation              drop constraint if exists rotation_user_id_fkey;
alter table workout_logs          drop constraint if exists workout_logs_user_id_fkey;
alter table schedule              drop constraint if exists schedule_user_id_fkey;
alter table sleep_logs            drop constraint if exists sleep_logs_user_id_fkey;
alter table health_logs           drop constraint if exists health_logs_user_id_fkey;
alter table weekly_recipes        drop constraint if exists weekly_recipes_user_id_fkey;
alter table weekly_plan_meals     drop constraint if exists weekly_plan_meals_user_id_fkey;
alter table weekly_plan_exercises drop constraint if exists weekly_plan_exercises_user_id_fkey;

-- ---------- 2. re-point existing rows at the fixed single-user id ----------
-- Existing rows carry your old Supabase auth user's UUID; the app now
-- queries by this constant instead. Skipping this hides all existing data.
update goals                 set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update meals                 set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update water_entries         set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update weights               set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update steps                 set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update rotation              set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update workout_logs          set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update schedule              set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update sleep_logs            set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update health_logs           set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update weekly_recipes        set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update weekly_plan_meals     set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
update weekly_plan_exercises set user_id = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';

-- ---------- 3. replace the auth-scoped policies with open access ----------
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
