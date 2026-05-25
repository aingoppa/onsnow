/**
 * Sign-up page — Server Component.
 *
 * Shell page that renders on the server. The form itself is a Client Component
 * because it handles input state and calls Supabase Auth.
 */

import SignUpForm from './SignUpForm'

export const metadata = {
  title: 'Sign up — onsnow',
}

export default function SignUpPage() {
  return (
    <main>
      <h1>Create your onsnow account</h1>
      <SignUpForm />
    </main>
  )
}
