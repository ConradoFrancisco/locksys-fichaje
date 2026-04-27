import Link from 'next/link'
import type { SVGProps } from 'react'
import { ShieldCheck, MapPin, Users, Smartphone, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f19] text-white selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      
      {/* Luces de fondo decorativas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-600/10 blur-[150px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {/* <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <ShieldCheck className="h-6 w-6 text-[#0072ff]" />
          </div>
          <span className="text-2xl font-black tracking-tighter">
            LOCK<span className="text-[#0072ff]">SYS</span>
          </span> */}
          <img 
            src="/lock-sys-logo.png"
            alt="LockSys Ordena"
            className="h-40 w-40 rounded-xl flex items-center justify-center shadow-blue-500/10"
          />
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funciones</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
          <a href="#contact" className="hover:text-white transition-colors">Soporte</a>
        </nav>

        <Link 
          href="/login" 
          className="rounded-full bg-white/5 border border-white/10 px-6 py-2 text-xs font-bold hover:bg-white/10 transition-all backdrop-blur-md"
        >
          Acceso Clientes
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Disponible para toda Latinoamérica
        </div>

        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
          Tecnología que <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">ordena</span> tu equipo.
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium mb-12">
          Control de asistencia SaaS con geolocalización, reconocimiento facial y códigos QR. 
          Seguridad absoluta para empresas modernas.
        </p>

        {/* CTAs Principales */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Link 
            href="/login"
            className="w-full md:w-auto bg-[#0072ff] hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <ShieldCheck className="h-6 w-6" />
            SOY EMPRESA
          </Link>
          
          <Link 
            href="/fichar"
            className="w-full md:w-auto bg-white/5 hover:bg-white/10 text-white border border-white/10 px-8 py-5 rounded-2xl font-black text-lg backdrop-blur-xl transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Smartphone className="h-6 w-6" />
            SOY EMPLEADO
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: MapPin, 
              title: "Geolocalización", 
              desc: "Validamos la ubicación exacta del empleado al momento de fichar mediante GPS.",
              color: "text-blue-500" 
            },
            { 
              icon: Smartphone, 
              title: "Device Binding", 
              desc: "Seguridad por dispositivo. Nadie puede fichar desde un teléfono no autorizado.",
              color: "text-emerald-500" 
            },
            { 
              icon: History, 
              title: "Reportes en Vivo", 
              desc: "Dashboard en tiempo real para visualizar ingresos, egresos y llegadas tarde.",
              color: "text-indigo-500" 
            }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/20 transition-all group">
              <feature.icon className={`h-12 w-12 ${feature.color} mb-6 group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WhatsApp Floating CTA */}
      <a 
        href="https://wa.me/5491100000000" 
        target="_blank"
        className="fixed bottom-8 right-8 z-[100] bg-[#25D366] text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-90 flex items-center justify-center group"
      >
        <MessageCircle className="h-8 w-8" />
        <span className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          ¿Consultas? Escribinos
        </span>
      </a>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <ShieldCheck className="h-6 w-6 text-[#0072ff]" />
          <span className="text-xl font-black tracking-tighter">
            LOCK<span className="text-[#0072ff]">SYS</span>
          </span>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          © 2026 LOCKSYS - SEGURIDAD Y CONTROL.
        </p>
      </footer>

    </div>
  )
}

function History(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}
