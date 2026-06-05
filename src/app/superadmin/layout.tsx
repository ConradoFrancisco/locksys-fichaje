'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Menu, X } from 'lucide-react'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // Si estamos en login, no validar
    if (pathname === '/superadmin/login') {
      setLoading(false)
      return
    }

    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/superadmin/login')
        return
      }

      // Verificar que sea super admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'super_admin') {
        await supabase.auth.signOut()
        router.replace('/superadmin/login')
        return
      }

      setUser(user)
    } catch (err) {
      console.error('Auth error:', err)
      router.replace('/superadmin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    }
    router.replace('/superadmin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0072ff]"></div>
          </div>
          <p className="text-slate-400 font-medium">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // Mostrar login sin layout
  if (pathname === '/superadmin/login') {
    return <>{children}</>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-white/10 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0072ff] flex items-center justify-center text-white font-bold text-sm">
              SA
            </div>
            {sidebarOpen && <span className="text-white font-black text-sm">Super Admin</span>}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/superadmin"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="w-5 h-5">📊</span>
            {sidebarOpen && <span className="text-sm font-medium">Dashboard</span>}
          </a>
          <a
            href="/superadmin/empresas"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="w-5 h-5">🏢</span>
            {sidebarOpen && <span className="text-sm font-medium">Empresas</span>}
          </a>
        </nav>

        {/* Toggle Sidebar */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-slate-900 border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Panel de Super Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
