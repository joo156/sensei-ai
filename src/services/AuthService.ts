/**
 * Auth service — the single seam between the UI and whatever identity provider
 * is in use. Today: mock accounts. Tomorrow: Supabase Auth (see
 * docs/SUPABASE_INTEGRATION.md) — only this file and `auth.api.ts` change.
 */
import * as authApi from "@/api/auth.api";
import { setAccessToken } from "@/api/http";
import { STORAGE_KEYS } from "@/constants";
import type { AuthUser, Session } from "@/types/api/auth.contracts";

function persist(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* storage unavailable */
  }
}

function readPersisted(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session> & Partial<AuthUser>;
    // Tolerate the legacy shape where only the user object was stored.
    if ((parsed as Session).user) return parsed as Session;
    const legacy = parsed as AuthUser;
    if (!legacy.email) return null;
    return {
      access_token: "mock-legacy",
      refresh_token: "mock-legacy",
      expires_at: Date.now() + 3600_000,
      user: { ...legacy, id: legacy.id ?? legacy.email },
    };
  } catch {
    return null;
  }
}

export const AuthService = {
  /** Restore a session at boot (localStorage today, Supabase getSession later). */
  restoreSession(): Session | null {
    const session = readPersisted();
    setAccessToken(session?.access_token ?? null);
    return session;
  },

  async login(email: string, password: string): Promise<Session> {
    const { session } = await authApi.login({ email, password });
    persist(session);
    setAccessToken(session.access_token);
    return session;
  },

  async logout(): Promise<void> {
    await authApi.logout();
    persist(null);
    setAccessToken(null);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = readPersisted();
    const { user } = await authApi.getCurrentUser(session);
    return user;
  },

  async refreshSession(): Promise<Session | null> {
    const current = readPersisted();
    if (!current) return null;
    const { session } = await authApi.refreshSession(current);
    persist(session);
    setAccessToken(session.access_token);
    return session;
  },

  listDemoAccounts: authApi.listDemoAccounts,
  demoAccounts: authApi.demoAccounts,
};
