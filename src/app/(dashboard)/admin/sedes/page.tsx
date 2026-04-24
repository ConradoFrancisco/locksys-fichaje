import { createClient } from '@/lib/supabase/server'
import { WorksiteForm } from '@/components/admin/WorksiteForm'
import { MapPin, Trash2, Globe, Navigation } from 'lucide-react'
import { deleteWorksite } from '@/lib/actions/worksites'
import { QRModal } from '@/components/admin/QRModal'

export default async function SedesPage() {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // 2. Obtener las sedes de ese tenant
  const { data: worksites } = await supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('name')

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Sedes</h1>
        <p className="text-slate-400 font-medium text-lg">Configurá los puntos geográficos y generá códigos QR para tu personal.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <WorksiteForm />
        </div>

        {/* Listado */}
        <div className="lg:col-span-2">
          <div className="locksys-card overflow-hidden">
            <div className="border-b border-white/5 p-8 flex items-center justify-between bg-white/5">
              <h2 className="text-2xl font-black text-white">Sedes Activas</h2>
              <span className="rounded-full bg-[#0072ff]/10 px-4 py-1 text-sm font-bold text-[#0072ff]">
                {worksites?.length || 0} sedes
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {worksites?.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between p-8 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="rounded-2xl bg-[#0072ff] p-4 text-white shadow-lg shadow-[#0072ff]/20 group-hover:scale-110 transition-transform">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl leading-tight">{ws.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Navigation className="h-3.5 w-3.5" />
                          {ws.lat.toFixed(4)}, {ws.long.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-[#6cc04a]">
                          <Globe className="h-3.5 w-3.5" />
                          Radio: {ws.radius_meters}m
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <QRModal worksiteId={ws.id} worksiteName={ws.name} />
                    
                    <form action={async () => {
                      'use server'
                      await deleteWorksite(ws.id)
                    }}>
                      <button className="rounded-xl p-3 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {worksites?.length === 0 && (
                <div className="p-24 text-center">
                  <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <MapPin className="h-10 w-10 text-slate-700" />
                  </div>
                  <p className="text-slate-500 text-lg font-medium">Aún no tenés sedes cargadas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
