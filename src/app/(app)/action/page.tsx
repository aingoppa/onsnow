/**
 * /action page — Server Component.
 *
 * Fetches active rooms and the current user's state (own room, joined rooms)
 * on the server, then passes the data down to interactive Client Components.
 */

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Room, RoomWithMeta, Joiner } from '@/lib/types/room'
import CreateRoomForm from './CreateRoomForm'
import RoomList from './RoomList'

export const metadata = {
  title: 'Play Together — onsnow',
}

export default async function ActionPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const now = new Date().toISOString()

  // The current user's active room (at most one)
  const { data: userRoom } = await supabase
    .from('rooms')
    .select('*')
    .eq('creator_id', user.id)
    .gt('expires_at', now)
    .maybeSingle<Room>()

  // All active rooms with creator and joiner profiles (name + photo).
  // profiles!creator_id — follows the creator_id FK to profiles.
  // room_joins → profiles!user_id — each joiner's profile.
  const { data: rawRooms } = await supabase
    .from('rooms')
    .select('*, profiles!creator_id(name, photo_url, photo_uploaded_at), room_joins(user_id, profiles!user_id(name, photo_url, photo_uploaded_at))')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  // Rooms the current user has already joined
  const { data: userJoins } = await supabase
    .from('room_joins')
    .select('room_id')
    .eq('user_id', user.id)

  const joinedRoomIds = new Set((userJoins ?? []).map((j) => j.room_id as string))

  // Photos from api.market expire after 7 days — resolve to null if expired
  const PHOTO_TTL_MS = 7 * 24 * 60 * 60 * 1000
  function resolvePhoto(url: string | null, uploadedAt: string | null): string | null {
    if (!url || !uploadedAt) return null
    return Date.now() - new Date(uploadedAt).getTime() < PHOTO_TTL_MS ? url : null
  }

  type RawProfile = { name: string; photo_url: string | null; photo_uploaded_at: string | null } | null

  // Merge creator name/photo, joiner list, and user state into each room
  const rooms: RoomWithMeta[] = (rawRooms ?? []).map((r) => {
    const creatorProfile = r.profiles as RawProfile
    const rawJoins = r.room_joins as { user_id: string; profiles: RawProfile }[]

    const joiners: Joiner[] = rawJoins.map((j) => ({
      user_id: j.user_id,
      name: j.profiles?.name ?? 'Unknown',
      photo_url: resolvePhoto(j.profiles?.photo_url ?? null, j.profiles?.photo_uploaded_at ?? null),
    }))

    return {
      id: r.id as string,
      creator_id: r.creator_id as string,
      creator_name: creatorProfile?.name ?? 'Unknown',
      creator_photo_url: resolvePhoto(creatorProfile?.photo_url ?? null, creatorProfile?.photo_uploaded_at ?? null),
      message: r.message as string,
      meeting_location: r.meeting_location as string,
      trail_level: r.trail_level,
      expires_at: r.expires_at as string,
      created_at: r.created_at as string,
      joiners,
      join_count: joiners.length,
      is_joined: joinedRoomIds.has(r.id as string),
      is_own: r.creator_id === user.id,
    }
  })

  return (
    <main>
      <h1>Play Together</h1>
      <p>Create a room to find someone to ride with, or join an existing one.</p>

      {/* Create form — also shows "My room" card if user already has one */}
      <CreateRoomForm userId={user.id} userRoom={userRoom ?? null} />

      <hr />

      <h2>Available rooms</h2>
      <RoomList rooms={rooms} userId={user.id} />
    </main>
  )
}
