'use client'

import dynamic from 'next/dynamic'
import { Person } from '@/lib/types'

const MapClient = dynamic(() => import('./MapClient'), { ssr: false })

export default function MapWrapper({ people }: { people: Person[] }) {
  return <MapClient people={people} />
}
