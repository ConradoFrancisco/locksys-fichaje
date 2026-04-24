'use client'

import { createWorksite } from '@/lib/actions/worksites'
import { SubmitButton } from '@/components/shared/SubmitButton'
import { useActionState, useState } from 'react'
import { Navigation, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('./MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse bg-slate-900 rounded-2xl"></div>
})

export function WorksiteForm() {
  const [state, formAction] = useActionState(createWorksite, null)
  const [coords, setCoords] = useState<{ lat: number; long: number }>({ lat: -34.6037, long: -58.3816 })
  const [radius, setRadius] = useState(100)
  const [gettingLocation, setGettingLocation] = useState(false)

  const captureLocation = () => {
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          long: position.coords.longitude,
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error(error)
        alert('No se pudo obtener la ubicación.')
        setGettingLocation(false)
      }
    )
  }

  return (
    <form action={formAction} className="locksys-card p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-[#0072ff]/20 flex items-center justify-center text-[#0072ff]">
          <MapPin className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-white">Nueva Sede</h2>
      </div>
      
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre de la Sede</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ej: Oficina Central"
          className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Ubicación Geográfica</label>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <MapPicker 
            lat={coords.lat} 
            long={coords.long} 
            radius={radius}
            onChange={(lat, long) => setCoords({ lat, long })} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <input name="lat" type="hidden" value={coords.lat} />
          <input name="long" type="hidden" value={coords.long} />
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Latitud</p>
             <p className="text-sm font-mono text-white">{coords.lat.toFixed(6)}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Longitud</p>
             <p className="text-sm font-mono text-white">{coords.long.toFixed(6)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={captureLocation}
          disabled={gettingLocation}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
        >
          <Navigation className={`h-4 w-4 ${gettingLocation ? 'animate-pulse text-[#0072ff]' : ''}`} />
          {gettingLocation ? 'Capturando GPS...' : 'Usar ubicación del dispositivo'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Radio (mts)</label>
          <input
            name="radius"
            type="number"
            value={radius || ''}
            onChange={(e) => setRadius(parseInt(e.target.value) || 0)}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Tolerancia (min)</label>
          <input
            name="tolerance_minutes"
            type="number"
            defaultValue={10}
            required
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
          />
        </div>
      </div>

      <SubmitButton className="w-full bg-[#0072ff] hover:bg-blue-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20">
        Guardar Sede
      </SubmitButton>
    </form>
  )
}
