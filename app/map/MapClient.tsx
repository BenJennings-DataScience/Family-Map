'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import { Person } from '@/lib/types'

const MAP_STYLES = [
  {
    id: 'street',
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  },
  {
    id: 'topo',
    label: 'Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors',
  },
] as const

type StyleId = typeof MAP_STYLES[number]['id']

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function createPersonIcon(person: Person) {
  const size = 52
  const inner = person.avatar_url
    ? `<img src="${person.avatar_url}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<span style="font-weight:700;color:#d97706;font-size:15px;font-family:sans-serif;">${getInitials(person.name)}</span>`

  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      background:#fef3c7;display:flex;align-items:center;justify-content:center;cursor:pointer;
    ">${inner}</div>
    <div style="
      width:0;height:0;border-left:6px solid transparent;
      border-right:6px solid transparent;border-top:8px solid white;
      margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
    "></div>
  `
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 10)],
  })
}

// Swaps the tile layer without remounting the map
function TileLayerSwitcher({ styleId }: { styleId: StyleId }) {
  const map = useMap()
  const style = MAP_STYLES.find(s => s.id === styleId)!
  // Re-render the TileLayer via key change handles the swap
  return (
    <TileLayer
      key={styleId}
      url={style.url}
      attribution={style.attribution}
    />
  )
}

interface MapClientProps {
  people: Person[]
}

export default function MapClient({ people }: MapClientProps) {
  const [styleId, setStyleId] = useState<StyleId>('satellite')

  const center: [number, number] =
    people.length > 0
      ? [people[0].latitude!, people[0].longitude!]
      : [39.5, -98.35]

  return (
    <div className="relative">
      {/* Style switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md border border-slate-200">
        {MAP_STYLES.map(style => (
          <button
            key={style.id}
            onClick={() => setStyleId(style.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              styleId === style.id
                ? 'bg-amber-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      <MapContainer
        center={center}
        zoom={people.length > 0 ? 5 : 4}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayerSwitcher styleId={styleId} />
        {people.map(person => (
          <Marker
            key={person.id}
            position={[person.latitude!, person.longitude!]}
            icon={createPersonIcon(person)}
          >
            <Popup>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 160 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                  background: '#fef3c7', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0, border: '2px solid #fde68a',
                }}>
                  {person.avatar_url ? (
                    <img
                      src={person.avatar_url}
                      alt={person.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontWeight: 700, color: '#d97706', fontSize: 14 }}>
                      {getInitials(person.name)}
                    </span>
                  )}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, margin: 0 }}>
                    {person.name}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 4px' }}>
                    {person.relationship}
                  </p>
                  <Link href={`/people/${person.id}`} style={{ color: '#d97706', fontSize: 12 }}>
                    View Profile
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
