/**
 * OAuth callback handler.
 *
 * After the user authorizes with Google (or any OAuth provider), Supabase
 * redirects them here with a one-time `code` in the query string.
 * We exchange that code for a real session, then send the user to the homepage.
 *
 * This route must be listed as an authorized redirect URI in:
 *   - Google Cloud Console (as: https://<your-domain>/auth/callback)
 *   - Supabase dashboard → Authentication → URL Configuration → Redirect URLs
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    // Exchange the temporary code for a persistent session cookie
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to home after successful sign-in
  return NextResponse.redirect(`${origin}/`)
}
