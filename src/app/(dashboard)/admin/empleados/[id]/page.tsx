import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, User, Calendar, Mail, Smartphone, RefreshCw, ShieldCheck } from 'lucide-react'
import { WeekSchedulePicker } from '@/components/admin/WeekSchedulePicker'
import { resetDevice } from '@/lib/actions/employees'

export default async function EmpleadoDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Obtener datos del empleado
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (!employee) notFound()

  // 2. Obtener horarios actuales
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', id)

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
                {employee.internal_id ? `DNI: ${employee.internal_id}` : 'Sin DNI asignado'}
              </span>
            </div>
          </div>
        </div>

        <div className="locksys-card p-6 flex items-center gap-6 min-w-[300px]">
          <div className={`p-4 rounded-2xl ${employee.device_id ? 'bg-[#6cc04a]/10 text-[#6cc04a]' : 'bg-white/5 text-slate-600'}`}>
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Seguridad de Dispositivo</p>
            <p className="text-base font-black text-white">
              {employee.device_id ? 'VINCULADO' : 'SIN VINCULAR'}
            </p>
          </div>
          {employee.device_id && (
            <form action={async () => {
              'use server'
              await resetDevice(employee.id)
            }}>
              <button className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20" title="Desvincular teléfono">
                <RefreshCw className="h-5 w-5" />
              </button>
            </form>
          )}
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
          <WeekSchedulePicker employeeId={employee.id} />
        </div>
      </div>
    </div>
  )
}
