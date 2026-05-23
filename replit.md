# ExamPortal

A full-stack competitive exam preparation platform supporting SSC, RRB, Banking, UPSC, Railway, Defence, Technical, and State exams.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/exam-platform run dev` — run the React frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, Wouter, shadcn/ui, Recharts
- API: Express 5, JWT auth (bcrypt), Multer (PDF upload)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks and Zod schemas
- `lib/db/src/schema/` — Drizzle ORM table definitions (users, exams, sections, questions, attempts, answers, bookmarks)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, exams, questions, attempts, students, admin, results)
- `artifacts/exam-platform/src/` — React frontend (pages, layouts, components, lib/auth.tsx)

## Architecture decisions

- Contract-first API: OpenAPI spec drives Orval codegen for type-safe client hooks; never write fetch calls by hand.
- JWT-only auth (no sessions/cookies): token stored in localStorage, injected via `setAuthTokenGetter` before every request.
- Role-based access: `STUDENT` / `ADMIN` enforced by `requireAdmin` middleware on all admin routes.
- Negative marking at attempt-submit time: correct/wrong/score calculated server-side when student submits exam.
- PDF extraction falls back to sample question generation if `pdf-parse` fails or no structured content found.

## Product

- **Students**: Browse and filter exams by category, take timer-based mock tests with a live question palette, view detailed results with section breakdowns and explanations, track analytics over time, bookmark questions.
- **Admins**: Create/edit/publish exams, manage questions (manual entry or PDF upload with auto-extraction), view platform-wide analytics, manage users.

## Seed credentials

- Admin: `admin` / `admin123`
- Student: `student1` / `admin123`

## User preferences

- JWT auth only — no email/OTP, no OAuth
- Username + password login only

## Gotchas

- Run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` to ensure DB type declarations are emitted first.
- In Express 5, `req.params.X` is typed as `string | string[]` — always wrap with `String(req.params.X)` before `parseInt`.
- bcrypt native build may be ignored; it falls back to a bundled pure-JS implementation automatically.
- `pnpm approve-builds` is interactive and cannot be piped; run it manually in the shell if needed.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
