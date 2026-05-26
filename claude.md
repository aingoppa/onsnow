# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# onsnow

A SaaS web application that connects snow sports enthusiasts — skiers, snowboarders, snowshoers, and more — so they can find partners to ride with, coordinate carpooling, and combine purchases like group lift ticket discounts.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: SCSS with CSS Modules (`.module.scss` per component)
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js` — no Prisma or separate ORM
- **Auth**: Supabase Auth — email/password and Google OAuth (OIDC)
- **API**: Next.js Route Handlers (`src/app/api/`)

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── (auth)/             # Auth-gated route group
│   ├── api/                # Route Handlers
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   └── ui/                 # Generic UI primitives
├── lib/                    # Shared utilities and helpers
│   ├── supabase/           # Supabase client instances (server + browser)
│   └── types/              # Shared TypeScript types/interfaces
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
- `src/app/(app)/` — protected pages (profile, future features). Middleware redirects unauthenticated users to `/sign-in`.
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
`src/middleware.ts` runs on every request and refreshes the Supabase session cookie. Without it, users get silently logged out. It also enforces route protection via `PUBLIC_ROUTES`. **Note:** Next.js 16 deprecated `middleware.ts` in favour of `proxy.ts` — this is a known warning, not yet fixed.

### Profile creation flow
Supabase creates `auth.users` on sign-up automatically. The app creates the `profiles` row manually after the user fills the edit form (`/profile/edit`). The profile page redirects to `/profile/edit` if no profile row exists yet.

## Code Conventions

- **TypeScript**: Strict mode, no `any`. Define types in `src/lib/types/`.
- **Components**: PascalCase filenames. Co-locate `Component.module.scss` alongside `Component.tsx`.
- **Server vs Client**: Default to React Server Components. Add `'use client'` only when interactivity or browser APIs are required.
- **Data fetching**: Fetch in Server Components or Route Handlers — not in client components.
- **API routes**: All Route Handlers live in `src/app/api/`. Return `Response` or use `NextResponse`.
- **Environment variables**: Use `NEXT_PUBLIC_` prefix only for variables safe to expose to the browser.

## Supabase

### Database
- Query data using the `@supabase/supabase-js` client directly — no Prisma or ORM layer.
- **Client files**: `src/lib/supabase/server.ts` (Server Components / Route Handlers) and `src/lib/supabase/browser.ts` (client components).
- Use the **server client** for all data access in Server Components and API routes — it runs with elevated privileges via the service role key.
- Use the **browser client** only for auth state listeners in client components.
- Schema changes go in `supabase/migrations/` as SQL files, or via the Supabase dashboard SQL editor.
- Supabase can auto-generate TypeScript types from your schema: `npx supabase gen types typescript`.

### Auth
- Supports **email/password** signup and **Google OAuth (OIDC)** — both configured in the Supabase dashboard under Authentication → Providers.
- Google sign-in requires a Google Cloud OAuth 2.0 credential; set the Supabase callback URL as an authorized redirect URI in Google Cloud Console.
- On sign-in, Supabase stores the user in `auth.users` and sets a session cookie automatically.
- Link a `profiles` table to `auth.users.id` for app-specific data (display name, skill level, avatar, etc.).

### Environment variables
Add to `.env.local` and Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL=        # project URL — safe to expose to browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # public anon key — safe to expose to browser
SUPABASE_SERVICE_ROLE_KEY=       # secret — server-side only, never use NEXT_PUBLIC_
```

## Styling

- CSS Modules with SCSS (`.module.scss`) per component — no global class leakage.
- Global styles and resets in `src/styles/globals.scss`.
- SCSS variables (colors, spacing, breakpoints) in `src/styles/_variables.scss`.
- No inline styles except for truly dynamic runtime values.
- No Tailwind or CSS-in-JS — plain SCSS only.

## Project purpose & scope

- Onsnow connects snow-sports enthusiasts (skiing, snowboarding, snowshoeing, etc.) so they can find partners to ride with, coordinate car-pooling, and combine purchases like lift tickets or group discounts. Typical flows include creating or joining rides/events, assigning car-pool seats, matching by skill level and schedule, and in-app invites/messages.

## Platform roadmap

- This repository will focus on building the web service first: a Next.js + TypeScript web app and backend APIs (server-rendered and route handlers) powering the core features (profiles, rides/events, matching, messaging, and payment/discount flows).
- Mobile apps for Android and iOS are planned for a later phase and are out of scope for this repository. Design the API and data model with mobile clients in mind (API-first, clear versioning, and authentication tokens) to ease future mobile integration.

## Coding style preferences

- Keep the implementation vanilla and simple: prefer plain React and Node.js without heavy frameworks or unnecessary libraries. Use only well-justified dependencies with clear trade-offs.
- Write code that is easy to read and learn from: prefer explicit, straightforward implementations over clever one-liners or heavy abstraction.
- Documentation in-code: every exported class, function, or module should include concise comments explaining intent, inputs, outputs, side-effects, and rationale. Aim for examples where helpful.
- Learning-oriented notes: include brief inline comments for non-obvious logic to help someone learning React and Node.js understand why a pattern is used.
- Testing: add small, focused tests for core logic (matching, seat allocation, privacy filters). Keep tests simple and readable.
- Avoid: complex build-time magic, obscure DSLs, or large UI frameworks. Keep the stack minimal to accelerate learning and maintenance.

- Styling guidance: apply styles only when required — functionality first. It's acceptable for the UI to be plain or "ugly" during development so long as features work; prefer small, explicit styles over extensive design systems.

## Core features

### Play together (beacon)
The primary product feature. A user triggers a beacon at a ski resort lift or facility. Matched users are notified with the beacon creator's profile, location, and a custom message (e.g. "I'm wearing a blue jacket, meet me at Chair 6 until 11am").

**Matching criteria (MVP):** same resort + same day + overlapping sport type + compatible skill level + preferred lift

**Out of scope for now:** "Trip together" (carpooling coordination), GPS/pin location, trail preferences

#### Beacon flow
1. User selects resort, landmark (lift or facility), date/time window, and writes a message
2. System finds users with matching criteria who are at the same resort that day
3. Matched users receive a notification with the beacon details
4. Beacon auto-expires at the user-specified time

### Profile skill level
- Add `skill_level` (enum: Beginner, Intermediate, Advanced, Expert) to the `profiles` table
- Used as a matching criterion for the beacon feature
- **Status: not yet implemented — next task**

### Resort & landmark data

#### Schema

**resorts table**
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | e.g. "Whistler Blackcomb" |
| state | text | State or province |
| country | text | US or Canada |
| osm_id | bigint | OSM relation ID |
| center_lat | float | Resort center point |
| center_lon | float | Resort center point |
| boundary | jsonb | GeoJSON polygon from OSM |
| created_at | timestamptz | |

**landmarks table**
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| resort_id | uuid | FK → resorts |
| name | text | e.g. "Chair 6", "Day Lodge" |
| type | enum | `lift` or `facility` |
| subtype | text | `chair_lift`, `gondola`, `drag_lift`, `magic_carpet`, `mixed_lift`, `lodge`, `ticket_booth`, `rental_shop`, `restroom` |
| osm_id | bigint | OSM element ID |
| created_at | timestamptz | |

#### OSM seeding
- Data source: **OpenStreetMap** via the **Overpass API** (free, no API key)
- OSM tags used: `aerialway=*` for lifts, `amenity=*` / `tourism=*` for facilities
- A one-time Node.js seeding script queries Overpass for each resort and imports into Supabase
- **Status: not yet implemented — next task after skill_level**

## Testing

Testing is not yet set up — this section documents the agreed approach for when we add it.

### Framework
- **Vitest** — unit and integration tests (preferred over Jest for this stack)
- **@testing-library/react** — React component tests in isolation

### What to test
- **Unit tests**: input validation logic, data mapping, utility functions
- **Integration tests**: Supabase queries (insert, upsert, RLS enforcement)
- **Skip for now**: end-to-end browser tests (Playwright) — too heavy for early stage

### Integration test strategy
- Use a separate **Supabase test project** (free tier) so tests never touch real user data
- Add test project credentials to `.env.test.local` (gitignored)

### What NOT to test
- Supabase Auth itself — it's a third-party service, not our code
- Next.js routing and middleware — framework responsibility

### Commands (once set up)
```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode during development
```

## Claude behavior

- **Ask before acting**: When a request is ambiguous or could be interpreted multiple ways, ask a clarifying question before writing any code or making changes.
- **Explain first**: Before starting a non-trivial task, briefly describe what you are about to do and why — give the user a chance to redirect.
- **No surprises**: Do not make changes beyond what was explicitly asked. If you notice something related that could also be improved, mention it and ask before touching it.
- **Small steps**: Prefer making one focused change at a time rather than large sweeping edits. Confirm direction after each meaningful step if the task is complex.
- **When in doubt, stop and ask** — never guess at intent on decisions that are hard to reverse (schema changes, deleting files, refactoring structure).

## Security & privacy reminders

- Treat location and contact information as sensitive: require explicit opt-in, store with minimal precision when possible (e.g., rounded coordinates), and provide short retention periods for meetup-related data unless the user opts in to longer storage.
- When documenting or requesting code changes via Claude that touch PII, include explicit privacy constraints in the task template.

## Repository

- Remote: https://github.com/aingoppa/onsnow
- Deployed: https://onsnow.vercel.app (auto-deploys on push to `main`)
