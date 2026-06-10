/**
 * Profile page — Server Component.
 *
 * Fetches the current user's profile from Supabase on the server.
 * If no profile exists yet (new user), redirects to /profile/edit to complete setup.
 */

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/lib/types/profile'
import SaveAccountBanner from './SaveAccountBanner'

export const metadata = {
  title: 'My Profile — onsnow',
}

export default async function ProfilePage() {
  const supabase = await createServerClient()

  // Get the logged-in user from the session
  const { data: { user } } = await supabase.auth.getUser()

  // Proxy protects this route, but double-check just in case
  if (!user) redirect('/sign-in')

  // Fetch the profile row for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // New user — no profile yet, send them to the edit form to complete setup
  if (!profile) redirect('/profile/edit')

  // api.market deletes images after 7 days — only show the photo within that window
  const PHOTO_TTL_MS = 7 * 24 * 60 * 60 * 1000
  const photoValid =
    profile.photo_url !== null &&
    profile.photo_uploaded_at !== null &&
    Date.now() - new Date(profile.photo_uploaded_at).getTime() < PHOTO_TTL_MS

  const isAnonymous = user.is_anonymous ?? false

  return (
    <main>
      <h1>My Profile</h1>

      {/* Prompt guest users to save their account before signing out */}
      {isAnonymous && <SaveAccountBanner />}

      {photoValid && (
        <img src={profile.photo_url!} alt="Profile photo" width={120} height={120} />
      )}

      <p><strong>Account:</strong> {user.email ?? 'Guest'}</p>
      <p><strong>Name:</strong> {profile.name}</p>

      {profile.birth_year && (
        <p><strong>Birth year:</strong> {profile.birth_year}</p>
      )}

      {profile.gender && (
        <p>
          <strong>Gender:</strong>{' '}
          {profile.gender === 'Custom' ? profile.custom_gender : profile.gender}
        </p>
      )}

      {profile.phone && (
        <p><strong>Phone:</strong> {profile.phone}</p>
      )}

      <Link href="/profile/edit">Edit profile</Link>
    </main>
  )
}
