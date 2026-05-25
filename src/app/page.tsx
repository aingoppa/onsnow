/**
 * Home page — Server Component.
 *
 * Reads the current user from the Supabase session on the server.
 * Shows a welcome message if signed in, or links to sign in / sign up if not.
 */

import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main>
      <h1>onsnow</h1>
      <p>Find snow sports partners, coordinate carpools, and get group lift ticket discounts.</p>

      {user ? (
        <p>Welcome back, {user.email}</p>
      ) : (
        <div>
          <Link href="/sign-in">Sign in</Link>
          {' | '}
          <Link href="/sign-up">Create account</Link>
        </div>
      )}
    </main>
  )
}
