# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Next.js 16 (16.2.9) + React 19.** This is not the Next.js in your training data. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/`. Notable: middleware is now `src/proxy.ts` exporting a `proxy()` function (not `middleware.ts`).

## Commands

```bash
npm run dev     # dev server (http://localhost:3000)
npm run build   # production build — also runs tsc; use this to verify changes
npm run lint    # eslint (flat config, eslint.config.mjs)
```

No test suite exists. `npm run build` is the verification gate (compiles + full TypeScript check).

Lint note: the React-compiler ESLint rules (`react-hooks/purity`, `set-state-in-effect`) surface pre-existing patterns (`useRef(Date.now())`, `setState` in effects) as **errors** in the CLI, but `next build` does not run blocking lint, so these do not fail the build. Don't churn on them.

## Architecture

PT-BR quiz/capacitação app for Igarassu health workers. Next.js App Router + Supabase (Postgres, Auth, RLS, Storage). All persistence and game logic lives in Supabase — there is no separate backend.

**Game logic lives in Postgres RPCs, not TypeScript.** Server Actions are thin wrappers that call `supabase.rpc(...)`. Core RPCs (defined in `supabase/migrations/`): `start_weekly_attempt`, `submit_answer`, `apply_tab_switch_penalty`, `finish_attempt`, `current_week_start`, `get_weekly/monthly/annual_ranking`, `get_category_error_stats`. To change scoring, penalties, or ranking, edit the SQL function and add a new migration — not the client.

**Migrations are applied manually.** Files in `supabase/migrations/` (`0001_…` upward) run in order via the Supabase SQL editor. Vercel/CI does **not** run them. After adding a migration, apply it by hand, or features break in production while the build stays green.

**Auth & access control:**
- `src/proxy.ts` — request gate. Redirects unauthenticated users to `/login` (except `PUBLIC_PATHS`: `/login`, `/cadastro`); redirects authenticated users away from public paths.
- `src/lib/dal.ts` — `getCurrentProfile()` (React-`cache`d), `requireUser()` → redirects to `/login`, `requireAdmin()` → redirects non-admins to `/quiz`. Call these at the top of protected pages/actions; do not re-implement auth checks.
- RLS policies (migrations `0003`, `0009`) are the real authorization boundary. Profiles carry `role: "admin" | "user"`.

**Supabase clients** (`src/lib/supabase/`): `server.ts` for Server Components / Actions / RPCs; `client.ts` for browser components. Pick by execution context.

**Routing:** `src/app/(app)/` = authenticated app (quiz, ranking, settings, `admin/*`); `src/app/login` & `src/app/cadastro` = public. The quiz runs at `(app)/quiz/play` driven by `components/quiz/quiz-runner.tsx` (client) — timer, tab-switch detection, answer submission, animated feedback.

**Domain model:** one `quiz_attempt` per user per `week_start`. Admins get unlimited "modo treino" runs that are excluded from ranking. Tab switches (visibility change) apply point penalties and end the attempt after `max_tab_switches`.

## Conventions

- UI: shadcn/ui (`components/ui/`) over Radix + Tailwind v4. Theme tokens in `src/app/globals.css` via `@theme`; primary is green (oklch hue 145). Custom keyframes (`quiz-pop`, `quiz-shake`, `quiz-confetti`) also live there.
- Forms: react-hook-form + zod. Toasts: sonner. Charts: recharts. Icons: lucide-react.
- Shared types in `src/lib/types.ts` (`Difficulty`, `Option`, `Profile`, etc.). Path alias `@/` → `src/`.
- Env (`.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deploy

Push to `main` → Vercel auto-deploys to production (project `quiz-saudeigarassu2`). **Vercel rejects pushes whose commit author email doesn't match the GitHub account** — verify `git log -1 --format='%ae'` equals the account email before pushing.
