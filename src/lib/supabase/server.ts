/**
 * Supabase server-side client.
 *
 * Use this client in Server Components, Route Handlers, and Server Actions.
 * It reads the session from cookies so the server knows who the logged-in user is.
 *
 * We use @supabase/ssr here instead of @supabase/supabase-js directly because
 * Next.js needs special cookie handling to work correctly with server rendering.
 *
 * Example usage in a Server Component:
 *   const supabase = await createServerClient()
 *   const { data: rides } = await supabase.from('rides').select('*')
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Pass cookie methods so Supabase can read and write the session cookie
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
