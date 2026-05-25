/**
 * Root layout — wraps every page in the app.
 *
 * In Next.js App Router, layout.tsx at the top of src/app/ applies to all routes.
 * We import global styles here so they load on every page.
 */

import type { Metadata } from 'next'
import '@/styles/globals.scss'

export const metadata: Metadata = {
  title: 'onsnow',
  description: 'Find snow sports partners, coordinate carpools, and get group lift ticket discounts.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
