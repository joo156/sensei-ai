/**
 * Auth provider — shaped exactly like a real provider (Supabase Auth) so the
 * implementation can be swapped without touching any component.
 *
 * Components use `useAuth()` only; role checks go through `can()` / `hasRole()`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthService } from "@/services/AuthService";
import { ReviewService } from "@/services/ReviewService";
import { ROLE_HOME, type Permission } from "@/constants";

import type { AuthUser, Session } from "@/types/api/auth.contracts";
import type { UserRole } from "@/types/database.types";

export type Role = UserRole;
export type User = AuthUser;

/** Demo credentials shown on the login page (mock layer). */
export const DEMO_ACCOUNTS = AuthService.demoAccounts();

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  ready: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  /** Alias matching the provider contract. */
  login: (email: string, password: string) => Promise<User>;
  signOut: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  hasRole: (roles: Role[]) => boolean;
  can: (permission: Permission) => boolean;
}

const Ctx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(AuthService.restoreSession());
    setReady(true);
  }, []);

  const user = session?.user ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const next = await AuthService.login(email, password);
    // TEMP-DEBUG: trace what AuthContext stores in state
    console.log("[AuthContext.login] storing session =", next, "| role =", next.user.role);
    setSession(next);
    return next.user;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const u = await login(email, password);
        return { ok: true as const, user: u };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : "Could not sign in.",
        };
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    await AuthService.logout();
    setSession(null);
  }, []);

  const signOut = useCallback(() => {
    void logout();
  }, [logout]);

  const refreshSession = useCallback(async () => {
    const next = await AuthService.refreshSession();
    setSession(next);
  }, []);

  const getCurrentUser = useCallback(() => AuthService.getCurrentUser(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      ready,
      signIn,
      login,
      signOut,
      logout,
      refreshSession,
      getCurrentUser,
      hasRole: (roles) => (user ? roles.includes(user.role) : false),
      can: (permission) => ReviewService.can(user?.role, permission),
    }),
    [user, session, ready, signIn, login, signOut, logout, refreshSession, getCurrentUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function roleAllows(role: Role, required: Role[]): boolean {
  return required.includes(role);
}

export function homeForRole(role: Role): string {
  return ROLE_HOME[role] ?? "/home";
}
