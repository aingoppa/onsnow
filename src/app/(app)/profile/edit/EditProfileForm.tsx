'use client'

/**
 * Profile edit form — Client Component.
 *
 * Used for both creating a new profile and updating an existing one.
 * Uses Supabase's upsert() which inserts if no row exists, or updates if it does.
 *
 * Props:
 *   profile — existing profile data (null if the user has no profile yet)
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser'
import type { Profile, ProfileUpdate, Gender, Country } from '@/lib/types/profile'

const GENDER_OPTIONS: Gender[] = ['Male', 'Female', 'Rather not say', 'Custom']
const COUNTRY_OPTIONS: Country[] = ['US', 'Canada']

interface Props {
  profile: Profile | null
}

export default function EditProfileForm({ profile }: Props) {
  const router = useRouter()
  const supabase = getBrowserClient()

  // Pre-fill fields with existing profile values, or empty strings for new users
  const [name, setName] = useState(profile?.name ?? '')
  const [birthYear, setBirthYear] = useState(profile?.birth_year?.toString() ?? '')
  const [gender, setGender] = useState<Gender | ''>(profile?.gender ?? '')
  const [customGender, setCustomGender] = useState(profile?.custom_gender ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [state, setState] = useState(profile?.state ?? '')
  const [country, setCountry] = useState<Country | ''>(profile?.country ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Photo upload state — managed independently from the main profile form
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile?.photo_url ?? null)

  // Webcam state
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  // Local preview URL for a just-captured or just-selected image (not yet uploaded)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Attach the camera stream to the video element once the element is in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraActive, cameraStream])

  // Stop all camera tracks when the component unmounts to release the hardware
  useEffect(() => {
    return () => { cameraStream?.getTracks().forEach((t) => t.stop()) }
  }, [cameraStream])

  async function startCamera() {
    setPhotoError(null)
    try {
      // facingMode 'user' selects the front (selfie) camera on phones
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      setCameraStream(stream)
      setCameraActive(true)
    } catch {
      setPhotoError('Camera access denied or not available.')
    }
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop())
    setCameraStream(null)
    setCameraActive(false)
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    // Convert canvas snapshot to a File for upload
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
      setPhotoFile(file)
      setPreviewUrl(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)

    stopCamera()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handlePhotoUpload() {
    if (!photoFile) return
    setPhotoLoading(true)
    setPhotoError(null)

    const formData = new FormData()
    formData.append('file', photoFile)

    const res = await fetch('/api/photo/upload', { method: 'POST', body: formData })
    const json = await res.json() as { url?: string; error?: string }

    if (!res.ok || json.error) {
      setPhotoError(json.error ?? 'Upload failed.')
    } else {
      setPhotoUrl(json.url!)
      setPhotoFile(null)
      setPreviewUrl(null)
    }
    setPhotoLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Basic validation before sending to the database
    if (!name || !birthYear || !city || !state || !country) {
      setError('Please fill in all required fields.')
      return
    }
    if (gender === 'Custom' && !customGender) {
      setError('Please enter your custom gender.')
      return
    }

    const year = parseInt(birthYear, 10)
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setError('Please enter a valid birth year.')
      return
    }

    setLoading(true)

    // Get the current user's id to set as the profile id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in.')
      setLoading(false)
      return
    }

    const updates: ProfileUpdate = {
      name,
      birth_year: year,
      gender: gender || null,
      // Only save custom_gender if gender is Custom
      custom_gender: gender === 'Custom' ? customGender : null,
      city,
      state,
      country: country as Country,
      phone: phone || null,
    }

    // upsert: inserts a new row if id doesn't exist, updates if it does
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    router.push('/profile')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>

      <div>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="birthYear">Birth year *</label>
        <input
          id="birthYear"
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          min={1900}
          max={new Date().getFullYear()}
          required
        />
      </div>

      <div>
        <label htmlFor="gender">Gender</label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender | '')}
        >
          <option value="">Prefer not to say</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Show custom gender input only when Custom is selected */}
      {gender === 'Custom' && (
        <div>
          <label htmlFor="customGender">Custom gender *</label>
          <input
            id="customGender"
            type="text"
            value={customGender}
            onChange={(e) => setCustomGender(e.target.value)}
            maxLength={50}
            required
          />
        </div>
      )}

      <div>
        <label htmlFor="country">Country *</label>
        <select
          id="country"
          value={country}
          onChange={(e) => setCountry(e.target.value as Country | '')}
          required
        >
          <option value="">Select country</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="state">State / Province *</label>
        <input
          id="state"
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="city">City *</label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        <label>Profile photo</label>

        {/* Live webcam feed — shown while camera is active */}
        {cameraActive && (
          <div>
            <video ref={videoRef} autoPlay playsInline width={240} />
            <br />
            <button type="button" onClick={capturePhoto}>Capture</button>
            <button type="button" onClick={stopCamera}>Cancel</button>
          </div>
        )}

        {/* Hidden canvas used to grab a frame from the video stream */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Preview of selected file or captured snapshot, before uploading */}
        {previewUrl && !cameraActive && (
          <img src={previewUrl} alt="Photo preview" width={80} height={80} />
        )}

        {/* Saved photo (already uploaded) */}
        {photoUrl && !previewUrl && !cameraActive && (
          <img src={photoUrl} alt="Current profile photo" width={80} height={80} />
        )}

        {!cameraActive && (
          <div>
            {/* File picker — on mobile this also offers "Take photo" via the OS */}
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {/* Webcam button for desktop — uses getUserMedia directly */}
            <button type="button" onClick={startCamera}>Use webcam</button>
          </div>
        )}

        <button
          type="button"
          onClick={handlePhotoUpload}
          disabled={!photoFile || photoLoading || cameraActive}
        >
          {photoLoading ? 'Uploading…' : 'Upload photo'}
        </button>

        {photoError && <p role="alert">{photoError}</p>}
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save profile'}
      </button>

    </form>
  )
}
