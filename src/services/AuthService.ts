/**
 * Auth service — the single seam between the UI and the identity provider.
 *
 * Supabase Auth is the single source of truth: the Supabase client owns all
 * session storage (persistSession) and refresh logic. This service only maps
 * sessions into the app's shape and hands them to AuthContext — no
 * localStorage here.
 */
import { supabase } from "@/lib/supabase";
import * as authApi from "@/api/auth.api";
import { setAccessToken } from "@/api/http";
import type { AuthUser, Session } from "@/types/api/auth.contracts";

/** Last known session, kept in memory so restoreSession() stays synchronous. */
let cachedSession: Session | null = null;

// Supabase's getSession() is async, but AuthContext calls restoreSession()
// synchronously at boot. Kick the read off here (module load) so the persisted
// session is cached before the first render's effect runs.
void (async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return;
    const session = await authApi.mapSession(data.session);
    if (!session) return;
    cachedSession = session;
    setAccessToken(session.access_token);
  } catch {
    /* Supabase not configured yet — app starts signed out. */
  }
})();

export const AuthService = {
  /**
   * Restore the persisted Supabase session at boot.
   * Synchronous by design: the value is hydrated from `supabase.auth.getSession()`.
   */
  restoreSession(): Session | null {
    setAccessToken(cachedSession?.access_token ?? null);
    return cachedSession;
  },

  /** Sign in with email + password and cache the resulting session. */
  async login(email: string, password: string): Promise<Session> {
    const { session } = await authApi.login({ email, password });
    cachedSession = session;
    setAccessToken(session.access_token);
    return session;
  },

  /** Sign the user out, clearing the cached session. */
  async logout(): Promise<void> {
    await authApi.logout();
    cachedSession = null;
    setAccessToken(null);
  },

  /** Resolve the current user, merging profiles + user_roles into AuthUser. */
  async getCurrentUser(): Promise<AuthUser | null> {
    const { user } = await authApi.getCurrentUser(cachedSession);
    return user;
  },

  /** Refresh the active session, falling back to the persisted session if needed. */
  async refreshSession(): Promise<Session | null> {
    if (cachedSession) {
      const { session } = await authApi.refreshSession(cachedSession);
      cachedSession = session;
      setAccessToken(session.access_token);
      return session;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const session = await authApi.mapSession(data.session);
    if (!session) return null;
    cachedSession = session;
    setAccessToken(session.access_token);
    return session;
  },

  listDemoAccounts: authApi.listDemoAccounts,
  demoAccounts: authApi.demoAccounts,
};
