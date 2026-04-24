'use client'

import { signIn, signInWithGoogle } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function AuthListener() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Consultamos el rol para saber a dónde mandarlo
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // Solo el empleado va a setup-password. El admin deja que el middleware decida.
        if (userData?.role === 'employee') {
          router.push('/setup-password')
          router.refresh()
        } else if (!userData) {
          // Si es nuevo (Google), el middleware lo mandará a /onboarding
          router.refresh()
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  return null
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signIn, null)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f19] p-4 relative overflow-hidden">
      <AuthListener />
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mb-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 opacity-25 blur group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl">
                <ShieldCheck className="h-12 w-12 text-[#0072ff]" />
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
              <h2 className="text-xl font-bold text-white">Iniciar Sesión</h2>
              <p className="mt-1 text-xs text-slate-400">Accedé a tu panel de control centralizado.</p>
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center animate-shake">
                {state.error}
              </div>
            )}

            <div className="grid gap-4">
              <form action={async () => { await signInWithGoogle() }}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0072ff]"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="h-4 w-4" />
                  Continuar con Google
                </button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-[#111827] px-2 text-slate-500 font-bold">O con tu cuenta</span>
              </div>
            </div>

            <form action={formAction} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@locksys.com"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Contraseña</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-[#0072ff] focus:ring-1 focus:ring-[#0072ff] outline-none transition-all"
                  />
                </div>
              </div>

              <SubmitButton className="w-full bg-[#0072ff] hover:bg-blue-600 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20">
                Entrar al Panel
              </SubmitButton>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="font-bold text-[#0072ff] hover:text-blue-400 transition-colors">
                Registrá tu empresa
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          © 2026 LOCKSYS. Powered by Soluciones Integrales.
        </p>
      </div>
    </main>
  )
}
