# Photo Upload via api.market

## What
Add selfie photo upload to the user profile. Display the photo on the profile page while it's within its 7-day TTL.

## Approach
- New POST `/api/photo/upload` Route Handler — receives the file, forwards to api.market (`POST api.magicapi.dev/api/v1/magicapi/image-upload/upload`, field name `filename`), saves returned URL + upload timestamp to profiles table
- `photo_url` and `photo_uploaded_at` columns added to profiles via migration
- Profile edit form: file picker (triggers native camera on mobile) + webcam capture via `getUserMedia`
- Profile page: show photo only if `Date.now() - photo_uploaded_at < 7 days`
- `ProfileUpdate` type explicitly omits photo fields so the edit form upsert never overwrites them

## Files
- `supabase/migrations/20260608_add_photo_to_profiles.sql`
- `src/app/api/photo/upload/route.ts`
- `src/app/(app)/profile/edit/EditProfileForm.tsx`
- `src/app/(app)/profile/page.tsx`
- `src/lib/types/profile.ts`
