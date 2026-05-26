/**
 * TypeScript types for the profiles table.
 *
 * These match the columns defined in supabase/migrations/20260525_create_profiles.sql.
 * Use Profile when reading a full row, and ProfileUpdate when submitting edits.
 */

/** Valid gender options — must match the gender_type enum in the database */
export type Gender = 'Male' | 'Female' | 'Rather not say' | 'Custom'

/** Valid country options — US/Canada only for MVP */
export type Country = 'US' | 'Canada'

/** A full profile row as returned from Supabase */
export interface Profile {
  id: string           // UUID — matches auth.users.id
  name: string
  birth_year: number
  gender: Gender | null
  custom_gender: string | null
  city: string
  state: string
  country: Country
  phone: string | null
  created_at: string   // ISO timestamp string
  updated_at: string
}

/**
 * The fields the user submits when creating or updating their profile.
 * Omits id, created_at, updated_at — those are set by the database.
 */
export type ProfileUpdate = Omit<Profile, 'id' | 'created_at' | 'updated_at'>
