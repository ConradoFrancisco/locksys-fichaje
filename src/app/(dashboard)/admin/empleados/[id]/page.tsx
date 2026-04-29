import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Calendar, Mail, Smartphone, RefreshCw, ShieldCheck, LayoutGrid } from 'lucide-react'
import { WeekSchedulePicker } from '@/components/admin/WeekSchedulePicker'
import { resetDevice } from '@/lib/actions/employees'
import { WorksiteSelector } from '@/components/admin/WorksiteSelector'
import { DepartmentSelector } from '@/components/admin/DepartmentSelector'

export default async function EmpleadoDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Obtener datos del empleado con su área
  const { data: employee } = await supabase
    .from('employees')
    .select('*, departments(default_hours)')
    .eq('id', id)
    .single()

  if (!employee) notFound()

  const defaultHours = employee.departments?.default_hours || null

  // 2. Obtener horarios actuales
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', id)

  // 3. Obtener sedes (filtradas si es manager)
  let worksitesQuery = supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', employee.tenant_id)
    .order('name')

  // 4. Obtener TODAS las áreas para el selector
  const { data: allDepartments } = await supabase
    .from('departments')
    .select('*')
    .eq('tenant_id', employee.tenant_id)
    .order('name')

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const { data: currentUserData } = await supabase
    .from('users')
    .select('role')
    .eq('id', currentUser?.id || '')
    .single()

  if (currentUserData?.role === 'manager') {
    const { data: assignments } = await supabase
      .from('admin_worksites')
      .select('worksite_id')
      .eq('user_id', currentUser?.id || '')
    const worksiteIds = assignments?.map(a => a.worksite_id) || []
    worksitesQuery = worksitesQuery.in('id', worksiteIds)
  }

  const { data: worksites } = await worksitesQuery

  const currentWorksite = worksites?.find(w => w.id === employee.worksite_id)

  return (
    <div className="w-full animate-in fade-in duration-700">
      <Link 
        href="/admin/empleados" 
        className="mb-8 flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#0072ff] transition-all group"
      >
        <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Volver a Empleados
      </Link>

      <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="h-24 w-24 rounded-3xl bg-[#0072ff] flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
            <User className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter mb-3">{employee.full_name}</h1>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                <Mail className="h-3.5 w-3.5 text-[#0072ff]" />
                {employee.email}
              </span>
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                <ShieldCheck className="h-3.5 w-3.5 text-[#6cc04a]" />
                {employee.dni ? `DNI: ${employee.dni}` : 'Sin DNI asignado'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="locksys-card p-4 flex items-center gap-4 min-w-[250px]">
             <div className="p-3 rounded-xl bg-white/5 text-indigo-400">
                <LayoutGrid className="h-6 w-6" />
             </div>
             <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Área / Sector</p>
                <DepartmentSelector 
                  employeeId={employee.id}
                  departmentId={employee.department_id}
                  departments={allDepartments || []}
                />
             </div>
          </div>

          <div className="locksys-card p-4 flex items-center gap-4 min-w-[280px]">
             <div className="p-3 rounded-xl bg-white/5 text-[#0072ff]">
                <ShieldCheck className="h-6 w-6" />
             </div>
             <div className="flex-1">
                <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Sede Asignada</p>
                <WorksiteSelector 
                  employeeId={employee.id}
                  worksiteId={employee.worksite_id}
                  worksites={worksites || []}
                />
             </div>
          </div>

          <div className="locksys-card p-4 flex items-center gap-4 min-w-[250px]">
            <div className={`p-3 rounded-xl ${employee.device_id ? 'bg-[#6cc04a]/10 text-[#6cc04a]' : 'bg-white/5 text-slate-600'}`}>
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Dispositivo</p>
              <p className="text-sm font-black text-white">
                {employee.device_id ? 'VINCULADO' : 'LIBRE'}
              </p>
            </div>
            {employee.device_id && (
              <form action={async () => {
                'use server'
                await resetDevice(employee.id)
              }}>
                <button className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-8">
        {/* Nuevo Selector de Semanas */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-[#6cc04a]" />
            <h2 className="text-2xl font-black text-white tracking-tight">Asignar Turnos de Trabajo</h2>
          </div>
          <p className="text-sm text-slate-400">1️⃣ Selecciona la semana | 2️⃣ Arrastra en los días para definir horarios | 3️⃣ Se guarda automáticamente</p>
          <WeekSchedulePicker employeeId={employee.id} defaultHours={defaultHours} />
        </div>
      </div>
    </div>
  )
}
