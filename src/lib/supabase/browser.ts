/**
 * Supabase browser-side client.
 *
 * Use this client in Client Components (files with 'use client') only.
 * Typical use cases: listening to auth state changes, real-time subscriptions.
 *
 * For data fetching, prefer the server client (server.ts) in Server Components
 * or Route Handlers — it is more secure and avoids exposing queries to the browser.
 *
 * We create the client once and reuse it (singleton pattern) to avoid
 * creating a new connection on every render.
 *
 * Example usage in a Client Component:
 *   const supabase = getBrowserClient()
 *   supabase.auth.onAuthStateChange((event, session) => { ... })
 */

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserClient() {
  // Reuse the existing client if already created
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
