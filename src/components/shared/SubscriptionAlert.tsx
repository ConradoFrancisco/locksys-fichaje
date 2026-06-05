'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { formatDate } from 'date-fns'

export function SubscriptionAlert() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Obtener tenant_id del usuario
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (!userData?.tenant_id) return

      // Obtener suscripción
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .single()

      setSubscription(sub)
    } catch (err) {
      console.error('Error checking subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !subscription) return null

  const isExpired = subscription.current_period_end && new Date(subscription.current_period_end) < new Date()
  const isInactive = subscription.status !== 'active'

  if (!isExpired && !isInactive) return null

  return (
    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-4">
      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
      <div>
        {isExpired && (
          <>
            <p className="text-sm font-bold text-red-400 mb-1">⚠️ Suscripción Vencida</p>
            <p className="text-xs text-red-400/80">
              Tu suscripción venció el {formatDate(new Date(subscription.current_period_end), 'dd/MM/yyyy')}. 
              Los empleados no pueden fichar. Contactá al administrador de la plataforma.
            </p>
          </>
        )}
        {isInactive && !isExpired && (
          <>
            <p className="text-sm font-bold text-red-400 mb-1">⚠️ Suscripción Inactiva</p>
            <p className="text-xs text-red-400/80">
              Tu suscripción está inactiva. Los empleados no pueden fichar. 
              Contactá al administrador de la plataforma.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
