'use client'

import { setupPasswordAndDevice } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import { useActionState, useEffect, useState } from 'react'
import { ShieldCheck, Smartphone, Lock, AlertCircle } from 'lucide-react'
export default function SetupPasswordPage() {
  const [state, formAction] = useActionState(setupPasswordAndDevice, null)
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    // Lógica de Device Binding: Si no hay ID en este navegador, lo creamos
    let id = localStorage.getItem('locksys_device_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('locksys_device_id', id)
    }
    setDeviceId(id)
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f19] p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mb-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-emerald-500 opacity-25 blur group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl">
                <Smartphone className="h-12 w-12 text-[#6cc04a]" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">
              Vincular <span className="text-[#6cc04a]">Dispositivo</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Configurá tu cuenta y protegé tu acceso
            </p>
          </div>
        </div>

        <div className="locksys-card p-8">
          <form action={formAction} className="space-y-6">
            <div className="rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/20 text-xs text-indigo-300 font-medium leading-relaxed">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-bold uppercase tracking-widest">Seguridad LOCKSYS</span>
              </div>
              Esta es tu primera vez. Al elegir tu contraseña, este teléfono quedará vinculado como tu **dispositivo único de fichaje**.
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center">
                {state.error}
              </div>
            )}

            <input type="hidden" name="deviceId" value={deviceId} />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Elegí una clave segura"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 pl-12 pr-4 py-3 text-white placeholder-slate-700 focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Repetir Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirmá tu clave"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 pl-12 pr-4 py-3 text-white placeholder-slate-700 focus:border-[#6cc04a] focus:ring-1 focus:ring-[#6cc04a] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <SubmitButton className="w-full bg-[#6cc04a] hover:bg-emerald-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 text-slate-950">
              VINCULAR Y ACTIVAR
            </SubmitButton>
          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          ID de Equipo Detectado: {deviceId.substring(0, 8)}...
        </p>
      </div>
    </main>
  )
}
