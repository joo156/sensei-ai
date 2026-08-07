# Sensei — Grounded AI Study Workspace

Sensei is a multi-agent, grounded AI study platform. Students upload educational
material (PDF, DOCX, PPTX, TXT) and the platform turns it into cited question
banks, flashcards, study plans and revision sheets through a transparent RAG
pipeline — every output validated, grounded back to source chunks, and gated by
a human review workflow before export.

The frontend is built as a production-quality TanStack Start (SSR) application
with a strict layering so a FastAPI backend and Supabase can be connected later
**without touching any UI code**.

---

## Features

- **7 AI agents** — Mentor, Concept Explanation, Question Bank, Test Help,
  Flashcards, Study Plan, Revision Assistant.
- **Grounded RAG pipeline** — upload → parse → chunk → embed → retrieve →
  generate → validate → human review → export (visualised on the Pipeline page).
- **Question Bank** — MCQ / True-False / Short Answer with difficulty tiers,
  Bloom's classification, citations, quality and grounding scores.
- **Review workflow** — approve / reject / needs-edit with comments, audit
  trail, and grounding/quality auto-flagging. Export stays locked until approved.
- **Workspaces** — isolated docs, chats, generations and review history.
- **Roles** — `student`, `reviewer`, `admin` gated through a permission system.
- **Global search** — documents, questions, flashcards, concepts and history.
- **Analytics** — grounding, quality, Bloom distribution, topic coverage.
- **Dark & light themes**, responsive layout, elegant loading/error/empty states.

## Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Framework     | TanStack Start (SSR) + TanStack Router |
| UI            | React 19 + Tailwind CSS v4 + shadcn/ui |
| Data fetching | TanStack Query                         |
| Animations    | motion                                 |
| Charts        | recharts                               |
| Icons         | lucide-react                           |
| Build         | Vite 8 + Nitro                         |
| Language      | TypeScript (strict)                    |

## Project structure

```text
src/
├── routes/        # File-based pages (TanStack Router)
├── components/    # ui/ (shadcn primitives) + app/ (feature components)
├── contexts/      # Auth, Workspace, Notification providers
├── hooks/         # Shared React hooks
├── services/      # Business logic — the only layer backend swap touches
│   └── ai/        # AI provider abstraction (Mock / Gemini / Kimi / Nvidia)
├── api/           # Endpoint functions (one file per domain) + HTTP client
├── mock/          # Offline mock data layer
├── types/         # Domain models + database contract + API contracts
├── config/        # Env var reading with safe defaults
├── constants/     # Roles, permissions, storage keys
└── lib/           # Utilities (logger, error reporter, result envelope)
```

## Architecture & data flow

```
component → hook/context → Service → *.api.ts → (mock | FastAPI/Supabase)
```

A component never imports `src/api` or `src/mock`. Every backend interaction
already flows through a service:

- Workspace → `WorkspaceService` → `workspace.api.ts`
- Generation → `GenerationService` → `generation.api.ts` (via `AIProvider`)
- Chat → `ChatService` → `chat.api.ts`
- Review → `ReviewService` → `review.api.ts`
- Analytics → `AnalyticsService` → `analytics.api.ts`
- Auth → `AuthService` → `auth.api.ts` (Supabase-shaped)

See [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) for details.

## Mock mode

By default (`VITE_ENABLE_MOCK=true`) the app runs **fully offline** from
`src/mock`: demo accounts, seeded workspaces, pre-chunked documents, generated
questions, chats, history and review data. Every feature works — including
login, workspace switching, generation, review and analytics.

Demo accounts:

| Role     | Email               | Password   |
| -------- | ------------------- | ---------- |
| Student  | `student@sensei.ai`  | `student`  |
| Reviewer | `reviewer@sensei.ai` | `reviewer` |
| Admin    | `admin@sensei.ai`    | `admin`    |

## AI providers

`services/ai/AIProvider.ts` exposes one `AIProvider` interface over four
providers: **Mock**, **Gemini**, **Kimi**, **Nvidia**. When a real backend is
connected, each provider id maps to the same FastAPI routes; the UI only passes
the selected model id.

## Roles & permissions

`src/constants/index.ts` holds `ROLE_PERMISSIONS`. Use
`useAuth().can("review:approve")` or `usePermissions()`, and guard pages with
`<RoleGate>`. Never write `role === "admin"` inside a component.

## Environment variables

| Variable                        | Default   | Purpose                                    |
| ------------------------------- | --------- | ------------------------------------------ |
| `VITE_API_BASE_URL`             | `/api`    | FastAPI base URL                           |
| `VITE_SUPABASE_URL`             | _(empty)_ | Supabase project URL                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | _(empty)_ | Supabase anon key                          |
| `VITE_ENABLE_MOCK`              | `true`    | Resolve from `src/mock` instead of network |
| `VITE_DEFAULT_MODEL`            | `mock`    | Default AI provider id                     |

Only publishable keys belong in the browser.

## Development

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # production build
npm run preview    # preview the production build
npx tsc --noEmit   # type-check
npm run lint       # ESLint + Prettier check
npm run format     # Prettier write
```

## Backend readiness

This repository is a **frontend-ready** build. The service/API layer is
structured so that:

- **FastAPI** — implement `docs/FASTAPI_INTEGRATION.md` and
  `docs/BACKEND_CONTRACT.md`, set `VITE_API_BASE_URL`, flip
  `VITE_ENABLE_MOCK=false`. No frontend refactoring required.
- **Supabase** — swap `auth.api.ts` + `AuthService` and the mock branches in the
  workspace/document/history/review/analytics api modules, per
  `docs/SUPABASE_INTEGRATION.md`. `AuthContext` and all pages stay as-is.

See [ROADMAP.md](ROADMAP.md) for the current and planned work.

## Documentation

- [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [FastAPI Integration](docs/FASTAPI_INTEGRATION.md)
- [Backend Contract](docs/BACKEND_CONTRACT.md)
- [Supabase Integration](docs/SUPABASE_INTEGRATION.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
