'use client'

import { completeOnboarding } from '@/lib/actions/onboarding'
import { SubmitButton } from '@/components/shared/SubmitButton'
import { useActionState } from 'react'
import { Building2, ShieldCheck, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  const [state, formAction] = useActionState(completeOnboarding, null)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f19] p-4 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="mb-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 opacity-25 blur group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl">
                <Building2 className="h-10 w-10 text-[#0072ff]" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white">
              ¡HOLA, <span className="text-[#0072ff]">BIENVENIDO</span>!
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Estás a un paso de <span className="text-[#6cc04a]">digitalizar</span> tu empresa
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <form action={formAction} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Configura tu Empresa</h2>
              <p className="mt-1 text-xs text-slate-400">Personaliza tu panel de control centralizado.</p>
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center animate-shake">
                {state.error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase ml-1">Nombre de la Empresa</label>
                <div className="relative group">
                  <input
                    name="tenantName"
                    type="text"
                    required
                    placeholder="Ej: Constructora Soluciones"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase ml-1">Tu Nombre Completo</label>
                <input
                  name="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3.5 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
                />
              </div>
            </div>

            <SubmitButton className="w-full bg-[#0072ff] hover:bg-blue-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              Comenzar ahora
              <ArrowRight className="h-4 w-4" />
            </SubmitButton>

            <div className="flex items-center justify-center gap-2 pt-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500/50" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Conexión Segura de LOCKSYS</span>
            </div>
          </form>

          {/* <div className="mt-6 pt-6 border-t border-white/5">
            <button
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="w-full text-[10px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-[0.2em] transition-colors"
            >
              ¿No sos vos? Cerrar Sesión
            </button>
          </div> */}
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          © 2026 LOCKSYS. Powered by Soluciones Integrales.
        </p>
      </div>
    </main>
  )
}
