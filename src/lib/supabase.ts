import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Shared Supabase client for the app.
 *
 * This singleton reads configuration only from `src/config/env.ts`.
 * Authentication should remain managed by existing auth services.
 */
const config = env as typeof env & { SUPABASE_KEY?: string };
const supabaseKey = config.SUPABASE_KEY ?? config.SUPABASE_ANON_KEY;

export const supabase = createClient(env.SUPABASE_URL, supabaseKey);
