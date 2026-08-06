import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * THE single Supabase client for the whole application.
 *
 * This is the only place `@supabase/supabase-js` is instantiated. Every
 * feature (auth, data, storage) must reuse this exported singleton instead of
 * creating its own client, so we always talk to the same project with the same
 * session and options.
 *
 * All configuration is read from `src/config/env.ts` — no env vars are
 * duplicated here. The anon key lives in `env.SUPABASE_ANON_KEY` today, so we
 * resolve `env.SUPABASE_KEY` through it without re-declaring the variable.
 */
const config = env as typeof env & { SUPABASE_KEY?: string };
const supabaseKey = config.SUPABASE_KEY ?? config.SUPABASE_ANON_KEY;

export const supabase = createClient(env.SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
