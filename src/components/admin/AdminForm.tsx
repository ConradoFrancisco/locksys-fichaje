'use client'

import { createSubAdmin } from '@/lib/actions/admins'
import { useActionState, useEffect, useRef } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AdminForm() {
  const [state, formAction, isPending] = useActionState(createSubAdmin, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success('¡Invitación enviada con éxito!')
      formRef.current?.reset()
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="locksys-card p-8 space-y-6 sticky top-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-[#0072ff]/20 flex items-center justify-center text-[#0072ff]">
          <UserPlus className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-white">Nuevo Admin</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
          <input
            name="fullName"
            type="text"
            required
            placeholder="Ej: Carlos Admin"
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="admin@empresa.com"
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
          />
        </div>
      </div>

      <button 
        disabled={isPending}
        className="w-full bg-[#0072ff] hover:bg-blue-600 disabled:opacity-50 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 text-white transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            ENVIANDO...
          </>
        ) : (
          'INVITAR ADMINISTRADOR'
        )}
      </button>
    </form>
  )
}
