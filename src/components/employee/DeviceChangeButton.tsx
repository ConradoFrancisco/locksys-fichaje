'use client'

import { useState } from 'react'
import { requestDeviceChange } from '@/lib/actions/device-requests'
import { toast } from 'sonner'
import { Smartphone, Check, Loader2 } from 'lucide-react'

interface DeviceChangeButtonProps {
  newDeviceId: string
  className?: string
}

export function DeviceChangeButton({ newDeviceId, className = '' }: DeviceChangeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleRequest = async () => {
    if (!newDeviceId) {
      toast.error('No se pudo identificar el ID de tu dispositivo.')
      return
    }

    setLoading(true)
    try {
      const res = await requestDeviceChange(newDeviceId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Solicitud enviada con éxito. Aguardá la aprobación del administrador.')
        setRequested(true)
      }
    } catch (error) {
      console.error('Error requesting device change:', error)
      toast.error('Ocurrió un error inesperado al enviar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading || requested}
      className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all text-sm shadow-lg ${
        requested
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-950/20'
          : 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white shadow-indigo-950/20 disabled:opacity-50'
      } ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando solicitud...
        </>
      ) : requested ? (
        <>
          <Check className="h-4 w-4" />
          Solicitud pendiente
        </>
      ) : (
        <>
          <Smartphone className="h-4 w-4" />
          Solicitar cambio de dispositivo
        </>
      )}
    </button>
  )
}
