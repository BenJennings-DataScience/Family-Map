import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import FamilyTree from './FamilyTree'

export default async function TreePage() {
  const { data } = await supabase.from('people').select('*').order('created_at')
  const people = data ?? []

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Family Tree</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Set parents on each person&apos;s edit page to build the tree
          </p>
        </div>
        <Link
          href="/people/new"
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          + Add Person
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <FamilyTree people={people} />
      </div>
    </main>
  )
}
