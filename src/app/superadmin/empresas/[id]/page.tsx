'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getTenantSubscription, updateSubscription, activateSubscription, deactivateSubscription } from '@/lib/actions/subscriptions'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from 'date-fns'
import { AlertCircle, Check, ChevronLeft } from 'lucide-react'

interface Subscription {
  id: string
  status: 'active' | 'inactive' | 'suspended' | 'cancelled'
  plan: 'monthly' | 'annual'
  price: number
  currency: string
  started_at: string | null
  current_period_end: string | null
  last_payment_at: string | null
  payment_method: string | null
  notes: string | null
}

export default function ManageCompanyPage() {
  const params = useParams()
  const tenantId = params.id as string
  const supabase = createClient()

  const [tenantName, setTenantName] = useState('')
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [worksitesCount, setWorksitesCount] = useState(0)
  const [employeesCount, setEmployeesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para el formulario
  const [status, setStatus] = useState<'active' | 'inactive' | 'suspended' | 'cancelled'>('inactive')
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly')
  const [price, setPrice] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Obtener datos del tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single()

      setTenantName(tenant?.name || 'Desconocida')

      // Obtener cantidad de sedes
      const { count: worksitesCount } = await supabase
        .from('worksites')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      setWorksitesCount(worksitesCount || 0)

      // Obtener cantidad de empleados
      const { count: employeesCount } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      setEmployeesCount(employeesCount || 0)

      // Obtener suscripción
      const sub = await getTenantSubscription(tenantId)
      
      if (sub) {
        setSubscription(sub)
        setStatus(sub.status)
        setPlan(sub.plan)
        setPrice(sub.price)
        setPaymentMethod(sub.payment_method || '')
        setNotes(sub.notes || '')
      } else {
        setStatus('inactive')
        setPlan('monthly')
        setPrice(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateSubscription(tenantId, {
        status,
        plan,
        price: parseFloat(price.toString()),
        paymentMethod,
        notes,
      })

      setSuccess('Cambios guardados correctamente')
      setTimeout(() => setSuccess(''), 3000)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    try {
      await activateSubscription(tenantId, parseFloat(price.toString()))
      setSuccess('Empresa activada exitosamente')
      setTimeout(() => setSuccess(''), 3000)
      loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error activando empresa')
    }
  }

  const handleDeactivate = async () => {
    const reason = prompt('¿Razón de desactivación?')
    if (reason !== null) {
      try {
        await deactivateSubscription(tenantId, reason)
        setSuccess('Empresa desactivada')
        setTimeout(() => setSuccess(''), 3000)
        loadData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desactivando empresa')
      }
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072ff]"></div>
          </div>
          <p className="text-slate-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <a href="/superadmin" className="inline-flex items-center gap-2 text-[#0072ff] hover:text-[#0072ff]/80 mb-4 font-bold text-sm">
          <ChevronLeft className="w-4 h-4" /> Volver
        </a>
        <h1 className="text-3xl font-black text-white">{tenantName}</h1>
        <p className="text-slate-400 text-sm font-mono mt-1">{tenantId}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Subscription Info */}
      {subscription && (
        <div className="bg-slate-900 border border-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Información de la Empresa</h2>
          
          {/* Primera fila: Sedes, Empleados, Estado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">📍 Sedes</p>
              <p className="text-3xl font-black text-blue-400">{worksitesCount}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">👥 Empleados</p>
              <p className="text-3xl font-black text-purple-400">{employeesCount}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Estado</p>
              <p className="text-white font-bold capitalize">{subscription.status}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-2">Plan</p>
              <p className="text-white font-bold capitalize">{subscription.plan}</p>
            </div>
          </div>

          {/* Segunda fila: Fechas y pagos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Iniciado</p>
              <p className="text-white font-bold">
                {subscription.started_at ? formatDate(new Date(subscription.started_at), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Vencimiento</p>
              <p className="text-white font-bold">
                {subscription.current_period_end ? formatDate(new Date(subscription.current_period_end), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Último Pago</p>
              <p className="text-white font-bold">
                {subscription.last_payment_at ? formatDate(new Date(subscription.last_payment_at), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Precio Mensual</p>
              <p className="text-white font-bold">${subscription.price} {subscription.currency}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSaveChanges} className="bg-slate-900 border border-white/5 rounded-xl p-8 space-y-6">
        <h2 className="text-lg font-bold text-white">Gestionar Suscripción</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors"
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
              <option value="suspended">Suspendida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors"
            >
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Precio (USD)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Método de Pago</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="ej: Tarjeta, Transferencia"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors placeholder-slate-500"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-3">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotaciones adicionales..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors placeholder-slate-500 resize-none"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[#0072ff] hover:bg-[#0072ff]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          {subscription?.status === 'active' ? (
            <button
              type="button"
              onClick={handleDeactivate}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Desactivar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleActivate}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
            >
              Activar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
