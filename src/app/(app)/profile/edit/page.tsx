/**
 * Profile edit page — Server Component.
 *
 * Fetches the existing profile (if any) and passes it to the edit form.
 * If this is a new user with no profile, the form starts empty.
 */

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileForm from './EditProfileForm'
import type { Profile } from '@/lib/types/profile'

export const metadata = {
  title: 'Edit Profile — onsnow',
}

export default async function EditProfilePage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Load existing profile so the form shows current values
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  return (
    <main>
      <h1>{profile ? 'Edit Profile' : 'Complete your profile'}</h1>
      <span>{(await supabase.auth.getUser()).data.user?.email}</span>
      {/* Pass existing profile (or null for new users) to the form */}
      <EditProfileForm profile={profile} />
    </main>
  )
}
