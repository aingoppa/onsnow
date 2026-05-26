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

export const metadata = {
  title: 'My Profile — onsnow',
}

export default async function ProfilePage() {
  const supabase = await createServerClient()

  // Get the logged-in user from the session
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware protects this route, but double-check just in case
  if (!user) redirect('/sign-in')

  // Fetch the profile row for this user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  // New user — no profile yet, send them to the edit form to complete setup
  if (!profile) redirect('/profile/edit')

  return (
    <main>
      <h1>My Profile</h1>

      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Birth year:</strong> {profile.birth_year}</p>

      {profile.gender && (
        <p>
          <strong>Gender:</strong>{' '}
          {profile.gender === 'Custom' ? profile.custom_gender : profile.gender}
        </p>
      )}

      <p><strong>Location:</strong> {profile.city}, {profile.state}, {profile.country}</p>

      {profile.phone && (
        <p><strong>Phone:</strong> {profile.phone}</p>
      )}

      <Link href="/profile/edit">Edit profile</Link>
    </main>
  )
}
