import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ShieldCheck, Building2, UserCircle, Fingerprint, ArrowRight, History, MapPin, User, CheckCircle2, AlertCircle, Camera } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener datos del usuario y su tenant
  const { data: userData } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('id', user.id)
    .single()

  // Obtener fecha de hoy en Argentina
  const argentinaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}))
  const todayStart = new Date(argentinaTime)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(argentinaTime)
  todayEnd.setHours(23, 59, 59, 999)
  
  // Convertir a UTC para comparar con la BD
  const offset = argentinaTime.getTime() - new Date().getTime()
  const utcTodayStart = new Date(todayStart.getTime() - offset)
  const utcTodayEnd = new Date(todayEnd.getTime() - offset)

  // Obtener asistencias de hoy
  let attendanceQuery = supabase
    .from('attendance')
    .select(`
      *,
      employees(full_name, dni),
      worksites(name)
    `)
    .eq('tenant_id', userData?.tenant_id || '')
    .gte('check_in', utcTodayStart.toISOString())
    .lte('check_in', utcTodayEnd.toISOString())

  // Si es manager, filtrar por sus sedes
  const { data: currentUserData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUserData?.role === 'manager') {
    const { data: assignments } = await supabase
      .from('admin_worksites')
      .select('worksite_id')
      .eq('user_id', user.id)
    const worksiteIds = assignments?.map(a => a.worksite_id) || []
    attendanceQuery = attendanceQuery.in('worksite_id', worksiteIds)
  }

  const { data: todayAttendance } = await attendanceQuery.order('check_in', { ascending: false }).limit(5)

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Panel <span className="text-[#0072ff]">LOCKSYS</span>
          </h1>
          <p className="text-slate-400 font-medium mt-1">Bienvenido de nuevo, {userData?.full_name}</p>
        </div>
        <div className="flex gap-3">
           <Link href="/admin/sedes" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
              Gestionar Sedes <ArrowRight className="h-3 w-3" />
           </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card Empresa */}
        <div className="locksys-card p-8 flex items-start justify-between group transition-all hover:border-[#0072ff]/50">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Empresa</p>
            <p className="text-2xl font-black text-white">{userData?.tenants?.name || 'Cargando...'}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#0072ff]/10 flex items-center justify-center text-[#0072ff] group-hover:scale-110 transition-transform">
            <Building2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card Rol */}
        <div className="locksys-card p-8 flex items-start justify-between group transition-all hover:border-[#6cc04a]/50">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Rol de Acceso</p>
            <p className="text-2xl font-black text-white capitalize">{userData?.role}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#6cc04a]/10 flex items-center justify-center text-[#6cc04a] group-hover:scale-110 transition-transform">
            <UserCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Card Seguridad */}
        <div className="locksys-card p-8 flex items-start justify-between group transition-all hover:border-indigo-500/50">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">ID de Seguridad</p>
            <p className="text-xs font-mono text-slate-400 break-all">{user.id}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Fingerprint className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Stats / Accesos Rápidos */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="locksys-card p-1 overflow-hidden">
          <div className="p-8">
             <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2">
               <History className="h-5 w-5 text-[#0072ff]" />
               Actividad de Hoy
             </h3>
             <p className="text-sm text-slate-500 mb-6">Últimos fichajes registrados hoy.</p>
             
             {todayAttendance && todayAttendance.length > 0 ? (
               <div className="space-y-3">
                 {todayAttendance.map((item) => (
                   <div key={item.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 flex-1">
                         <div className="h-8 w-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                           <User className="h-4 w-4" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="font-bold text-white text-sm truncate">{item.employees?.full_name}</p>
                           <p className="text-xs text-slate-400 flex items-center gap-2">
                             <MapPin className="h-3 w-3" />
                             {item.worksites?.name}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="text-right">
                           <p className="text-sm font-black text-white">
                             {format(new Date(item.check_in), "hh:mm a", { locale: es })}
                           </p>
                           {item.is_late ? (
                             <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                               <AlertCircle className="h-3 w-3" /> Tarde
                             </span>
                           ) : (
                             <span className="text-xs font-bold text-[#6cc04a] flex items-center gap-1">
                               <CheckCircle2 className="h-3 w-3" /> Puntual
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                 <History className="h-8 w-8 text-slate-700 mb-2" />
                 <p className="text-xs font-bold text-slate-600 uppercase tracking-widest italic">No hay fichajes hoy</p>
               </div>
             )}
             
             {todayAttendance && todayAttendance.length > 0 && (
               <Link href="/admin/asistencias" className="mt-4 flex items-center justify-center p-3 rounded-xl bg-[#0072ff]/10 hover:bg-[#0072ff]/20 transition-all text-[#0072ff] text-xs font-bold">
                 Ver todos los fichajes <ArrowRight className="h-3 w-3 ml-2" />
               </Link>
             )}
          </div>
        </div>

        <div className="locksys-card p-1">
          <div className="p-8">
             <h3 className="text-xl font-black text-white mb-2">Configuración Rápida</h3>
             <p className="text-sm text-slate-500 mb-6">Accesos directos a las herramientas de gestión.</p>
             <div className="space-y-3">
                <Link href="/admin/sedes" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                   <span className="font-bold">Nueva Sede</span>
                   <ArrowRight className="h-4 w-4 text-[#0072ff] group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/admin/empleados" className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                   <span className="font-bold">Alta de Empleado</span>
                   <ArrowRight className="h-4 w-4 text-[#6cc04a] group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
