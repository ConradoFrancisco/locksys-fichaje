'use server'

import { createClient } from '@/lib/supabase/server'

export interface SubscriptionData {
  id: string
  tenantId: string
  status: 'active' | 'inactive' | 'suspended' | 'cancelled'
  plan: 'monthly' | 'annual'
  price: number
  currency: string
  startedAt: string | null
  currentPeriodEnd: string | null
  lastPaymentAt: string | null
  paymentMethod: string | null
  notes: string | null
}

// Obtener todas las empresas con sus suscripciones (solo super admin)
export async function getAllTenantsWithSubscriptions() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  // Verificar que sea super admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'super_admin') {
    throw new Error('Solo super admin puede acceder')
  }

  // Obtener todas las empresas
  const { data: allTenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  if (tenantsError) throw new Error(tenantsError.message)

  // Obtener todas las suscripciones
  const { data: allSubscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('tenant_id, id, status, plan, price, currency, started_at, current_period_end, last_payment_at, payment_method, notes')

  if (subsError) throw new Error(subsError.message)

  // Combinar datos: para cada tenant, asignar su suscripción si existe
  const tenants = (allTenants || []).map(tenant => ({
    ...tenant,
    subscriptions: (allSubscriptions || []).filter(sub => sub.tenant_id === tenant.id)
  }))

  return tenants
}

// Obtener suscripción de una empresa específica
export async function getTenantSubscription(tenantId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'super_admin') {
    throw new Error('Solo super admin puede acceder')
  }

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(error.message)

  return subscription
}

// Crear o actualizar suscripción
export async function updateSubscription(
  tenantId: string,
  data: {
    status?: 'active' | 'inactive' | 'suspended' | 'cancelled'
    plan?: 'monthly' | 'annual'
    price?: number
    currency?: string
    startedAt?: string
    currentPeriodEnd?: string
    lastPaymentAt?: string
    paymentMethod?: string
    notes?: string
  }
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'super_admin') {
    throw new Error('Solo super admin puede acceder')
  }

  // Primero verificar si existe
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (existing) {
    // Actualizar
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: data.status,
        plan: data.plan,
        price: data.price,
        currency: data.currency,
        started_at: data.startedAt,
        current_period_end: data.currentPeriodEnd,
        last_payment_at: data.lastPaymentAt,
        payment_method: data.paymentMethod,
        notes: data.notes,
      })
      .eq('tenant_id', tenantId)

    if (error) throw new Error(error.message)
  } else {
    // Crear nueva
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        status: data.status || 'inactive',
        plan: data.plan || 'monthly',
        price: data.price || 0,
        currency: data.currency || 'USD',
        started_at: data.startedAt,
        current_period_end: data.currentPeriodEnd,
        last_payment_at: data.lastPaymentAt,
        payment_method: data.paymentMethod,
        notes: data.notes,
      })

    if (error) throw new Error(error.message)
  }
}

// Activar suscripción
export async function activateSubscription(tenantId: string, price: number = 0) {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  await updateSubscription(tenantId, {
    status: 'active',
    startedAt: now.toISOString(),
    currentPeriodEnd: nextMonth.toISOString(),
    lastPaymentAt: now.toISOString(),
    price,
  })
}

// Desactivar suscripción
export async function deactivateSubscription(tenantId: string, reason?: string) {
  await updateSubscription(tenantId, {
    status: 'inactive',
    notes: reason,
  })
}

// Verificar si una empresa tiene suscripción activa
export async function isSubscriptionActive(tenantId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('tenant_id', tenantId)
    .single()

  if (error || !subscription) return false

  if (subscription.status !== 'active') return false

  // Verificar que no esté vencida
  if (subscription.current_period_end) {
    const endDate = new Date(subscription.current_period_end)
    if (endDate < new Date()) return false
  }

  return true
}
