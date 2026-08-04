/** Auth endpoints. Mock-backed today, Supabase Auth / FastAPI tomorrow. */
import { delay, http } from "./http";
import { isMockMode } from "@/config/env";
import { mockAccounts, mockDemoAccounts } from "@/mock/users";
import type {
  GetCurrentUserResponse,
  LoginRequest,
  LoginResponse,
  RefreshSessionResponse,
  Session,
} from "@/types/api/auth.contracts";

function mockSession(user: Session["user"]): Session {
  return {
    access_token: `mock-access-${user.id}`,
    refresh_token: `mock-refresh-${user.id}`,
    expires_at: Date.now() + 60 * 60 * 1000,
    user,
  };
}

export async function login({ email, password }: LoginRequest): Promise<LoginResponse> {
  if (!isMockMode()) return http.post<LoginResponse>("/auth/login", { email, password });
  await delay(120);
  const rec = mockAccounts[email.trim().toLowerCase()];
  if (!rec || rec.password !== password) {
    throw new Error("Wrong email or password. Try one of the demo accounts.");
  }
  return { session: mockSession(rec.user) };
}

export async function logout(): Promise<void> {
  if (!isMockMode()) {
    await http.post<void>("/auth/logout");
    return;
  }
  await delay(60);
}

export async function getCurrentUser(session?: Session | null): Promise<GetCurrentUserResponse> {
  if (!isMockMode()) return http.get<GetCurrentUserResponse>("/auth/me");
  await delay(40);
  return { user: session?.user ?? null };
}

export async function refreshSession(session: Session): Promise<RefreshSessionResponse> {
  if (!isMockMode()) {
    return http.post<RefreshSessionResponse>("/auth/refresh", {
      refresh_token: session.refresh_token,
    });
  }
  await delay(40);
  return { session: mockSession(session.user) };
}

export async function listDemoAccounts() {
  return mockDemoAccounts;
}

/** Demo credentials shown on the login screen (mock mode only). */
export function demoAccounts() {
  return isMockMode() ? mockDemoAccounts : [];
}
