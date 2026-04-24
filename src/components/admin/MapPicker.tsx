'use client'

import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

// Corregir iconos de Leaflet en Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface MapPickerProps {
  lat: number
  long: number
  radius: number
  onChange: (lat: number, long: number) => void
}

function LocationMarker({ lat, long, onChange }: { lat: number; long: number; onChange: (lat: number, long: number) => void }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView([lat, long])
  }, [lat, long, map])

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <Marker position={[lat, long]} icon={icon} draggable={true} eventHandlers={{
      dragend: (e) => {
        const marker = e.target
        const position = marker.getLatLng()
        onChange(position.lat, position.lng)
      }
    }} />
  )
}

export default function MapPicker({ lat, long, radius, onChange }: MapPickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return

    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const { lat: newLat, lon: newLon } = data[0]
        onChange(parseFloat(newLat), parseFloat(newLon))
      } else {
        alert('No se encontró la dirección.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  if (!isClient) return <div className="h-[400px] w-full animate-pulse bg-slate-100 rounded-lg"></div>

  return (
    <div className="space-y-3">
      {/* Buscador Externo (Corregido: div en lugar de form para evitar anidamiento) */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(e as any)
                }
              }}
              placeholder="Buscar dirección (ej: Obelisco, Bs As)"
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={(e) => handleSearch(e as any)}
            disabled={searching}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {searching ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <MapContainer center={[lat, long]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker lat={lat} long={long} onChange={onChange} />
          <Circle 
            center={[lat, long]} 
            radius={radius} 
            pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.2, weight: 2 }} 
          />
        </MapContainer>
      </div>
    </div>
  )
}
