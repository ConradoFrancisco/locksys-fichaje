'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signInEmployee } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import Image from 'next/image'
import { Smartphone, ArrowLeft } from 'lucide-react'

/**
 * Listener de cliente: cuando Supabase detecta el evento SIGNED_IN,
 * evalúa el rol y redirige al portal correcto.
 */
function EmployeeAuthListener() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: userData } = await supabase
            .from('users')
            .select('role, employees(needs_password_change)')
            .eq('id', session.user.id)
            .single()

          if (userData?.role === 'employee') {
            const employeeData = Array.isArray(userData.employees)
              ? userData.employees[0]
              : userData.employees
            const needsSetup = employeeData?.needs_password_change ?? true

            if (needsSetup) {
              router.push('/setup-password')
            } else {
              router.push('/fichar')
            }
            router.refresh()
          } else {
            // No es empleado: cerramos sesión y mostramos error
            await supabase.auth.signOut()
            router.refresh()
          }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [supabase, router])

  return null
}

export default function EmpleadoLoginPage() {
  const [state, formAction] = useActionState(signInEmployee, null)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f19] p-4 relative overflow-hidden">
      <EmployeeAuthListener />

      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">

        {/* Volver */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" />
            Volver al inicio
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 opacity-25 blur group-hover:opacity-50 transition duration-1000" />
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-2xl p-2">
                <Image
                  src="/lock-sys-logo.png"
                  alt="LockSys"
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
              LOCK<span className="text-emerald-400">SYS</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <Smartphone className="h-3 w-3" />
              Portal del Empleado
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Acceso de Empleados</h2>
              <p className="mt-1 text-xs text-slate-400">
                Ingresá con el email y contraseña que te proporcionó tu empresa.
              </p>
            </div>

            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3 text-xs font-bold text-red-400 ring-1 ring-red-500/20 text-center">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">
                    Contraseña
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <SubmitButton className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all">
                Ingresar
              </SubmitButton>
            </form>

            <div className="pt-2 text-center text-[10px] text-slate-600 font-medium leading-relaxed">
              ¿Perdiste el acceso? Contactá al administrador de tu empresa.<br />
              Tu primer ingreso usa el link del email de invitación.
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
          © 2026 LOCKSYS. Powered by Soluciones Integrales.
        </p>
      </div>
    </main>
  )
}
