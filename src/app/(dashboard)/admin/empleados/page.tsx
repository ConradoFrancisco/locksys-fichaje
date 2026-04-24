import { createClient } from '@/lib/supabase/server'
import { EmployeeForm } from '@/components/admin/EmployeeForm'
import { Users, Trash2, User, Clock, ChevronRight } from 'lucide-react'
import { deleteEmployee } from '@/lib/actions/employees'
import { DepartmentManager } from '@/components/admin/DepartmentManager'
import Link from 'next/link'

export default async function EmpleadosPage() {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // 2. Obtener los empleados de ese tenant
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('full_name')

  // 3. Obtener departamentos
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('name')

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Gestión de Personal</h1>
        <p className="text-slate-400 font-medium text-lg">Administrá la nómina y los permisos de fichaje de tu equipo.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Columna Izquierda: Configuración */}
        <div className="lg:col-span-1 space-y-8">
          <DepartmentManager departments={departments || []} />
          <EmployeeForm departments={departments || []} />
        </div>

        {/* Listado */}
        <div className="lg:col-span-2">
          <div className="locksys-card overflow-hidden">
            <div className="border-b border-white/5 p-8 flex items-center justify-between bg-white/5">
              <h2 className="text-2xl font-black text-white">Nómina Activa</h2>
              <span className="rounded-full bg-[#6cc04a]/10 px-4 py-1 text-sm font-bold text-[#6cc04a]">
                {employees?.length || 0} integrantes
              </span>
            </div>
            <div className="divide-y divide-white/5">
              {employees?.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-8 hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="rounded-2xl bg-slate-950 border border-white/10 p-4 text-slate-400 group-hover:text-[#6cc04a] group-hover:border-[#6cc04a]/30 transition-all">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl leading-tight">{emp.full_name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded">
                           {emp.email}
                        </span>
                        <span className="text-xs font-bold text-[#6cc04a]">
                           {emp.internal_id ? `DNI: ${emp.internal_id}` : 'Sin DNI'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/admin/empleados/${emp.id}`}
                      className="rounded-xl p-3 bg-white/5 text-slate-400 hover:text-[#0072ff] hover:bg-white/10 transition-all flex items-center gap-2 group/btn"
                      title="Configurar Horarios"
                    >
                      <Clock className="h-5 w-5" />
                      <span className="text-xs font-bold hidden md:inline">Horarios</span>
                    </Link>
                    
                    <form action={async () => {
                      'use server'
                      await deleteEmployee(emp.id)
                    }}>
                      <button className="rounded-xl p-3 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {employees?.length === 0 && (
                <div className="p-24 text-center">
                  <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Users className="h-10 w-10 text-slate-700" />
                  </div>
                  <p className="text-slate-500 text-lg font-medium">Aún no tenés personal registrado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
