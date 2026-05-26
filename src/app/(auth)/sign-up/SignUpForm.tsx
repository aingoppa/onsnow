'use client'

/**
 * Sign-up form — Client Component.
 *
 * Handles two sign-up paths:
 *  1. Email + password → supabase.auth.signUp()
 *     Supabase sends a confirmation email. Until confirmed, the user
 *     cannot sign in with email/password.
 *  2. Google OAuth → supabase.auth.signInWithOAuth()
 *     Same flow as sign-in — Google handles account creation automatically.
 */

import { useState } from 'react'
import Link from 'next/link'
import { getBrowserClient } from '@/lib/supabase/browser'

export default function SignUpForm() {
  const supabase = getBrowserClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEmailSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Supabase sends a confirmation email — tell the user to check their inbox
    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignUp() {
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
  }

  if (success) {
    return (
      <p>
        Check your email at <strong>{email}</strong> to confirm your account.
      </p>
    )
  }

  return (
    <div>
      <form onSubmit={handleEmailSignUp}>
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
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p>or</p>

      <button type="button" onClick={handleGoogleSignUp}>
        Continue with Google
      </button>

      <p>
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </div>
  )
}
