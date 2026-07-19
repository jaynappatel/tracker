# Ledger

A personal food, movement, body, and cycle tracker. Next.js + Supabase, deployed on Vercel.

## What's in here

- `app/` — every page: today, nutrition, water, movement, schedule, sleep, health, weekly summary, goals, plus login
- `supabase/schema.sql` — the database schema, run once in Supabase
- `lib/`, `components/`, `context/` — shared code (Supabase client, date helpers, auth, nav)

## One-time setup

### 1. Supabase (free tier is enough)

1. Go to supabase.com, create a project.
2. In the SQL Editor, paste in the contents of `supabase/schema.sql` and run it. This creates all the tables and locks them down so only your signed-in account can read or write your rows.
3. In Project Settings > API, copy the **Project URL** and the **anon public key**.
4. In Authentication > Providers, make sure Email is enabled. In Authentication > Settings, you can turn off "Confirm email" if you don't want an email confirmation step for your one account.

### 2. Local development

```
npm install
cp .env.local.example .env.local
# paste your Supabase URL and Supabase anon key into .env.local
npm run dev
```

Visit `localhost:3000`, use "Create account" once with your own email/password, then sign in from then on.

### 3. Deploy to Vercel

Same pattern as topwater-workflow:

1. Push this folder to a new GitHub repo.
2. In Vercel, "Add New Project," import that repo.
3. In the Vercel project's Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Visit the live URL, create your account once, sign in.

### 4. Add to your phone's home screen

Once it's live on its Vercel URL, open that URL in your phone's browser and use "Add to Home Screen" (Safari: Share > Add to Home Screen; Chrome: menu > Add to Home screen). It'll open full-screen with its own icon, no App Store involved.

## Notes

- All your data — meals, water, weight, steps, workouts, schedule, sleep, and the health log (GLP-1, birth control, period, sex) — lives in your Supabase database, scoped to your account by row-level security. Nobody but your signed-in account can read it, even with the public anon key.
- Everything is manual entry — no third-party API calls, no other services involved.
- Steps are manual entry — there's no confirmed public API for Pacer, so the intended flow is copying your step count over from Apple Health / Google Fit, which Pacer syncs to.
