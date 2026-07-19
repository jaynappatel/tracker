import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash, timingSafeEqual } from 'crypto';

// Server-side password gate. The browser only ever sends the gate password
// and receives Supabase session tokens back — the gate password's expected
// value and the Supabase account credentials live in server-only env vars
// (no NEXT_PUBLIC_ prefix, so they are never bundled into client JS).

// Hashing both sides first gives equal-length buffers, which timingSafeEqual
// requires, without leaking the expected password's length.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function POST(req: Request) {
  const gatePassword = process.env.APP_PASSWORD;
  const supabaseEmail = process.env.APP_SUPABASE_EMAIL;
  const supabasePassword = process.env.APP_SUPABASE_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!gatePassword || !supabaseEmail || !supabasePassword || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 });
  }

  let password = '';
  try {
    const body = await req.json();
    if (typeof body?.password === 'string') password = body.password;
  } catch {
    // malformed body falls through to the same 401 as a wrong password
  }

  if (!password || !safeEqual(password, gatePassword)) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });
  }

  // A throwaway client just for this exchange — no session persistence on
  // the server. RLS still applies to everything the browser does afterward,
  // because the tokens belong to a real authenticated Supabase user.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: supabaseEmail,
    password: supabasePassword,
  });
  if (error || !data.session) {
    return NextResponse.json({ error: 'Sign-in failed on the server.' }, { status: 502 });
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
