import { createClient } from '@/lib/supabase/server'
import { AttendanceClient } from '@/components/attendance/AttendanceClient'
import { redirect } from 'next/navigation'
import { 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval, 
  endOfWeek, 
  isWithinInterval 
} from 'date-fns'

export default async function FicharPage() {
  const supabase = await createClient()

  // 1. Obtener sesión — el empleado está logueado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verificar que sea un empleado
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return <div className="text-white bg-red-950 p-6 rounded-2xl border border-red-500/20 text-center">Error: No tenés una empresa asignada.</div>

  // 3. Obtener datos del empleado logueado
  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, device_id, tenant_id, worksite_id')
    .eq('id', user.id)
    .single()

  if (!employee) return <div className="text-white bg-red-950 p-6 rounded-2xl border border-red-500/20 text-center">Error: No se encontró tu perfil de empleado.</div>

  // 4. Obtener sedes del tenant
  const { data: worksites } = await supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  // 5. Obtener horario de HOY para mostrar feedback de puntualidad
  const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}))
  const dayOfWeek = now.getDay()
  
  // Cálculo de semana (misma lógica que attendance.ts)
  const start = startOfMonth(now)
  const end = endOfMonth(start)
  const weeksInterval = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  
  let weekNumber = 1
  for (let i = 0; i < weeksInterval.length; i++) {
    const wStart = weeksInterval[i]
    const wEnd = endOfWeek(wStart, { weekStartsOn: 1 })
    if (isWithinInterval(now, { start: wStart, end: wEnd })) {
      weekNumber = i + 1
      break
    }
  }

  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Buscar horario específico de esta semana
  let { data: schedules } = await supabase
    .from('schedules')
    .select('start_time, end_time')
    .eq('employee_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .eq('week_number', weekNumber)
    .eq('month', currentMonth)
    .eq('year', currentYear)

  // Si no hay específico, buscar genérico
  if (!schedules || schedules.length === 0) {
    const { data: generalSchedules } = await supabase
      .from('schedules')
      .select('start_time, end_time')
      .eq('employee_id', user.id)
      .eq('day_of_week', dayOfWeek)
      .is('week_number', null)

    schedules = generalSchedules
  }

  const todaySchedule = schedules && schedules.length > 0 ? schedules[0] : null

  // 6. Verificar si ya tiene una fichada activa (entrada sin salida)
  const { data: activeAttendance } = await supabase
    .from('attendance')
    .select('id, check_in, worksite_id')
    .eq('employee_id', user.id)
    .is('check_out', null)
    .order('check_in', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen bg-[#0a0f19] px-4 py-12 relative overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center">
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-[#0072ff]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-[#6cc04a]/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white">
            LOCK<span className="text-[#0072ff]">SYS</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Control de <span className="text-[#6cc04a]">asistencia</span> y fichaje
          </p>
          <div className="text-sm font-bold text-slate-400 mt-2">
            Hola, <span className="text-white font-black">{employee.full_name}</span>
          </div>
        </div>

        <AttendanceClient 
          employee={employee}
          worksites={worksites || []} 
          todaySchedule={todaySchedule}
          activeAttendance={activeAttendance}
        />
      </div>
    </div>
  )
}
