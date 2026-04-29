'use client'

import { toggleWorksiteAssignment } from '@/lib/actions/admins'
import { MapPin, Loader2 } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface Props {
  adminId: string
  siteId: string
  siteName: string
  initiallyAssigned: boolean
}

export function AdminWorksiteToggle({ adminId, siteId, siteName, initiallyAssigned }: Props) {
  const [isPending, startTransition] = useTransition()
  
  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleWorksiteAssignment(adminId, siteId, initiallyAssigned)
      if (result.success) {
        toast.success(initiallyAssigned ? `Acceso a ${siteName} removido` : `Acceso a ${siteName} concedido`)
      } else {
        toast.error(result.error || 'Error al cambiar asignación')
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full p-4 rounded-xl border transition-all text-xs font-bold flex items-center gap-3 relative ${
        initiallyAssigned 
        ? 'bg-[#0072ff]/10 border-[#0072ff]/30 text-[#0072ff]' 
        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
      } ${isPending ? 'opacity-50' : ''}`}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#0072ff]" />
      ) : (
        <MapPin className={`h-4 w-4 ${initiallyAssigned ? 'text-[#0072ff]' : 'text-slate-600'}`} />
      )}
      {siteName}
    </button>
  )
}
