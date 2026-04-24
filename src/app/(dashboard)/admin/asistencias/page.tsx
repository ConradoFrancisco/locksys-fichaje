import { createClient } from '@/lib/supabase/server'
import { 
  History, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Camera,
  ExternalLink
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AsistenciasPage() {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // 2. Obtener asistencias recientes con datos de empleado y sede
  const { data: attendance } = await supabase
    .from('attendance')
    .select(`
      *,
      employees(full_name, internal_id),
      worksites(name)
    `)
    .eq('tenant_id', userData?.tenant_id || '')
    .order('check_in', { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Registro de Asistencia</h1>
        <p className="text-slate-400 font-medium text-lg">Monitoreo en tiempo real de ingresos, egresos y puntualidad.</p>
      </div>

      <div className="locksys-card overflow-hidden">
        <div className="border-b border-white/5 p-8 flex items-center justify-between bg-white/5">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <History className="h-6 w-6 text-[#0072ff]" />
            Últimos Movimientos
          </h2>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-[#6cc04a]" />
                Puntual
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                Tarde
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-white/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Empleado</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Sede</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Horarios (Ingreso/Egreso)</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Estado / Jornada</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {attendance?.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-black text-white">{item.employees?.full_name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {item.employees?.internal_id ? `DNI: ${item.employees.internal_id}` : 'Sin DNI'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-4 w-4 text-[#0072ff]" />
                      <span className="font-bold text-sm">{item.worksites?.name}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Ingreso</p>
                        <p className="font-bold text-white text-sm">
                          {format(new Date(item.check_in), "HH:mm 'hs'", { locale: es })}
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold capitalize">
                          {format(new Date(item.check_in), "eee dd MMM", { locale: es })}
                        </p>
                      </div>
                      {item.check_out && (
                        <div>
                          <p className="text-[10px] font-black text-[#6cc04a] uppercase mb-1">Egreso</p>
                          <p className="font-bold text-white text-sm">
                            {format(new Date(item.check_out), "HH:mm 'hs'", { locale: es })}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="space-y-2">
                      {item.is_late ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                          <AlertCircle className="h-3 w-3" />
                          Tarde ({item.late_minutes} min)
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6cc04a]/10 border border-[#6cc04a]/20 text-[#6cc04a] text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 className="h-3 w-3" />
                          A Tiempo
                        </div>
                      )}
                      
                      {item.check_out && (
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Clock className="h-3 w-3 text-[#0072ff]" />
                          Jornada: {((new Date(item.check_out).getTime() - new Date(item.check_in).getTime()) / (1000 * 60 * 60)).toFixed(1)} hs
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {item.photo_url ? (
                      <a 
                        href={item.photo_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-[#0072ff] hover:border-[#0072ff]/50 transition-all group/photo"
                      >
                        <Camera className="h-5 w-5 group-hover/photo:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-700 uppercase italic">Sin foto</span>
                    )}
                  </td>
                </tr>
              ))}
              {attendance?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <History className="h-10 w-10 text-slate-700" />
                    </div>
                    <p className="text-slate-500 text-lg font-medium">Aún no hay registros de asistencia hoy.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
