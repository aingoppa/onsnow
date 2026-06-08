/**
 * POST /api/photo/upload
 *
 * Receives a multipart/form-data request with a "file" field, forwards the
 * image to api.market (MagicAPI), and saves the returned CDN URL plus the
 * current timestamp to the user's profile row.
 *
 * api.market deletes uploaded images after 7 days — the timestamp lets the
 * profile page decide whether the URL is still valid before showing it.
 *
 * Request:  multipart/form-data, field name "file"
 * Response: { url: string } on success, { error: string } on failure
 */

import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAGICAPI_UPLOAD_URL = 'https://api.magicapi.dev/api/v1/magicapi/image-upload/upload'

export async function POST(request: Request) {
  const supabase = await createServerClient()

  // Verify the user is signed in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Extract the file from the incoming form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Forward the file to api.market — their API expects the field name "filename"
  const uploadForm = new FormData()
  uploadForm.append('filename', file)

  const magicRes = await fetch(MAGICAPI_UPLOAD_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'x-magicapi-key': process.env.MAGICAPI_KEY!,
    },
    body: uploadForm,
  })

  if (!magicRes.ok) {
    const text = await magicRes.text()
    return NextResponse.json({ error: `Upload failed: ${text}` }, { status: 500 })
  }

  const { url } = await magicRes.json() as { url: string }

  // Persist the URL and upload timestamp to the user's profile row
  const { error: dbError } = await supabase
    .from('profiles')
    .update({ photo_url: url, photo_uploaded_at: new Date().toISOString() })
    .eq('id', user.id)

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ url })
}
