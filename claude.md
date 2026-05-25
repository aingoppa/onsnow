# onsnow

A SaaS web application for snow sports and ski resort enthusiasts — covering resort conditions, trail maps, trip planning, and related features.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: SCSS with CSS Modules (`.module.scss` per component)
- **Database**: PostgreSQL via Prisma ORM
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
│   ├── db/                 # Prisma client and query helpers
│   └── types/              # Shared TypeScript types/interfaces
└── styles/                 # Global styles
    ├── globals.scss         # Global resets and base styles
    └── _variables.scss      # SCSS variables and mixins
```

## Dev Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint
npm run typecheck # Run tsc --noEmit
```

## Code Conventions

- **TypeScript**: Strict mode, no `any`. Define types in `src/lib/types/`.
- **Components**: PascalCase filenames. Co-locate `Component.module.scss` alongside `Component.tsx`.
- **Server vs Client**: Default to React Server Components. Add `'use client'` only when interactivity or browser APIs are required.
- **Data fetching**: Fetch in Server Components or Route Handlers — not in client components.
- **API routes**: All Route Handlers live in `src/app/api/`. Return `Response` or use `NextResponse`.
- **Environment variables**: Use `NEXT_PUBLIC_` prefix only for variables safe to expose to the browser.

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

## Security & privacy reminders

- Treat location and contact information as sensitive: require explicit opt-in, store with minimal precision when possible (e.g., rounded coordinates), and provide short retention periods for meetup-related data unless the user opts in to longer storage.
- When documenting or requesting code changes via Claude that touch PII, include explicit privacy constraints in the task template.

## Repository

- Remote GitHub: https://github.com/aingoppa/onsnow
- Sync notes: this workspace will be pushed to the repository above. Ensure `.gitignore` excludes `node_modules`, `.env*`, and local IDE files. Use a clear default branch name (e.g., `main`) and small, focused commits. Consider adding a CONTRIBUTING.md with branch and PR guidelines when ready.
