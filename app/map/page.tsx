import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import MapWrapper from './MapWrapper'

export default async function MapPage() {
  const { data } = await supabase
    .from('people')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  const people = data ?? []

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Family Map</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {people.length} member{people.length !== 1 ? 's' : ''} with a location
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {people.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400">
            <p className="text-lg mb-2">No locations set yet</p>
            <p className="text-sm mb-6">
              Add latitude and longitude to family members to see them here.
            </p>
            <Link
              href="/"
              className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
            >
              Go to Family Tree
            </Link>
          </div>
        ) : (
          <MapWrapper people={people} />
        )}
      </div>
    </main>
  )
}
