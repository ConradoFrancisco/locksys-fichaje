import { createClient } from '@/lib/supabase/server'
import { AttendanceClient } from '@/components/attendance/AttendanceClient'
import { redirect } from 'next/navigation'

export default async function FicharPage() {
  const supabase = await createClient()

  // 1. Obtener sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Obtener tenant del usuario
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return <div>Error: No tenés una empresa asignada.</div>

  // 3. Obtener empleados y sedes para el selector (MVP)
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .eq('is_active', true)
    .order('full_name')

  const { data: worksites } = await supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Control de Asistencia</h1>
        <p className="text-slate-500 font-medium">Fichaje con Geolocalización</p>
      </div>

      <AttendanceClient 
        employees={employees || []} 
        worksites={worksites || []} 
      />
    </div>
  )
}
