'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ImageCropper from './ImageCropper'
import { Person } from '@/lib/types'

interface PersonFormProps {
  personId?: string
}

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white'

export default function PersonForm({ personId }: PersonFormProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!personId)
  const [previewUrl, setPreviewUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState('')
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    birthday: '',
    bio: '',
    address: '',
    latitude: '',
    longitude: '',
    avatar_url: '',
    parent1_id: '',
    parent2_id: '',
    nickname: '',
    instagram: '',
    occupation: '',
    employer: '',
    hometown: '',
    education: '',
    religion: '',
    political_affiliation: '',
    languages: '',
  })

  useEffect(() => {
    supabase.from('people').select('*').order('name').then(({ data }) => {
      setAllPeople(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!personId) return
    supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setForm({
            name: data.name ?? '',
            relationship: data.relationship ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            birthday: data.birthday ?? '',
            bio: data.bio ?? '',
            address: data.address ?? '',
            latitude: data.latitude?.toString() ?? '',
            longitude: data.longitude?.toString() ?? '',
            avatar_url: data.avatar_url ?? '',
            nickname: data.nickname ?? '',
            instagram: data.instagram ?? '',
            occupation: data.occupation ?? '',
            employer: data.employer ?? '',
            hometown: data.hometown ?? '',
            education: data.education ?? '',
            religion: data.religion ?? '',
            political_affiliation: data.political_affiliation ?? '',
            languages: data.languages ?? '',
            parent1_id: data.parent1_id ?? '',
            parent2_id: data.parent2_id ?? '',
          })
        }
        setFetching(false)
      })
  }, [personId])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file) setCropSrc(URL.createObjectURL(file))
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleCropConfirm(blob: Blob) {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setAvatarFile(file)
    setPreviewUrl(URL.createObjectURL(blob))
    setCropSrc('')
  }

  async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results = await res.json()
      if (results.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
      }
      return null
    } catch {
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let avatar_url = form.avatar_url

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = urlData.publicUrl
      }

      // Geocode address if provided
      let latitude: number | null = form.latitude ? parseFloat(form.latitude) : null
      let longitude: number | null = form.longitude ? parseFloat(form.longitude) : null
      if (form.address) {
        setGeocodeStatus('loading')
        const coords = await geocodeAddress(form.address)
        if (coords) {
          latitude = coords.lat
          longitude = coords.lng
          setGeocodeStatus('found')
        } else {
          setGeocodeStatus('error')
        }
      }

      const payload = {
        name: form.name,
        relationship: form.relationship,
        email: form.email || null,
        phone: form.phone || null,
        birthday: form.birthday || null,
        bio: form.bio || null,
        address: form.address || null,
        latitude,
        longitude,
        avatar_url: avatar_url || null,
        parent1_id: form.parent1_id || null,
        parent2_id: form.parent2_id || null,
        nickname: form.nickname || null,
        instagram: form.instagram || null,
        occupation: form.occupation || null,
        employer: form.employer || null,
        hometown: form.hometown || null,
        education: form.education || null,
        religion: form.religion || null,
        political_affiliation: form.political_affiliation || null,
        languages: form.languages || null,
      }

      if (personId) {
        const { error } = await supabase.from('people').update(payload).eq('id', personId)
        if (error) throw error
        router.push(`/people/${personId}`)
      } else {
        const { data, error } = await supabase.from('people').insert(payload).select().single()
        if (error) throw error
        router.push(`/people/${data.id}`)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!personId) return
    if (!confirm('Delete this person? This cannot be undone.')) return
    await supabase.from('people').delete().eq('id', personId)
    router.push('/')
  }

  if (fetching) {
    return <div className="text-center py-16 text-slate-400">Loading...</div>
  }

  const displayAvatar = previewUrl || form.avatar_url
  const initials = form.name
    ? form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
    {cropSrc && (
      <ImageCropper
        src={cropSrc}
        aspect={1}
        onConfirm={handleCropConfirm}
        onCancel={() => setCropSrc('')}
      />
    )}
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center ring-2 ring-amber-200">
          {displayAvatar ? (
            <img src={displayAvatar} alt="Avatar preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-amber-600">{initials}</span>
          )}
        </div>
        <label className="text-sm font-medium text-amber-600 hover:text-amber-700 cursor-pointer transition-colors">
          {displayAvatar ? 'Change photo' : 'Upload photo'}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name" required>
          <input
            type="text"
            required
            className={INPUT}
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Relationship" required>
          <input
            type="text"
            required
            list="relationships"
            className={INPUT}
            placeholder="e.g. Mom, Dad, Me, Sister"
            value={form.relationship}
            onChange={e => setForm({ ...form, relationship: e.target.value })}
          />
          <datalist id="relationships">
            {['Me', 'Spouse', 'Mom', 'Dad', 'Son', 'Daughter', 'Brother', 'Sister',
              'Grandmother', 'Grandfather', 'Aunt', 'Uncle', 'Cousin'].map(r => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>

        <Field label="Email">
          <input
            type="email"
            className={INPUT}
            placeholder="email@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        <Field label="Phone">
          <input
            type="tel"
            className={INPUT}
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </Field>

        <Field label="Birthday">
          <input
            type="date"
            className={INPUT}
            value={form.birthday}
            onChange={e => setForm({ ...form, birthday: e.target.value })}
          />
        </Field>

        <Field label="Address" hint="Used to place them on the map">
          <input
            type="text"
            className={INPUT}
            placeholder="123 Main St, City, State"
            value={form.address}
            onChange={e => {
              setForm({ ...form, address: e.target.value })
              setGeocodeStatus('idle')
            }}
          />
          {geocodeStatus === 'found' && (
            <p className="text-xs text-green-600 mt-1">Location found</p>
          )}
          {geocodeStatus === 'error' && (
            <p className="text-xs text-amber-500 mt-1">Could not find location — saved address only</p>
          )}
          {geocodeStatus === 'loading' && (
            <p className="text-xs text-slate-400 mt-1">Looking up location...</p>
          )}
        </Field>
      </div>

      {/* Parents */}
      <div className="border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Parents</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Parent 1">
            <select
              className={INPUT}
              value={form.parent1_id}
              onChange={e => setForm({ ...form, parent1_id: e.target.value })}
            >
              <option value="">None</option>
              {allPeople
                .filter(p => p.id !== personId)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relationship})
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Parent 2">
            <select
              className={INPUT}
              value={form.parent2_id}
              onChange={e => setForm({ ...form, parent2_id: e.target.value })}
            >
              <option value="">None</option>
              {allPeople
                .filter(p => p.id !== personId && p.id !== form.parent1_id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relationship})
                  </option>
                ))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="Bio">
        <textarea
          className={`${INPUT} h-28 resize-none`}
          placeholder="A short bio..."
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
        />
      </Field>

      {/* Identity */}
      <div className="border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Identity</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nickname">
            <input
              type="text"
              className={INPUT}
              placeholder='e.g. "Benny"'
              value={form.nickname}
              onChange={e => setForm({ ...form, nickname: e.target.value })}
            />
          </Field>
          <Field label="Instagram">
            <input
              type="text"
              className={INPUT}
              placeholder="@handle"
              value={form.instagram}
              onChange={e => setForm({ ...form, instagram: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Career & Education */}
      <div className="border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Career &amp; Education</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Occupation">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Software Engineer"
              value={form.occupation}
              onChange={e => setForm({ ...form, occupation: e.target.value })}
            />
          </Field>
          <Field label="Employer">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Acme Corp"
              value={form.employer}
              onChange={e => setForm({ ...form, employer: e.target.value })}
            />
          </Field>
          <Field label="Education" hint="Highest level or school">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Stanford University"
              value={form.education}
              onChange={e => setForm({ ...form, education: e.target.value })}
            />
          </Field>
          <Field label="Hometown">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Austin, TX"
              value={form.hometown}
              onChange={e => setForm({ ...form, hometown: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Personal */}
      <div className="border-t border-slate-100 pt-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Personal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Religion">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Catholic, Jewish"
              value={form.religion}
              onChange={e => setForm({ ...form, religion: e.target.value })}
            />
          </Field>
          <Field label="Politics">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. Democrat, Republican"
              value={form.political_affiliation}
              onChange={e => setForm({ ...form, political_affiliation: e.target.value })}
            />
          </Field>
          <Field label="Languages">
            <input
              type="text"
              className={INPUT}
              placeholder="e.g. English, Spanish"
              value={form.languages}
              onChange={e => setForm({ ...form, languages: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {personId ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm font-medium text-red-400 hover:text-red-600 transition-colors"
          >
            Delete person
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Saving...' : personId ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </div>
    </form>
    </>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-slate-400 font-normal ml-1.5 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

