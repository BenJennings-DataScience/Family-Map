import PersonForm from '@/components/PersonForm'
import Link from 'next/link'

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/people/${id}`}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          &larr; Back to Profile
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Edit Profile</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <PersonForm personId={id} />
      </div>
    </main>
  )
}
