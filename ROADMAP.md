# Sensei — Product Roadmap

Sensei is a grounded, multi-agent AI study platform. This roadmap mirrors the
engineering plan: a production-hardened frontend today, a FastAPI backend next,
Supabase for identity & persistence, then deployment.

## Legend

- ✅ Complete — implemented and verified in this repository.
- ⬜ Planned — design agreed, not yet built.
- 🔄 In progress — being worked on now.

---

## Current — Production-hardened frontend ✅

The frontend is a TanStack Start (SSR) + React 19 + Vite application with a
strict layering so the backend can be swapped without touching the UI.

- ✅ File-based routing (`/home`, `/studio`, `/workspace`, `/library`, `/review`,
  `/analytics`, `/pipeline`, `/agents`, `/history`, `/settings`, `/admin`,
  `/login`, `/chat/:chatId`, `/sitemap.xml`).
- ✅ Layered architecture: `routes/ → components/ → contexts/ & hooks/ →
services/ → api/ → mock/ → types/`.
- ✅ Mock mode (`VITE_ENABLE_MOCK=true`) — fully offline, feature-complete.
- ✅ Role-based access (`student`, `reviewer`, `admin`) via `ROLE_PERMISSIONS`
  and `<RoleGate>`.
- ✅ Workspaces as the isolation boundary — every page reads workspace-scoped
  data from `useWorkspace()`.
- ✅ AI provider abstraction (`services/ai/AIProvider.ts`) with four providers:
  Mock, Gemini, Kimi, Nvidia.
- ✅ Review workflow with grounding checks, quality flags and an audit trail.
- ✅ Global search across documents, questions, flashcards, concepts, history.
- ✅ Analytics dashboards (grounding, quality, Bloom, topic coverage).
- ✅ 404 / error boundaries, SSR error page, loading/error/empty states
  everywhere.

## Next — FastAPI integration ⬜

Roughly ordered by dependency:

1. ⬜ Implement FastAPI routes per `docs/FASTAPI_INTEGRATION.md` and
   `docs/BACKEND_CONTRACT.md` (auth, workspaces, upload pipeline, generation,
   chat, review, analytics).
2. ⬜ Verify the JWT from Supabase on every request (`Authorization: Bearer`).
3. ⬜ Set `VITE_API_BASE_URL` and flip `VITE_ENABLE_MOCK=false`.
4. ⬜ Containerise the service, expose HTTPS, allow the frontend origin via CORS.
5. ⬜ Keep model keys server-side only (`GEMINI_API_KEY`, etc.).

> The frontend needs **no refactoring**: every page already calls services that
> delegate to `*.api.ts`, which short-circuit to `http.*` when mock mode is off.

## Next — Supabase integration ⬜

1. ⬜ Add `@supabase/supabase-js` and set `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. ⬜ Swap `auth.api.ts` + `AuthService` for `supabase.auth.*` (login, logout,
   getUser, refresh). `AuthContext` and every page stays as-is.
3. ⬜ Apply `docs/DATABASE_SCHEMA.md` migrations with RLS + GRANTs in the same
   migration as each `CREATE TABLE`.
4. ⬜ Add `user_roles` + `has_role(uuid, app_role)` security-definer function.
5. ⬜ Replace mock branches in `workspace.api.ts`, `document.api.ts`,
   `history.api.ts`, `review.api.ts`, `analytics.api.ts`.
6. ⬜ Private `documents` storage bucket; signed URLs for reads.
7. ⬜ Realtime subscriptions for `reviews` and `notifications`.

## Later — Deployment & operations ⬜

1. ⬜ Select a host (Cloudflare Workers/pages via Nitro preset, Vercel, or a
   container host) and wire CI to it.
2. ⬜ Dockerfile + Compose for local full-stack (FastAPI + Postgres + frontend).
3. ⬜ CI/CD pipeline: typecheck → lint → test → build → deploy.
4. ⬜ Observability: request ids, model latency, rate-limit (429) alerts,
   grounding-score drops.
5. ⬜ Backups + RLS verification on the database.
