'use client'

import { useState, useRef, useEffect } from 'react'
import { submitAttendance } from '@/lib/actions/attendance'
import { Camera, MapPin, CheckCircle2, AlertCircle, QrCode, RefreshCcw } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface AttendanceClientProps {
  employees: any[]
  worksites: any[]
}

export function AttendanceClient({ employees, worksites }: AttendanceClientProps) {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedWorksite, setSelectedWorksite] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Iniciar Cámara para la Selfie
  useEffect(() => {
    if (!isScanning) {
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } catch (err) {
          console.error("Error cámara:", err)
        }
      }
      startCamera()
    }
  }, [isScanning])

  // Iniciar Scanner de QR
  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      )

      scanner.render((decodedText) => {
        // Validar si el texto decodificado es un ID de sede válido
        const found = worksites.find(w => w.id === decodedText)
        if (found) {
          setSelectedWorksite(found.id)
          setIsScanning(false)
          scanner.clear()
        }
      }, (error) => {
        // console.warn(error)
      })

      return () => {
        scanner.clear()
      }
    }
  }, [isScanning, worksites])

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      const data = canvasRef.current.toDataURL('image/jpeg')
      setPhoto(data)
    }
  }

  const handleFichar = async () => {
    if (!selectedEmployee || !selectedWorksite || !photo) return

    setLoading(true)
    setStatus(null)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      // Obtener o generar ID de dispositivo único y persistente
      let deviceId = localStorage.getItem('attendance_device_id')
      if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem('attendance_device_id', deviceId)
      }

      const formData = new FormData()
      formData.append('employeeId', selectedEmployee)
      formData.append('worksiteId', selectedWorksite)
      formData.append('lat', pos.coords.latitude.toString())
      formData.append('long', pos.coords.longitude.toString())
      formData.append('photo', photo)
      formData.append('deviceId', deviceId)

      const result = await submitAttendance(formData)
      
      if (result?.error) {
        setStatus({ type: 'error', msg: result.error })
      } else {
        setStatus({ type: 'success', msg: '¡Fichaje exitoso!' })
        setPhoto(null)
        // Reset para el próximo
        setTimeout(() => {
          setStatus(null)
          setIsScanning(true)
          setSelectedWorksite('')
        }, 3000)
      }
      setLoading(false)
    }, (err) => {
      setStatus({ type: 'error', msg: 'No se pudo obtener la ubicación GPS.' })
      setLoading(false)
    })
  }

  const currentWorksiteName = worksites.find(w => w.id === selectedWorksite)?.name

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      
      {/* Paso 1: Seleccionar Empleado */}
      {!selectedEmployee && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-black text-slate-900 mb-6">¿Quién ficha hoy?</h2>
          <div className="grid gap-3">
            {employees.map(e => (
              <button
                key={e.id}
                onClick={() => setSelectedEmployee(e.id)}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-slate-700 flex items-center justify-between group"
              >
                {e.full_name}
                <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Escanear QR */}
      {selectedEmployee && isScanning && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl ring-1 ring-slate-200 text-center animate-in fade-in slide-in-from-bottom-4">
          <QrCode className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Escaneá el código QR</h2>
          <p className="text-slate-500 text-sm mb-6">Ubicado en la entrada de la sede.</p>
          <div id="reader" className="overflow-hidden rounded-2xl border-2 border-slate-100" />
          <button 
            onClick={() => setSelectedEmployee('')}
            className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            Cambiar empleado
          </button>
        </div>
      )}

      {/* Paso 3: Foto y Fichaje */}
      {selectedEmployee && !isScanning && selectedWorksite && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Sede Detectada</p>
              <h3 className="text-2xl font-black">{currentWorksiteName}</h3>
              <button 
                onClick={() => setIsScanning(true)}
                className="mt-2 text-[10px] font-bold bg-white/20 px-2 py-1 rounded flex items-center gap-1"
              >
                <RefreshCcw className="h-3 w-3" /> Re-escanear QR
              </button>
            </div>
            <QrCode className="absolute -right-4 -bottom-4 h-24 w-24 opacity-20 rotate-12" />
          </div>

          <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-900 shadow-2xl border-4 border-white">
            {!photo ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover scale-x-[-1]" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-widest">
                  Selfie de Validación
                </div>
                <button 
                  onClick={takePhoto}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white p-5 rounded-full shadow-2xl active:scale-90 transition-transform"
                >
                  <Camera className="h-10 w-10 text-indigo-600" />
                </button>
              </>
            ) : (
              <>
                <img src={photo} alt="Preview" className="h-full w-full object-cover" />
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-full text-white"
                >
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <button
            onClick={handleFichar}
            disabled={loading || !photo}
            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-2xl shadow-2xl disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-indigo-400" />
                CONFIRMAR FICHADA
              </>
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className={`fixed bottom-10 left-4 right-4 p-6 rounded-3xl flex items-center gap-4 shadow-2xl animate-in slide-in-from-bottom-full duration-500 z-50 ${
          status.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
          <div>
            <p className="font-black text-lg leading-tight">{status.type === 'success' ? '¡Excelente!' : 'Error de Fichaje'}</p>
            <p className="text-sm font-medium opacity-90">{status.msg}</p>
          </div>
        </div>
      )}
    </div>
  )
}
