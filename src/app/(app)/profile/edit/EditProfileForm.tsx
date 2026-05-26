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

import { useState } from 'react'
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

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save profile'}
      </button>

    </form>
  )
}
