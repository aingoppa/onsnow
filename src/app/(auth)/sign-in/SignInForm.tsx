'use client'

/**
 * Sign-in form — Client Component.
 *
 * Marked 'use client' because it manages form state and calls Supabase Auth
 * methods that must run in the browser.
 *
 * Two sign-in methods:
 *  1. Email + password  → supabase.auth.signInWithPassword()
 *  2. Google OAuth      → supabase.auth.signInWithOAuth()
 *     After Google auth, the browser is redirected to /auth/callback which
 *     exchanges the OAuth code for a session.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/browser'

export default function SignInForm() {
  const router = useRouter()
  const supabase = getBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Redirect to profile on success — profile page redirects to /profile/edit if no profile yet
    router.push('/profile')
    router.refresh()
  }

  async function handleGuestSignIn() {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInAnonymously()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Guest has no profile yet — send them straight to setup
    router.push('/profile/edit')
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // After Google auth, Supabase redirects here to exchange the code for a session
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
    // On success the browser navigates to Google — no further action needed here
  }

  return (
    <div>
      <form onSubmit={handleEmailSignIn}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {/* Show any auth error to the user */}
        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p>or</p>

      <button type="button" onClick={handleGoogleSignIn}>
        Continue with Google
      </button>

      <p>
        Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
      </p>

      <p>or</p>

      <button type="button" onClick={handleGuestSignIn} disabled={loading}>
        Continue as guest
      </button>
    </div>
  )
}
