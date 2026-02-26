# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint (eslint v9 flat config)
```

To add a shadcn component (uses `shadcn@3`, not `shadcn-ui`):
```bash
npx shadcn@latest add <component>
```

## Environment

Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor before first use. Disable email confirmation in Supabase Auth settings (or rely on the `/auth/callback` route handler).

## Architecture

**Stake** is a friend-group betting app. Users create groups, post yes/no event bets with pledge amounts, vote to resolve them, and settle debts via Venmo.

### Route Structure

```
src/app/
  page.tsx                    # landing / redirect
  (auth)/login, /signup       # unauthenticated pages
  (app)/                      # auth-guarded route group
    layout.tsx                # session check → redirect /login; renders Header + MobileNav
    dashboard/page.tsx
    groups/[id]/page.tsx
    groups/[id]/bets/new/page.tsx
    bets/[id]/page.tsx
    join/[code]/page.tsx
  auth/callback/route.ts      # Supabase OAuth callback
```

`middleware.ts` runs on every non-static request to refresh the Supabase session cookie. The `(app)` layout performs a second auth check server-side and redirects unauthenticated users.

### Data Layer

All mutations are **Next.js Server Actions** in `src/actions/` — never called via API routes. Each action creates a server Supabase client (`src/lib/supabase/server.ts`) and calls `revalidatePath` after mutations.

Supabase clients:
- `src/lib/supabase/server.ts` — used in Server Components and Server Actions
- `src/lib/supabase/browser.ts` — used in Client Components

Types:
- `src/types/database.ts` — raw DB row types matching the schema
- `src/types/app.ts` — rich joined types (`BetDetail`, `BetSettlement`, etc.) and all form input interfaces

### Bet Lifecycle

```
open → voting → resolved
              ↘ cancelled (tie vote)
```

- **open**: participants place bets (`bet_participations`).
- **voting**: triggered manually when `resolution_date <= today` via `triggerVotingPeriod` in `src/actions/bets.ts`. Uses `.eq('status', 'open')` as an atomic guard against double-triggers.
- **resolved / cancelled**: driven by `castVote` → `resolveIfReady` in `src/actions/votes.ts`, which calls `checkVoteResolution` from `src/lib/resolution.ts`.

Resolution rules (`src/lib/resolution.ts`):
- **Early resolve**: >50% of participants have voted AND one side has a strict majority.
- **48-hour fallback**: after 48 hrs from `voting_opened_at`, plurality wins; exact tie → cancelled.

### Settlement Algorithm (`src/lib/settlement.ts`)

After resolution, `calculateSettlement` computes:
1. Each winner receives their pledge back plus a proportional share of the losing pool.
2. `simplifyDebts` uses a greedy two-pointer algorithm to produce the minimal set of `DebtTransaction` objects.
3. All arithmetic uses `Math.round(n * 100) / 100` at each step; amounts < $0.005 (dust) are filtered out.

### Venmo Integration (`src/lib/venmo.ts`)

`buildVenmoLink` generates a deep link (`venmo://`). `buildVenmoWebLink` generates a web fallback. The `VenmoButton` component detects mobile via `navigator.userAgent` and shows both.

### RLS Notes

All tables have Row Level Security enabled. The `group_members` self-reference policy aliases the inner query as `gm_inner` to avoid Postgres RLS recursion. Bet participation insert policy enforces `status = 'open'` at the DB level.

### UI Patterns

- Components are co-located under `src/components/{groups,bets,voting,settlement,auth,layout}/`.
- shadcn primitives live in `src/components/ui/`. Use `sonner` (not `toast`) for notifications.
- Forms use `react-hook-form` + `zod` + `@hookform/resolvers`.
- Tailwind v4 — no `tailwind.config.ts`; config is in `globals.css` via `@import "tailwindcss"`.
