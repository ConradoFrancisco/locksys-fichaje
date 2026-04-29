import { createClient } from '@/lib/supabase/server'
import { PlanningView } from '@/components/admin/PlanningView'

export default async function PlanificacionPage() {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user?.id || '')
    .single()

  // 2. Obtener TODAS las sedes y áreas para los filtros
  let worksitesQuery = supabase
    .from('worksites')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('name')

  if (userData?.role === 'manager') {
    const { data: assignments } = await supabase
      .from('admin_worksites')
      .select('worksite_id')
      .eq('user_id', user?.id || '')
    const worksiteIds = assignments?.map(a => a.worksite_id) || []
    worksitesQuery = worksitesQuery.in('id', worksiteIds)
  }

  const { data: worksites } = await worksitesQuery
  
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('tenant_id', userData?.tenant_id || '')
    .order('name')

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-white tracking-tight">Planificación Semanal</h1>
        <p className="text-slate-400 font-medium text-lg">Visualiza y comparte los horarios de tu equipo.</p>
      </div>

      <PlanningView 
        worksites={worksites || []} 
        departments={departments || []} 
        tenantId={userData?.tenant_id || ''}
      />
    </div>
  )
}
