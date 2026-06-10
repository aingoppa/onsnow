# Play Together Rooms — /action

## What
Primary product feature. Users create a meetup room at `/action` with a message, meeting location, trail level, and expiry time. Other users can join/leave rooms and see who else has joined (name + photo).

## Approach
- Two new tables: `rooms` (one active per creator, enforced in app) and `room_joins` (unique per user/room)
- RLS: any authenticated user can read active rooms and joins; only creator can delete their room; only joining user can insert/delete their join
- Profiles RLS updated: all authenticated users can read any profile (needed for showing names/photos)
- `/action` page: Server Component fetches rooms + creator profiles + joiner profiles in one query using FK hints (`profiles!creator_id`, `profiles!user_id`)
- Photo TTL resolved server-side — client receives `string | null`
- Client components: `CreateRoomForm` (create or view/delete own room), `RoomList` (join/leave + display)

## Files
- `supabase/migrations/20260608_create_rooms.sql`
- `supabase/migrations/20260608_profiles_public_read.sql`
- `src/lib/types/room.ts`
- `src/app/(app)/action/page.tsx`
- `src/app/(app)/action/CreateRoomForm.tsx`
- `src/app/(app)/action/RoomList.tsx`
