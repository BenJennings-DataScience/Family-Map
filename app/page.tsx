import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Person } from '@/lib/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function getAge(birthday: string | null): number | null {
  if (!birthday) return null
  return Math.floor(
    (Date.now() - new Date(birthday + 'T00:00:00').getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )
}

function getCity(address: string | null): string | null {
  if (!address) return null
  const parts = address.split(',').map(p => p.trim())
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? null
}

// ── Chip colour map (full class strings — no dynamic concatenation) ───────────
const CHIPS = {
  location:  'bg-emerald-50  text-emerald-700  border-emerald-200',
  age:       'bg-sky-50       text-sky-700       border-sky-200',
  occupation:'bg-violet-50   text-violet-700   border-violet-200',
  education: 'bg-indigo-50   text-indigo-700   border-indigo-200',
  religion:  'bg-amber-50    text-amber-700    border-amber-200',
  political: 'bg-rose-50     text-rose-700     border-rose-200',
  languages: 'bg-orange-50   text-orange-700   border-orange-200',
  instagram: 'bg-pink-50     text-pink-700     border-pink-200',
}

function Chip({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${style}`}>
      {label}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { data } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: true })

  const people: Person[] = data ?? []

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Family</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {people.length} member{people.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/people/new"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
        >
          + Add Person
        </Link>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-32">
          <p className="text-slate-400 text-xl mb-2">No family members yet</p>
          <p className="text-slate-400 text-sm mb-8">Add your first family member to get started</p>
          <Link
            href="/people/new"
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Add Family Member
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {people.map(person => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </main>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: Person }) {
  const initials = person.name
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const age  = getAge(person.birthday)
  const city = getCity(person.address)

  // Build ordered chip list — first 4 filled fields shown
  const chips: { label: string; style: string }[] = []
  if (city)                        chips.push({ label: city,                          style: CHIPS.location  })
  if (age !== null)                chips.push({ label: `${age} yrs`,                  style: CHIPS.age       })
  if (person.occupation)           chips.push({ label: person.occupation,              style: CHIPS.occupation })
  if (person.education)            chips.push({ label: person.education,               style: CHIPS.education })
  if (person.religion)             chips.push({ label: person.religion,                style: CHIPS.religion  })
  if (person.political_affiliation)chips.push({ label: person.political_affiliation,  style: CHIPS.political })
  if (person.languages)            chips.push({ label: person.languages,               style: CHIPS.languages })
  if (person.instagram)            chips.push({ label: `@${person.instagram}`,         style: CHIPS.instagram })

  const visibleChips = chips.slice(0, 4)

  return (
    <Link href={`/people/${person.id}`}>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
        {/* Avatar */}
        <div className="flex flex-col items-center pt-5 pb-3 px-3 gap-2">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-amber-100 flex items-center justify-center ring-[3px] ring-white shadow-md flex-shrink-0">
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-amber-600">{initials}</span>
            )}
          </div>

          {/* Name + nickname */}
          <div className="text-center">
            <p className="font-bold text-slate-800 text-sm leading-tight">{person.name}</p>
            {person.nickname && (
              <p className="text-[11px] text-slate-400 mt-0.5">"{person.nickname}"</p>
            )}
          </div>

          {/* Relationship badge */}
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {person.relationship}
          </span>
        </div>

        {/* Bio snippet */}
        {person.bio && (
          <div className="px-3 pb-2">
            <p className="text-[11px] text-slate-400 italic line-clamp-2 text-center">
              "{person.bio}"
            </p>
          </div>
        )}

        {/* Chips */}
        {visibleChips.length > 0 && (
          <div className="px-3 pb-4 flex flex-wrap gap-1 justify-center">
            {visibleChips.map((chip, i) => (
              <Chip key={i} label={chip.label} style={chip.style} />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
