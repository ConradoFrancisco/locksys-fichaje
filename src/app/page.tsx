'use client'

import { AlertCircle } from 'lucide-react'

export default function PausedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-red-600/5 blur-[150px]" />
      </div>

      {/* Contenido central */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-12 flex justify-center">
          <img 
            src="/lock-sys-logo.png"
            alt="LockSys Ordena"
            className="h-24 w-24 rounded-xl opacity-75"
          />
        </div>

        {/* Icono de pausa */}
        <div className="mb-8 flex justify-center">
          <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
          Proyecto <span className="text-red-500">Pausado</span>
        </h1>

        {/* Descripción */}
        <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
          Lamentamos informar que este proyecto se encuentra temporalmente pausado.
          <br />
          <br />
          Por favor, contacta con el administrador para más información.
        </p>

        {/* Mensaje adicional */}
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
          <p className="text-sm text-slate-300">
            <span className="font-bold text-slate-200">Estado:</span> Pausado
            <br />
            <span className="font-bold text-slate-200">Acceso:</span> No disponible
            <br />
            <span className="font-bold text-slate-200">Notificaciones:</span> Se enviarán cuando se reanude el servicio
          </p>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            © 2026 LOCKSYS - SEGURIDAD Y CONTROL.
          </p>
        </div>
      </div>
    </div>
  )
}
