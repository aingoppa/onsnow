/**
 * Next.js middleware — runs on every request before the page renders.
 *
 * Its main job here is to refresh the Supabase session cookie so it doesn't
 * expire while the user is active. Without this, users get logged out
 * unexpectedly even if they're still using the app.
 *
 * It also protects routes that require authentication by redirecting
 * unauthenticated users to the sign-in page.
 *
 * Note: We create a Supabase client directly here (not via server.ts) because
 * middleware uses NextRequest/NextResponse, which have a different cookie API
 * than Server Components.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do not require authentication
const PUBLIC_ROUTES = ['/', '/sign-in', '/sign-up', '/auth']

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  // We need to pass the request into the response so cookies are forwarded correctly
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request and response so they propagate correctly
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this is the main purpose of the middleware
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = '/sign-in'
    return NextResponse.redirect(signInUrl)
  }

  return supabaseResponse
}

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
