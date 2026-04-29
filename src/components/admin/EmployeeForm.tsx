'use client'

import { createEmployee } from '@/lib/actions/employees'
import { SubmitButton } from '@/components/shared/SubmitButton'
import { useActionState, useEffect, useRef } from 'react'
import { UserPlus } from 'lucide-react'

export function EmployeeForm({ departments, worksites }: { departments: any[], worksites: any[] }) {
  const [state, formAction] = useActionState(createEmployee, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="locksys-card p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-[#6cc04a]/20 flex items-center justify-center text-[#6cc04a]">
          <UserPlus className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-white">Nuevo Empleado</h2>
      </div>
      
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-[#6cc04a] ring-1 ring-emerald-500/20 text-center">
          ¡Empleado dado de alta correctamente!
        </div>
      )}

      <div className="grid gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Email del Empleado</label>
          <input
            name="email"
            type="email"
            required
            placeholder="ejemplo@correo.com"
            className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Área / Sector</label>
            <select
              name="department_id"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all appearance-none"
            >
              <option value="" className="bg-slate-900">Seleccionar área...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Sede / Ubicación</label>
            <select
              name="worksite_id"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all appearance-none"
            >
              <option value="" className="bg-slate-900">Seleccionar sede...</option>
              {worksites.map(w => (
                <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
        <input
          name="fullName"
          type="text"
          required
          placeholder="Ej: Pedro Gómez"
          className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">DNI del Empleado</label>
        <input
          name="internalId"
          type="text"
          placeholder="Ej: 35123456"
          className="w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all"
        />
      </div>

      <SubmitButton className="w-full bg-[#6cc04a] hover:bg-emerald-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 text-slate-900">
        DAR DE ALTA AHORA
      </SubmitButton>
    </form>
  )
}
