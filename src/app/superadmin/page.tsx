'use client'

import { useState, useEffect } from 'react'
import { getAllTenantsWithSubscriptions } from '@/lib/actions/subscriptions'
import { formatDate } from 'date-fns'
import { Building2, Users, AlertCircle, Check, Clock } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  created_at: string
  subscriptions: Array<{
    id: string
    status: string
    plan: string
    price: number
    current_period_end: string | null
  }>
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const data = await getAllTenantsWithSubscriptions()
      setTenants(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando empresas')
    } finally {
      setLoading(false)
    }
  }

  const activeCount = tenants.filter(t => t.subscriptions?.[0]?.status === 'active').length
  const inactiveCount = tenants.filter(t => !t.subscriptions || t.subscriptions[0]?.status !== 'active').length

  const getStatusBadge = (subscription: any) => {
    if (!subscription) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-slate-700/50 text-slate-300">No activa</span>
    }

    const isExpired = subscription.current_period_end && new Date(subscription.current_period_end) < new Date()

    if (isExpired) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400"><AlertCircle className="w-3 h-3" /> Vencida</span>
    }

    if (subscription.status === 'active') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400"><Check className="w-3 h-3" /> Activa</span>
    }

    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400"><Clock className="w-3 h-3" /> {subscription.status}</span>
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072ff]"></div>
          </div>
          <p className="text-slate-400 font-medium">Cargando empresas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Empresas</p>
              <p className="text-4xl font-black text-white">{tenants.length}</p>
            </div>
            <Building2 className="w-12 h-12 text-slate-700" />
          </div>
        </div>

        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-1">Suscripciones Activas</p>
              <p className="text-4xl font-black text-emerald-400">{activeCount}</p>
            </div>
            <Check className="w-12 h-12 text-emerald-500/50" />
          </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-sm font-medium mb-1">Sin Suscripción</p>
              <p className="text-4xl font-black text-orange-400">{inactiveCount}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500/50" />
          </div>
        </div>
      </div>

      {/* Empresas */}
      <div className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-black text-white">Empresas Registradas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/50">
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Fecha Registro</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-slate-400 font-medium">No hay empresas registradas</p>
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => {
                  const subscription = tenant.subscriptions?.[0]
                  return (
                    <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-bold">{tenant.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{tenant.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">{formatDate(new Date(tenant.created_at), 'dd/MM/yyyy')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">{subscription?.plan || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(subscription)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300">
                          {subscription?.current_period_end
                            ? formatDate(new Date(subscription.current_period_end), 'dd/MM/yyyy')
                            : '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/superadmin/empresas/${tenant.id}`}
                          className="text-sm font-bold text-[#0072ff] hover:text-[#0072ff]/80 transition-colors"
                        >
                          Gestionar →
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
