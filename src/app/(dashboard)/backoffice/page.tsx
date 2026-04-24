import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createTenantBySuperAdmin } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'

export default async function BackofficePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold text-red-600">403</h1>
        <p className="mt-2 text-xl font-semibold">No tenés permisos de Súper Admin</p>
        <p className="mt-4 text-slate-600">
          Para acceder, cambiá tu rol a <code className="rounded bg-slate-100 px-1 text-red-500">'super_admin'</code> en la tabla <code className="rounded bg-slate-100 px-1">users</code> de Supabase.
        </p>
      </div>
    )
  }

  const { data: tenants } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Backoffice de Gestión</h1>
        <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          Modo Súper Admin
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {/* Formulario de Alta */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Alta de Empresa</h2>
            <p className="mt-1 text-sm text-slate-600">Registrá un nuevo cliente en la plataforma.</p>

            <form action={async (formData) => {
              'use server'
              await createTenantBySuperAdmin(formData)
            }} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre Comercial</label>
                <input
                  name="tenantName"
                  type="text"
                  required
                  placeholder="Ej: Constructora ABC"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Plan</label>
                <select
                  name="planTier"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="free">Gratuito (MVP)</option>
                  <option value="basic">Básico (hasta 10 empleados)</option>
                  <option value="premium">Premium (Ilimitado)</option>
                </select>
              </div>

              <SubmitButton className="w-full">Crear Empresa</SubmitButton>
            </form>
          </div>
        </div>

        {/* Listado de Empresas */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-bold text-slate-900">Empresas Activas</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {tenants?.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">{tenant.id}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                      tenant.plan_tier === 'premium' ? 'bg-purple-50 text-purple-700 ring-purple-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'
                    }`}>
                      {tenant.plan_tier}
                    </span>
                    <p className="mt-1 text-xs text-slate-400">
                      Creado: {new Date(tenant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {tenants?.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  No hay empresas registradas aún.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
