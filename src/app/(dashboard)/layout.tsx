import Link from 'next/link'
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  History, 
  Settings, 
  LogOut,
  ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const navItems = [
    { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { label: 'Sedes', href: '/admin/sedes', icon: MapPin },
    { label: 'Empleados', href: '/admin/empleados', icon: Users },
    { label: 'Asistencias', href: '/admin/asistencias', icon: History },
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0f19] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-xl lg:flex z-50">
        <div className="p-8">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10">
              <ShieldCheck className="h-6 w-6 text-[#0072ff]" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tighter">
                LOCK<span className="text-[#0072ff]">SYS</span>
              </p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Panel de Control</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 transition-all hover:bg-white/5 hover:text-white group"
            >
              <item.icon className="h-5 w-5 text-slate-500 group-hover:text-[#0072ff] transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.email}</p>
              <p className="text-[10px] text-slate-500 font-medium">Administrador</p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 relative">
        {/* Decorative background for all pages */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px]" />
          <div className="absolute bottom-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-emerald-600/5 blur-[120px]" />
        </div>
        
        <div className="relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
