import Link from 'next/link'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  History, 
  Settings, 
  LogOut,
  Calendar,
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

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = userData?.role === 'admin'

  const navItems = [
    { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
    { label: 'Sedes', href: '/admin/sedes', icon: MapPin },
    { label: 'Empleados', href: '/admin/empleados', icon: Users },
    { label: 'Planificación', href: '/admin/planificacion', icon: Calendar },
    { label: 'Asistencias', href: '/admin/asistencias', icon: History },
  ]

  if (isOwner) {
    navItems.push({ label: 'Administradores', href: '/admin/administradores', icon: Settings })
  }

  return (
    <div className="flex min-h-screen bg-[#0a0f19] text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-xl lg:flex z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-3 group flex-1">
            <div className="h-12 w-12 flex-shrink-0 relative">
              <Image
                src="/lock-sys-logo.png"
                alt="LockSys Ordena"
                fill
                className="object-contain group-hover:scale-110 transition-transform"
              />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">
                LOCK<span className="text-[#0072ff]">SYS</span>
              </p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Ordena</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-6">
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
