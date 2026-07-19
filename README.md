# Jayna's Life

A personal food, movement, body, and cycle tracker (formerly "Ledger"). Next.js + Supabase, deployed on Vercel.

> ⚠️ **This app has no authentication of any kind.** There is no login screen and no
> access control. Anyone who obtains the deployed URL — or the Supabase project URL
> and anon key, which are embedded in the app's public JavaScript — can **read and
> write all data**, including the health log (GLP-1, birth control, period, sex).
> Secrecy of the URL is the only barrier, and the Supabase API endpoint is reachable
> without ever visiting the app. Deploy only if you accept that.

## What's in here

- `app/` — every page: today, nutrition, water, movement, plan, schedule, sleep, health, journal, draw, weekly summary, goals
- `supabase/schema.sql` — the database schema, run once in Supabase (fresh installs)
- `supabase/open_access_migration.sql` — one-time migration for a database created under the old auth-based schema
- `supabase/new_features_migration.sql` — one-time migration adding the journal & profile tables and the public `gallery` storage bucket (July 2026 features)
- `lib/`, `components/` — shared code (Supabase client, date helpers, gallery/storage helpers, nav)

## One-time setup

### 1. Supabase (free tier is enough)

1. Go to supabase.com, create a project.
2. In the SQL Editor, paste in the contents of `supabase/schema.sql` and run it. (If your project was set up under the old auth-based schema, run `supabase/open_access_migration.sql` instead — it drops the auth constraints, re-points existing rows, and opens the access policies.)
3. In Project Settings > API, copy the **Project URL** and the **anon public key**.

No Supabase Auth setup is needed — the app doesn't sign in to anything.

For the Draw tab's gallery, the database also needs the **public `gallery` storage bucket** — `supabase/new_features_migration.sql` creates it (plus the journal/profile tables) if your project predates those features; fresh installs get the tables from `schema.sql` but still need the bucket section of that migration file (storage buckets aren't part of the schema file).

### 2. Local development

```
npm install
cp .env.local.example .env.local
# fill in the Supabase URL + anon key
npm run dev
```

Visit `localhost:3000` — it loads straight into the app, no login.

### 3. Deploy to Vercel

Same pattern as topwater-workflow:

1. Push this folder to a new GitHub repo.
2. In Vercel, "Add New Project," import that repo.
3. In the Vercel project's Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. The live URL opens straight into the app — and so it does for anyone else who has it (see the warning at the top).

### 4. Add to your phone's home screen

Once it's live on its Vercel URL, open that URL in your phone's browser and use "Add to Home Screen" (Safari: Share > Add to Home Screen; Chrome: menu > Add to Home screen). It'll open full-screen with its own icon, no App Store involved.

## Notes

- **Schema migration (July 2026):** the app dropped all authentication. If your Supabase database was created under the old auth-based schema, run `supabase/open_access_migration.sql` once — it removes the `auth.users` foreign keys, re-points existing rows at the app's fixed single-user id, and swaps the `"own rows only"` policies for open `"open access"` ones. Fresh projects just run `supabase/schema.sql`.
- The Plan tab is where the week's recipes, meal plan, and workout options live. It's all hand-entered (e.g. written with Claude in a separate chat and pasted in) — the app never generates or regenerates anything. Today and Movement surface the day's workout type and its planned exercise options, including any pasted video links.
- Auth: **none.** The row-level security policies allow everything to everyone, so the public anon key grants full read/write on all tables. All rows share one hardcoded `user_id` (`lib/singleUser.ts`), which is bookkeeping, not protection. See the warning at the top of this file.
- Everything is manual entry — no third-party API calls, no other services involved.
- Steps are manual entry — there's no confirmed public API for Pacer, so the intended flow is copying your step count over from Apple Health / Google Fit, which Pacer syncs to.
