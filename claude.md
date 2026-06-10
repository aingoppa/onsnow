# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# onsnow

A SaaS web application that connects snow sports enthusiasts — skiers, snowboarders, snowshoers, and more — so they can find partners to ride with, coordinate carpooling, and combine purchases like group lift ticket discounts.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: SCSS with CSS Modules (`.module.scss` per component)
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js` — no Prisma or separate ORM
- **Auth**: Supabase Auth — email/password and Google OAuth (OIDC)
- **API**: Next.js Route Handlers (`src/app/api/`)

## Directory Structure

```
src/
├── proxy.ts                # Request proxy: session refresh + auth route protection
├── app/                    # Next.js App Router pages & layouts
│   ├── (auth)/             # Public auth pages (sign-in, sign-up)
│   ├── (app)/              # Protected pages (proxy enforces auth)
│   │   ├── action/         # Play Together rooms (/action)
│   │   └── profile/        # User profile + edit
│   ├── api/                # Route Handlers
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   └── ui/                 # Generic UI primitives
├── lib/                    # Shared utilities and helpers
│   ├── supabase/           # Supabase client instances (server + browser)
│   └── types/              # Shared TypeScript types (profile.ts, room.ts)
└── styles/                 # Global styles
    ├── globals.scss         # Global resets and base styles
    └── _variables.scss      # SCSS variables and mixins
supabase/
└── migrations/             # SQL migration files (schema changes go here)
```

## Dev Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint
npm run typecheck # Run tsc --noEmit
```

## Architecture patterns

### Route groups
- `src/app/(auth)/` — public pages (sign-in, sign-up). No auth required.
- `src/app/(app)/` — protected pages (profile, future features). Proxy (`src/proxy.ts`) redirects unauthenticated users to `/sign-in`.
- `src/app/auth/callback/route.ts` — OAuth exchange handler. Must be registered as a redirect URI in both Google Cloud Console and Supabase.

### Server vs Client component pattern
Pages are Server Components by default. Interactive pieces are extracted into a co-located Client Component:
```
page.tsx          ← Server Component: fetches data, passes as props
└── SomeForm.tsx  ← 'use client': handles input state, calls Supabase browser client
```
Never fetch data in Client Components — pass it down from the Server Component.

### Supabase client usage
Two clients exist for a reason — using the wrong one causes auth bugs:
- `src/lib/supabase/server.ts` — use in Server Components and Route Handlers. Reads session from cookies. Async: `await createServerClient()`.
- `src/lib/supabase/browser.ts` — use in `'use client'` components only. Singleton: `getBrowserClient()`. Used for form submissions, auth state changes.

### Session management
`src/proxy.ts` runs on every request and refreshes the Supabase session cookie. Without it, users get silently logged out. It also enforces route protection via `PUBLIC_ROUTES`.

### Profile creation flow
Supabase creates `auth.users` on sign-up automatically. The app creates the `profiles` row manually after the user fills the edit form (`/profile/edit`). The profile page redirects to `/profile/edit` if no profile row exists yet.

### Photo upload (api.market)
`POST /api/photo/upload` forwards the file to api.market and saves `photo_url` + `photo_uploaded_at` to the profiles table. api.market deletes images after 7 days — expiry is computed from `photo_uploaded_at` at render time, not stored. `ProfileUpdate` intentionally omits these fields so the edit form upsert never overwrites them.

## Code Conventions

- **Path alias**: `@/` maps to `src/` — use `@/lib/...`, `@/components/...` etc.
- **TypeScript**: Strict mode, no `any`. Define types in `src/lib/types/`.
- **Components**: PascalCase filenames. Co-locate `Component.module.scss` alongside `Component.tsx`.
- **Server vs Client**: Default to React Server Components. Add `'use client'` only when interactivity or browser APIs are required.
- **Data fetching**: Fetch in Server Components or Route Handlers — not in client components.
- **API routes**: All Route Handlers live in `src/app/api/`. Return `Response` or use `NextResponse`.
- **Environment variables**: Use `NEXT_PUBLIC_` prefix only for variables safe to expose to the browser.

## Supabase

### Database
- Query data using the `@supabase/supabase-js` client directly — no Prisma or ORM layer.
- **Profiles RLS**: any authenticated user can read any profile row (required for showing names/photos in the rooms feature). Write policies remain user-scoped.
- Schema changes go in `supabase/migrations/` as SQL files, or via the Supabase dashboard SQL editor.
- Supabase can auto-generate TypeScript types from your schema: `npx supabase gen types typescript`.

### Auth
- `src/app/auth/callback/route.ts` must be registered as a redirect URI in both Google Cloud Console and the Supabase dashboard.

### Environment variables
Add to `.env.local` and Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL=        # project URL — safe to expose to browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # public anon key — safe to expose to browser
SUPABASE_SERVICE_ROLE_KEY=       # secret — server-side only, never use NEXT_PUBLIC_
MAGICAPI_KEY=                    # api.market key — server-side only
```

## Styling

- CSS Modules with SCSS (`.module.scss`) per component — no global class leakage.
- Global styles and resets in `src/styles/globals.scss`.
- SCSS variables (colors, spacing, breakpoints) in `src/styles/_variables.scss`.
- No inline styles except for truly dynamic runtime values.
- No Tailwind or CSS-in-JS — plain SCSS only.

## Core features

### Play together — `/action`
**Status: implemented (MVP).** Users create a room with a message, meeting location, trail level, and expiry time. Other users can see open rooms, join/leave them, and see who else has joined (name + photo).

**Tables:** `rooms` (one active room per creator), `room_joins` (unique per user/room). Both have RLS — anyone authenticated can read; only the creator can delete a room; only the joining user can insert/delete their own join.

**Files:** `src/app/(app)/action/` — `page.tsx` (Server Component, fetches all data), `CreateRoomForm.tsx` (create or view/delete own room), `RoomList.tsx` (join/leave + displays names and photos).

**Not yet:** resort/landmark selector (free-text for now), matching by skill level, push notifications.

### Profile skill level
- Add `skill_level` (enum: Beginner, Intermediate, Advanced, Expert) to the `profiles` table
- Used as a matching criterion for the beacon feature
- **Status: not yet implemented — next task**

### Resort & landmark data
**Status: not yet implemented.** Planned tables:
- `resorts`: id, name, state, country, osm_id, center_lat, center_lon, boundary (GeoJSON)
- `landmarks`: id, resort_id FK, name, type (`lift`/`facility`), subtype, osm_id

Data source: OpenStreetMap via Overpass API (free). One-time Node.js seed script planned.

## Testing

Testing is not yet set up. Plan: Vitest + @testing-library/react. No test commands exist yet.

## Security & privacy reminders

- Treat location and contact information as sensitive: require explicit opt-in, store with minimal precision when possible (e.g., rounded coordinates), and provide short retention periods for meetup-related data unless the user opts in to longer storage.
- When documenting or requesting code changes via Claude that touch PII, include explicit privacy constraints in the task template.

## Workflow

Before implementing any feature, create `docs/exec-plans/YYYY-MM-DD-slug.md` with the execution plan and commit it alongside the feature code.

## Repository

- Remote: https://github.com/aingoppa/onsnow
- Deployed: https://onsnow.vercel.app (auto-deploys on push to `main`)
