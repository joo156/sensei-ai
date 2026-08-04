# Frontend Architecture

Visually identical to before; internally layered so the backend can be implemented without touching UI.

## Layers (top → bottom)

```
routes/ + components/      UI only. No fetching, no mock imports, no role logic.
contexts/ + hooks/         React state: Auth, Workspace, Theme. Expose services to UI.
services/                  Business logic. The ONLY layer to change when a real backend lands.
api/                       Endpoint functions (one file per domain) + http client.
mock/                      Every fake user, doc, workspace, generation, history, review, notification.
types/ + types/api/         Database shapes and request/response contracts.
config/ + constants/       env placeholders, roles, permissions, storage keys.
```

## Folders

- `src/app` — reserved for future route grouping; routes currently live in `src/routes` because TanStack Start uses file-based routing (moving them changes URLs, so they stay).
- `src/routes/*` — pages. `__root.tsx` mounts `QueryClientProvider → AuthProvider → WorkspaceProvider`.
- `src/components/ui` — shadcn primitives. `src/components/app` — app-level components (AppShell, RoleGate, ModelSelector, NotificationCenter, …).
- `src/contexts/AuthContext.tsx` — provider shaped like Supabase Auth: `login`, `signIn`, `logout`, `refreshSession`, `getCurrentUser`, `hasRole`, `can`.
- `src/contexts/WorkspaceContext.tsx` — the single source of `activeWorkspaceId`. All workspace-owned data (docs, chunks, chats, questions, flashcards, history, audit) is read from `useWorkspace().data`, already scoped to the active workspace, so pages never filter by workspace themselves.
- `src/services` — `AuthService`, `WorkspaceService`, `DocumentService`, `UploadService`, `GenerationService`, `ChatService`, `ReviewService`, `HistoryService`, `AnalyticsService`, `ModelService`, plus `services/ai/AIProvider.ts`.
- `src/api` — `auth.api.ts`, `workspace.api.ts`, `document.api.ts`, `generation.api.ts`, `chat.api.ts`, `review.api.ts`, `history.api.ts`, `analytics.api.ts`, `model.api.ts`, `http.ts`. Each function checks `isMockMode()`: mock data now, `http.*` call later.
- `src/mock` — `users.ts`, `mock-data.ts`, `studio-data.ts`, `workspace-data.ts`.

## Data flow

```
component → hook/context → Service → *.api.ts → (mock | FastAPI/Supabase)
```

A component never imports from `src/api` or `src/mock`.

## AI providers

`services/ai/AIProvider.ts` exposes `MockProvider`, `GeminiProvider`, `KimiProvider`, `NvidiaProvider` behind one `AIProvider` interface and `getProvider(id)`. `GenerationService` and `ChatService` resolve a provider from the selected model id; the UI only passes the id.

## Permissions

`constants/index.ts` holds `ROLE_PERMISSIONS`. Use `useAuth().can("review:approve")` or `usePermissions()`. `RoleGate` guards routes by role. Never write `role === "admin"` in a component.

## Stores

Auth, Workspace and Theme are React Contexts (one consistent pattern). Generation/chat/current-document state is local per page but always fed by services; notification data comes from the mock layer via role filtering. Swapping to Zustand later means replacing the provider internals only.

## Config

`config/env.ts` reads `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_ENABLE_MOCK`, `VITE_DEFAULT_MODEL`. `ENABLE_MOCK=true` keeps the app fully offline.
