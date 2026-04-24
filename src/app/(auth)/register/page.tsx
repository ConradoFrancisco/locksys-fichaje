'use client'

import { signUp } from '@/lib/actions/auth'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import { useActionState } from 'react'

export default function RegisterPage() {
  const [state, formAction] = useActionState(signUp, null)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crear Cuenta</h1>
          <p className="mt-2 text-slate-600">Registrá tu empresa y empezá a gestionar fichajes.</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-600/20">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre de la Empresa</label>
            <input
              name="tenantName"
              type="text"
              required
              placeholder="Soluciones Integrales S.A."
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Tu Nombre Completo</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="Emanuel"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="sintegralesba@gmail.com"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <SubmitButton className="w-full py-3">Registrar Empresa</SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
