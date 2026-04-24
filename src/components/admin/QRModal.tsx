'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QrCode, X, Download, Printer } from 'lucide-react'

export function QRModal({ worksiteId, worksiteName }: { worksiteId: string, worksiteName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `QR-${worksiteName}.png`
      link.href = url
      link.click()
    }
  }

  if (!isOpen || !mounted) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 transition-all hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        title="Ver Código QR"
      >
        <QrCode className="h-5 w-5 transition-transform group-hover:scale-110" />
      </button>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl ring-1 ring-white/10">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-blue-600/10 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-32 w-32 bg-emerald-600/10 blur-[50px] -ml-16 -mb-16 pointer-events-none" />

        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">Acceso por QR</h3>
            <div className="flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{worksiteName}</p>
            </div>
          </div>

          <div className="group relative mx-auto overflow-hidden rounded-3xl bg-white p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all hover:scale-[1.02]">
            <QRCodeCanvas 
              id="qr-canvas"
              value={worksiteId} 
              size={220}
              level="H"
              includeMargin={false}
              className="mx-auto"
            />
          </div>

          <div className="grid gap-3">
            <button 
              onClick={downloadQR}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#0072ff] py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600 hover:shadow-[0_10px_20px_rgba(0,114,255,0.3)] active:scale-95"
            >
              <Download className="h-5 w-5" />
              Descargar Imagen
            </button>
            
            <button 
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white/5 py-4 text-sm font-black uppercase tracking-widest text-slate-300 transition-all hover:bg-white/10"
            >
              <Printer className="h-5 w-5" />
              Imprimir para Sede
            </button>
          </div>
          
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-relaxed">
            Escaneá este código para registrar entrada y salida en <span className="text-blue-400">{worksiteName}</span>
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
