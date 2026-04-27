'use client'

import { signUp } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import Image from 'next/image'
import { useActionState } from 'react'

export default function RegisterPage() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f19] p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

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
              Tecnología que <span className="text-[#6cc04a]">ordena</span> tu equipo
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Crear Cuenta</h2>
              <p className="mt-1 text-xs text-slate-400">Registrá tu empresa y empezá a gestionar fichajes.</p>
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center animate-shake">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Nombre de la Empresa</label>
                <input
                  name="tenantName"
                  type="text"
                  required
                  placeholder="Soluciones Integrales S.A."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Tu Nombre Completo</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="Emanuel"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="sintegralesba@gmail.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Contraseña</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-slate-500 transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff] focus:bg-white/5"
                />
              </div>

              <SubmitButton className="w-full py-3 mt-6 rounded-lg bg-gradient-to-r from-[#0072ff] to-[#00d4ff] font-bold text-white hover:opacity-90 transition-opacity">
                Registrar Empresa
              </SubmitButton>
            </form>

            <p className="text-center text-xs text-slate-400 pt-4 border-t border-white/5">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="font-bold text-[#0072ff] hover:text-[#00d4ff] transition-colors">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
