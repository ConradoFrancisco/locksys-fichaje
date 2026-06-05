'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Check } from 'lucide-react'

export default function SuperAdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkExistingAuth()
  }, [])

  const checkExistingAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData?.role === 'super_admin') {
          router.replace('/superadmin')
          return
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        throw new Error('Email o contraseña incorrectos')
      }

      if (!authData?.user) {
        throw new Error('Error en la autenticación')
      }

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (dbError) {
        throw new Error('Error verificando rol de usuario')
      }

      if (userData?.role !== 'super_admin') {
        await supabase.auth.signOut()
        throw new Error('Este usuario no tiene acceso al panel de super admin')
      }

      router.replace('/superadmin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072ff]"></div>
          </div>
          <p className="text-slate-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0072ff] text-white font-black text-lg mb-4">
            SA
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Super Admin</h1>
          <p className="text-slate-400 text-sm">Panel de administración de la plataforma</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 animate-in">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:border-[#0072ff] focus:outline-none transition-colors disabled:opacity-50"
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white placeholder-slate-500 focus:border-[#0072ff] focus:outline-none transition-colors disabled:opacity-50"
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full mt-6 px-4 py-3 bg-[#0072ff] hover:bg-[#0072ff]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Ingresando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Ingresar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400 font-bold mb-2">💡 INFO</p>
            <p className="text-xs text-blue-400/80 leading-relaxed">
              Si olvidaste tu contraseña, contacta al administrador técnico.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          © 2024 Fichajes Soluciones Integrales
        </p>
      </div>
    </div>
  )
}
