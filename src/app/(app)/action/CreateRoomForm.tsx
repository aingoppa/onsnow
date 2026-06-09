'use client'

/**
 * CreateRoomForm — Client Component.
 *
 * Shows either:
 *  - A create form, when the user has no active room.
 *  - A "My room" card with a Close button, when they already have one.
 *
 * Props:
 *   userId   — the current user's id (passed from the server to avoid an extra client query)
 *   userRoom — the user's existing active room, or null
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'
import type { Room, RoomInsert, TrailLevel } from '@/lib/types/room'

const TRAIL_LEVELS: TrailLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

interface Props {
  userId: string
  userRoom: Room | null
}

export default function CreateRoomForm({ userId, userRoom }: Props) {
  const router = useRouter()
  const supabase = getBrowserClient()

  const [message, setMessage] = useState('')
  const [meetingLocation, setMeetingLocation] = useState('')
  const [trailLevel, setTrailLevel] = useState<TrailLevel>('Intermediate')
  // Default expiry: 2 hours from now, formatted for datetime-local input
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000)
    // datetime-local expects "YYYY-MM-DDTHH:MM"
    return d.toISOString().slice(0, 16)
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (new Date(expiresAt) <= new Date()) {
      setError('Expiry time must be in the future.')
      return
    }

    setLoading(true)

    const insert: RoomInsert = {
      message,
      meeting_location: meetingLocation,
      trail_level: trailLevel,
      expires_at: new Date(expiresAt).toISOString(),
    }

    const { error: dbError } = await supabase
      .from('rooms')
      .insert({ creator_id: userId, ...insert })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  async function handleClose() {
    if (!userRoom) return
    setLoading(true)

    const { error: dbError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', userRoom.id)

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.refresh()
  }

  // Show the user's active room if one exists
  if (userRoom) {
    return (
      <section>
        <h2>My room</h2>
        <p><strong>Message:</strong> {userRoom.message}</p>
        <p><strong>Location:</strong> {userRoom.meeting_location}</p>
        <p><strong>Trail level:</strong> {userRoom.trail_level}</p>
        <p><strong>Expires:</strong> {new Date(userRoom.expires_at).toLocaleString()}</p>
        {error && <p role="alert">{error}</p>}
        <button type="button" onClick={handleClose} disabled={loading}>
          {loading ? 'Closing…' : 'Close room'}
        </button>
      </section>
    )
  }

  return (
    <section>
      <h2>Create a room</h2>
      <form onSubmit={handleCreate}>

        <div>
          <label htmlFor="message">Message *</label>
          <input
            id="message"
            type="text"
            placeholder='e.g. "Blue jacket, meet me at Chair 6"'
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="meetingLocation">Meeting location *</label>
          <input
            id="meetingLocation"
            type="text"
            placeholder='e.g. "Chair 6 base" or "Day Lodge entrance"'
            value={meetingLocation}
            onChange={(e) => setMeetingLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="trailLevel">Trail level *</label>
          <select
            id="trailLevel"
            value={trailLevel}
            onChange={(e) => setTrailLevel(e.target.value as TrailLevel)}
          >
            {TRAIL_LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="expiresAt">Open until *</label>
          <input
            id="expiresAt"
            type="datetime-local"
            value={expiresAt}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setExpiresAt(e.target.value)}
            required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create room'}
        </button>

      </form>
    </section>
  )
}
