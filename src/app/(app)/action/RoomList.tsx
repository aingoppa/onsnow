'use client'

/**
 * RoomList — Client Component.
 *
 * Renders the list of active rooms. Each room shows its details, the number
 * of users who have joined, and a Join / Leave button (hidden for the creator).
 *
 * Props:
 *   rooms  — active rooms with pre-computed join_count, is_joined, is_own flags
 *   userId — current user's id, used to optimistically track join state
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'
import type { RoomWithMeta } from '@/lib/types/room'

interface Props {
  rooms: RoomWithMeta[]
  userId: string
}

export default function RoomList({ rooms, userId }: Props) {
  const router = useRouter()
  const supabase = getBrowserClient()

  // Track per-room loading state to disable buttons while a request is in flight
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin(roomId: string) {
    setError(null)
    setLoadingRoomId(roomId)

    const { error: dbError } = await supabase
      .from('room_joins')
      .insert({ room_id: roomId, user_id: userId })

    setLoadingRoomId(null)

    if (dbError) {
      setError(dbError.message)
      return
    }

    // Re-fetch from server to get accurate join count
    router.refresh()
  }

  async function handleLeave(roomId: string) {
    setError(null)
    setLoadingRoomId(roomId)

    const { error: dbError } = await supabase
      .from('room_joins')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    setLoadingRoomId(null)

    if (dbError) {
      setError(dbError.message)
      return
    }

    router.refresh()
  }

  if (rooms.length === 0) {
    return <p>No rooms open right now. Be the first to create one!</p>
  }

  return (
    <div>
      {error && <p role="alert">{error}</p>}

      {rooms.map((room) => {
        const isLoading = loadingRoomId === room.id

        return (
          <div key={room.id}>
            <p><strong>{room.message}</strong></p>
            <p>Location: {room.meeting_location}</p>
            <p>Trail level: {room.trail_level}</p>
            <p>Expires: {new Date(room.expires_at).toLocaleString()}</p>
            <p>Riders interested: {room.join_count}</p>

            {/* Creator sees their own room but can't join it */}
            {room.is_own && <p><em>(Your room)</em></p>}

            {!room.is_own && (
              room.is_joined ? (
                <button
                  type="button"
                  onClick={() => handleLeave(room.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Leaving…' : 'Leave'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleJoin(room.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Joining…' : 'Join'}
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
