/**
 * TypeScript types for the rooms and room_joins tables.
 *
 * These match the columns defined in supabase/migrations/20260608_create_rooms.sql.
 */

/** Must match the trail_level_type enum in the database */
export type TrailLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

/** A full room row as returned from Supabase */
export interface Room {
  id: string
  creator_id: string
  message: string
  meeting_location: string
  trail_level: TrailLevel
  expires_at: string   // ISO timestamp
  created_at: string
}

/** Fields submitted when creating a room — id, creator_id, and created_at are set by the DB */
export type RoomInsert = Omit<Room, 'id' | 'created_at' | 'creator_id'>

/** Room row augmented with join count and current-user join state, used in the list view */
export interface RoomWithMeta extends Room {
  join_count: number
  is_joined: boolean   // whether the current user has joined this room
  is_own: boolean      // whether the current user created this room
}
