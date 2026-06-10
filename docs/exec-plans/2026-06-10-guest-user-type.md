# Guest User Type + Profile Simplification

## What
Add three user types: OIDC (Google), email/password, and temporary guest. Simplify profiles by dropping city/state/country and making birth year optional.

## Approach
- Guest auth: `supabase.auth.signInAnonymously()` — real auth.users row with `is_anonymous: true`, works with existing RLS
- "Continue as guest" button on sign-in page → `/profile/edit`
- Profile required fields reduced to name + photo (all user types)
- Upgrade path: `SaveAccountBanner` on profile page for anonymous users — link Google (`linkIdentity`) or add email/password (`updateUser`)
- Proxy unchanged — anonymous sessions are real sessions

## Schema change
Drop `city`, `state`, `country`; make `birth_year` nullable.

## Files
- `supabase/migrations/20260610_simplify_profiles.sql`
- `src/lib/types/profile.ts`
- `src/app/(auth)/sign-in/SignInForm.tsx`
- `src/app/(app)/profile/edit/EditProfileForm.tsx`
- `src/app/(app)/profile/page.tsx`
- `src/app/(app)/profile/SaveAccountBanner.tsx` (new)

## Manual steps — completed 2026-06-10
- [x] Enable Anonymous Sign-in in Supabase dashboard
- [x] Run `20260610_simplify_profiles.sql` migration (drop city/state/country, birth_year nullable)
