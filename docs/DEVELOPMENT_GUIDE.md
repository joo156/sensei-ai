# Development Guide

## Run locally

```bash
bun install
bun run dev      # http://localhost:8080
```

With `VITE_ENABLE_MOCK=true` (default) everything works offline from `src/mock`.

## Environment

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_ENABLE_MOCK=false
VITE_DEFAULT_MODEL=gemini
```

## Golden rules

1. UI never imports `src/api` or `src/mock`.
2. Services are the only place backend behaviour changes.
3. Role checks go through `useAuth().can()` / `RoleGate`.
4. Workspace-owned data comes from `useWorkspace()`; never filter by workspace in a page.

## Connect the pieces

1. **Supabase Auth** — follow `SUPABASE_INTEGRATION.md`: swap `auth.api.ts` + `AuthService`, add `user_roles` and `has_role()`. `AuthContext`, `RoleGate` and pages stay as-is.
2. **Database** — apply `DATABASE_SCHEMA.md` as migrations, with GRANTs and RLS in the same migration as each `CREATE TABLE`. Then replace mock branches in `workspace.api.ts`, `document.api.ts`, `history.api.ts`, `review.api.ts`, `analytics.api.ts`.
3. **Storage** — private `documents` bucket; `UploadService.upload()` writes there and stores `storage_path`; reads use signed URLs.
4. **FastAPI** — implement `FASTAPI_INTEGRATION.md` / `BACKEND_CONTRACT.md`, set `VITE_API_BASE_URL`, flip `VITE_ENABLE_MOCK=false`. The FastAPI service verifies the Supabase JWT on every request.
5. **AI models** — implement `/generate/*` and `/*/chat` in FastAPI (RAG: retrieve chunks → prompt → cite). Frontend needs no change: `services/ai/AIProvider.ts` already routes each model id to the same endpoints.
6. **Review workflow** — reviewer actions hit `/review/*` and append to `reviews`; students read status and comments through `ReviewService.auditHistory`; admins read `/analytics`. Enforce role permissions in the API, mirroring `ROLE_PERMISSIONS`.
7. **Realtime** — subscribe to `reviews` and `notifications` changes inside the services/context; components re-render automatically.

## Checks before shipping

```bash
bunx tsgo --noEmit
bun run build
```

## Production deployment

- Frontend: `bun run build` + any static/edge host. Set the `VITE_*` vars in the deploy environment; only publishable keys belong in the browser.
- FastAPI: containerise, expose HTTPS, allow the frontend origin via CORS, keep `SUPABASE_SERVICE_ROLE_KEY` and model API keys server-side only.
- Database: migrations in version control, RLS enabled everywhere, backups on.
- Observability: log request ids from `http.ts` errors, monitor model latency and rate limits (429), alert on grounding-score drops.
