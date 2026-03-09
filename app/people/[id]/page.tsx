import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !person) notFound()

  const initials = person.name
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const age = person.birthday
    ? Math.floor(
        (Date.now() - new Date(person.birthday + 'T00:00:00').getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          &larr; Back to Family
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 px-8 pt-8 pb-6 flex flex-col items-center text-center gap-3">
          <Link
            href={`/people/${id}/edit`}
            className="absolute top-4 right-4 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            Edit
          </Link>

          <div className="w-28 h-28 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center ring-4 ring-white shadow-lg">
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-amber-600">{initials}</span>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">{person.name}</h1>
            {person.nickname && (
              <p className="text-sm text-slate-400 mt-0.5">"{person.nickname}"</p>
            )}
            <span className="mt-2 inline-block bg-amber-100 text-amber-700 text-sm font-semibold px-3 py-0.5 rounded-full">
              {person.relationship}
            </span>
          </div>

          {person.bio && (
            <p className="text-sm text-slate-500 italic max-w-md">"{person.bio}"</p>
          )}
        </div>

        <div className="divide-y divide-slate-50">

          {/* ── Contact ── */}
          {(person.email || person.phone || person.instagram) && (
            <Section label="Contact" color="text-slate-500">
              {person.email && (
                <Field label="Email">
                  <a href={`mailto:${person.email}`} className="text-amber-600 hover:underline">{person.email}</a>
                </Field>
              )}
              {person.phone && (
                <Field label="Phone">
                  <a href={`tel:${person.phone}`} className="text-amber-600 hover:underline">{person.phone}</a>
                </Field>
              )}
              {person.instagram && (
                <Field label="Instagram">
                  <a
                    href={`https://instagram.com/${person.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:underline font-medium"
                  >
                    @{person.instagram.replace('@', '')}
                  </a>
                </Field>
              )}
            </Section>
          )}

          {/* ── Career ── */}
          {(person.occupation || person.employer || person.education) && (
            <Section label="Career & Education" color="text-violet-500">
              {person.occupation && (
                <Field label="Occupation">
                  <Chip label={person.occupation} className="bg-violet-50 text-violet-700 border-violet-200" />
                </Field>
              )}
              {person.employer && (
                <Field label="Employer">
                  <Chip label={person.employer} className="bg-violet-50 text-violet-700 border-violet-200" />
                </Field>
              )}
              {person.education && (
                <Field label="Education">
                  <Chip label={person.education} className="bg-indigo-50 text-indigo-700 border-indigo-200" />
                </Field>
              )}
            </Section>
          )}

          {/* ── Personal ── */}
          {(person.birthday || person.hometown || person.religion || person.political_affiliation || person.languages) && (
            <Section label="Personal" color="text-sky-500">
              {person.birthday && (
                <Field label="Birthday">
                  <Chip
                    label={`${new Date(person.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${age !== null ? `  ·  ${age} yrs` : ''}`}
                    className="bg-sky-50 text-sky-700 border-sky-200"
                  />
                </Field>
              )}
              {person.hometown && (
                <Field label="Hometown">
                  <Chip label={person.hometown} className="bg-emerald-50 text-emerald-700 border-emerald-200" />
                </Field>
              )}
              {person.religion && (
                <Field label="Religion">
                  <Chip label={person.religion} className="bg-amber-50 text-amber-700 border-amber-200" />
                </Field>
              )}
              {person.political_affiliation && (
                <Field label="Politics">
                  <Chip label={person.political_affiliation} className="bg-rose-50 text-rose-700 border-rose-200" />
                </Field>
              )}
              {person.languages && (
                <Field label="Languages">
                  <Chip label={person.languages} className="bg-orange-50 text-orange-700 border-orange-200" />
                </Field>
              )}
            </Section>
          )}

          {/* ── Location ── */}
          {(person.address || (person.latitude && person.longitude)) && (
            <Section label="Location" color="text-emerald-500">
              {person.address && <Field label="Address">{person.address}</Field>}
              {person.latitude && person.longitude && (
                <Field label="On map">
                  <Link href="/map" className="text-amber-600 hover:underline text-sm">
                    View on map
                  </Link>
                </Field>
              )}
            </Section>
          )}

        </div>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="px-6 py-5">
      <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${color}`}>{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <p className="text-xs font-medium text-slate-400 w-24 pt-0.5 flex-shrink-0">{label}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}

function Chip({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${className}`}>
      {label}
    </span>
  )
}
