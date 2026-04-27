'use client'

import { setupPasswordAndDevice } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Image from 'next/image'
import { useActionState, useEffect, useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
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
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 opacity-25 blur group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl p-2">
                <Image
                  src="/lock-sys-logo.png"
                  alt="LockSys Ordena"
                  width={64}
                  height={64}
                  priority
                  className="group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              LOCK<span className="text-[#0072ff]">SYS</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Configurá tu <span className="text-[#6cc04a]">contraseña</span> de acceso
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <form action={formAction} className="space-y-6">
            <div className="rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/20 text-xs text-indigo-300 font-medium leading-relaxed">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-bold uppercase tracking-widest">Seguridad LOCKSYS</span>
              </div>
              Esta es tu primera vez. Al elegir tu contraseña, este dispositivo quedará vinculado como tu **dispositivo único de fichaje**.
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center">
                {state.error}
              </div>
            )}

            <input type="hidden" name="deviceId" value={deviceId} />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Nueva Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="Elegí una clave segura"
                    className="block w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-2 text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Repetir Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-600" />
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Confirmá tu clave"
                    className="block w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-2 text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                  />
                </div>
              </div>
            </div>

            <SubmitButton className="w-full bg-gradient-to-r from-[#0072ff] to-[#00d4ff] hover:opacity-90 py-3 rounded-lg font-bold text-white uppercase tracking-widest shadow-lg shadow-blue-500/20">
              VINCULAR DISPOSITIVO
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
