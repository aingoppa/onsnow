/**
 * /action page — Server Component.
 *
 * Fetches active rooms and the current user's state (own room, joined rooms)
 * on the server, then passes the data down to interactive Client Components.
 */

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Room, RoomWithMeta } from '@/lib/types/room'
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

  // All active rooms with their join counts
  const { data: rawRooms } = await supabase
    .from('rooms')
    .select('*, room_joins(count)')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })

  // Rooms the current user has already joined
  const { data: userJoins } = await supabase
    .from('room_joins')
    .select('room_id')
    .eq('user_id', user.id)

  const joinedRoomIds = new Set((userJoins ?? []).map((j) => j.room_id as string))

  // Merge join count and user state into each room
  const rooms: RoomWithMeta[] = (rawRooms ?? []).map((r) => ({
    id: r.id as string,
    creator_id: r.creator_id as string,
    message: r.message as string,
    meeting_location: r.meeting_location as string,
    trail_level: r.trail_level,
    expires_at: r.expires_at as string,
    created_at: r.created_at as string,
    // Supabase returns counts as [{ count: N }]
    join_count: (r.room_joins as { count: number }[])[0]?.count ?? 0,
    is_joined: joinedRoomIds.has(r.id as string),
    is_own: r.creator_id === user.id,
  }))

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
