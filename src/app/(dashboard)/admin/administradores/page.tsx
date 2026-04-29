import { createClient } from '@/lib/supabase/server'
import { Shield, Trash2 } from 'lucide-react'
import { deleteSubAdmin } from '@/lib/actions/admins'
import { AdminForm } from '@/components/admin/AdminForm'
import { AdminWorksiteToggle } from '@/components/admin/AdminWorksiteToggle'

export default async function AdministradoresPage() {
  const supabase = await createClient()

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  // 2. Obtener sub-administradores (managers)
  const { data: admins } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .eq('role', 'manager')
    .order('full_name')

  // 3. Obtener sedes
  const { data: worksites } = await supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('name')

  // 4. Obtener asignaciones actuales
  const { data: assignments } = await supabase
    .from('admin_worksites')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Administradores Delegados</h1>
        <p className="text-slate-400 font-medium text-lg">Asigna responsables para gestionar sedes específicas.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Columna Izquierda: Alta de Admin */}
        <div className="lg:col-span-1">
          <AdminForm />
        </div>

        {/* Listado de Admins y sus sedes */}
        <div className="lg:col-span-2 space-y-6">
          {admins?.map((admin) => (
            <div key={admin.id} className="locksys-card overflow-hidden group">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-center text-[#0072ff]">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">{admin.full_name}</h3>
                    <p className="text-xs text-slate-500 font-bold">{admin.email}</p>
                  </div>
                </div>
                <form action={async () => {
                  'use server'
                  await deleteSubAdmin(admin.id)
                }}>
                  <button className="p-3 rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-all">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </form>
              </div>
              
              <div className="p-8">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Sedes Autorizadas</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {worksites?.map((site) => {
                    const isAssigned = assignments?.some(a => a.user_id === admin.id && a.worksite_id === site.id)
                    return (
                      <AdminWorksiteToggle 
                        key={site.id}
                        adminId={admin.id}
                        siteId={site.id}
                        siteName={site.name}
                        initiallyAssigned={!!isAssigned}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {admins?.length === 0 && (
            <div className="locksys-card p-24 text-center">
               <Shield className="h-12 w-12 text-slate-800 mx-auto mb-4" />
               <p className="text-slate-500 font-bold uppercase tracking-widest">No hay administradores secundarios</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
