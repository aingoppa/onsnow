/**
 * TypeScript types for the profiles table.
 *
 * These match the columns defined in supabase/migrations/20260525_create_profiles.sql
 * and the simplification in 20260610_simplify_profiles.sql.
 */

/** Valid gender options — must match the gender_type enum in the database */
export type Gender = 'Male' | 'Female' | 'Rather not say' | 'Custom'

/** A full profile row as returned from Supabase */
export interface Profile {
  id: string           // UUID — matches auth.users.id
  name: string
  birth_year: number | null
  gender: Gender | null
  custom_gender: string | null
  phone: string | null
  photo_url: string | null        // CDN URL from api.market; expires after 7 days
  photo_uploaded_at: string | null // ISO timestamp — used to compute expiry
  created_at: string
  updated_at: string
}

/**
 * The fields the user submits when creating or updating their profile.
 * Omits id, created_at, updated_at (set by DB) and photo fields (managed
 * separately via /api/photo/upload).
 */
export type ProfileUpdate = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'photo_url' | 'photo_uploaded_at'>
