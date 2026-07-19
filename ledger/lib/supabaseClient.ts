import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaces a clear error in the browser console instead of a cryptic
  // Supabase failure if env vars weren't set in Vercel.
  console.warn(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Set them in .env.local (dev) or Vercel Project Settings > Environment Variables (prod).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
