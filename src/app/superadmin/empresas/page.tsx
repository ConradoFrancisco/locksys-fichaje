'use client'

import { useState, useEffect } from 'react'
import { getAllTenantsWithSubscriptions } from '@/lib/actions/subscriptions'
import { formatDate } from 'date-fns'
import { AlertCircle, Building2, ChevronRight } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  created_at: string
  subscriptions: Array<{
    status: string
    current_period_end: string | null
  }>
}

export default function EmpresasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Empresas</h1>
        <p className="text-slate-400 text-sm">Gestiona las suscripciones de todas las empresas</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Buscador */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar por nombre o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:border-[#0072ff] focus:outline-none transition-colors"
        />
      </div>

      {/* Lista de Empresas */}
      {filteredTenants.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">
            {searchTerm ? 'No se encontraron empresas' : 'No hay empresas registradas'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTenants.map((tenant) => {
            const subscription = tenant.subscriptions && tenant.subscriptions.length > 0 ? tenant.subscriptions[0] : null
            const isActive = subscription?.status === 'active'
            const isExpired = subscription?.current_period_end && new Date(subscription.current_period_end) < new Date()
            const hasSubscription = subscription !== null

            return (
              <a
                key={tenant.id}
                href={`/superadmin/empresas/${tenant.id}`}
                className="bg-slate-900 border border-white/5 rounded-xl p-6 hover:border-white/10 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-black text-white">{tenant.name}</h3>
                      <div className="flex items-center gap-2">
                        {hasSubscription && isActive && !isExpired && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                            ✓ Activa
                          </span>
                        )}
                        {hasSubscription && isExpired && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400">
                            ⚠ Vencida
                          </span>
                        )}
                        {hasSubscription && !isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-500/20 text-orange-400">
                            ⏸ {subscription?.status}
                          </span>
                        )}
                        {!hasSubscription && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-700/50 text-slate-300">
                            Sin suscripción
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="font-mono">{tenant.id}</span>
                      <span>•</span>
                      <span>Registrada {formatDate(new Date(tenant.created_at), 'dd/MM/yyyy')}</span>
                    </div>
                    {subscription?.current_period_end && (
                      <p className="text-sm text-slate-400 mt-2">
                        Vencimiento: {formatDate(new Date(subscription.current_period_end), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-slate-400 transition-colors" />
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-8 pt-8 border-t border-white/5">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-sm font-medium">Total</p>
            <p className="text-2xl font-black text-white">{tenants.length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Activas</p>
            <p className="text-2xl font-black text-emerald-400">
              {tenants.filter(t => t.subscriptions && t.subscriptions.length > 0 && t.subscriptions[0]?.status === 'active').length}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">Inactivas</p>
            <p className="text-2xl font-black text-orange-400">
              {tenants.filter(t => !t.subscriptions || t.subscriptions.length === 0 || t.subscriptions[0]?.status !== 'active').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
