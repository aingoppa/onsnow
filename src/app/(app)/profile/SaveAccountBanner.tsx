'use client'

/**
 * SaveAccountBanner — Client Component.
 *
 * Shown on the profile page when the current user is anonymous (guest).
 * Offers two upgrade paths:
 *  1. Link Google via OAuth (supabase.auth.linkIdentity)
 *  2. Add email + password (supabase.auth.updateUser)
 *
 * On successful upgrade the user is no longer anonymous and the banner
 * is hidden. All their data (profile, rooms, joins) is preserved.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'

export default function SaveAccountBanner() {
  const router = useRouter()
  const supabase = getBrowserClient()

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLinkGoogle() {
    setError(null)
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    // On success the browser navigates to Google — no further action needed here
  }

  async function handleAddEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // updateUser adds credentials to the existing anonymous account
    const { error } = await supabase.auth.updateUser({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Refresh so the server re-reads is_anonymous (now false)
    router.refresh()
  }

  return (
    <div role="alert">
      <p><strong>You&apos;re using a guest account.</strong> Save it to keep access after signing out.</p>

      <button type="button" onClick={handleLinkGoogle}>
        Save with Google
      </button>

      {!showEmailForm && (
        <button type="button" onClick={() => setShowEmailForm(true)}>
          Save with email &amp; password
        </button>
      )}

      {showEmailForm && (
        <form onSubmit={handleAddEmail}>
          <div>
            <label htmlFor="save-email">Email</label>
            <input
              id="save-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="save-password">Password</label>
            <input
              id="save-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save account'}
          </button>
          <button type="button" onClick={() => setShowEmailForm(false)}>Cancel</button>
        </form>
      )}

      {error && !showEmailForm && <p role="alert">{error}</p>}
    </div>
  )
}
