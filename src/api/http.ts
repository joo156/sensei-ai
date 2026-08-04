/**
 * Thin HTTP client for the FastAPI backend.
 *
 * Every `*.api.ts` module routes network access through here, so auth headers,
 * base URL and error shaping live in exactly one place. While
 * `env.ENABLE_MOCK` is on, the api modules short-circuit and never reach this
 * client.
 */
import { env } from "@/config/env";
import type { ApiError } from "@/types/api/common";

let accessToken: string | null = null;

/** Called by AuthService whenever a session is created/refreshed/cleared. */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class HttpError extends Error {
  status: number;
  body: ApiError | null;
  constructor(status: number, message: string, body: ApiError | null) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  const payload = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const err = (payload as { error?: ApiError } | null)?.error ?? null;
    throw new HttpError(res.status, err?.message ?? res.statusText, err);
  }

  return (payload as { data?: T })?.data !== undefined
    ? ((payload as { data: T }).data as T)
    : (payload as T);
}

export const http = {
  get: <T>(path: string, init?: RequestInit) => request<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>("POST", path, body, init),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

/** Simulated latency so mock responses behave like real async calls. */
export const delay = (ms = 220) => new Promise<void>((resolve) => setTimeout(resolve, ms));
