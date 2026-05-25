/**
 * Sign-in page — Server Component.
 *
 * This page itself has no interactivity, so it renders on the server.
 * The actual form logic lives in SignInForm (a Client Component) because
 * it needs to handle input state and call Supabase on the client side.
 */

import SignInForm from './SignInForm'

export const metadata = {
  title: 'Sign in — onsnow',
}

export default function SignInPage() {
  return (
    <main>
      <h1>Sign in to onsnow</h1>
      <SignInForm />
    </main>
  )
}
