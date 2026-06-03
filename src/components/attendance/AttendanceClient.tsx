'use client'

import { useState, useRef, useEffect } from 'react'
import { submitAttendance } from '@/lib/actions/attendance'
import { DeviceChangeButton } from '@/components/employee/DeviceChangeButton'
import { 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  RefreshCcw, 
  Smartphone, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  ChevronLeft
} from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { toast } from 'sonner'

interface AttendanceClientProps {
  employee: {
    id: string
    full_name: string
    device_id: string | null
    tenant_id: string
    worksite_id: string | null
  }
  worksites: any[]
  todaySchedule: {
    start_time: string
    end_time: string
  } | null
  activeAttendance: {
    id: string
    check_in: string
    worksite_id: string
  } | null
}

export function AttendanceClient({ 
  employee, 
  worksites, 
  todaySchedule, 
  activeAttendance 
}: AttendanceClientProps) {
  // Flujo de 4 Pasos: 
  // 1: Validación de dispositivo
  // 2: Escanear QR
  // 3: Feedback de puntualidad / Info fichaje
  // 4: Selfie + Confirmación
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedWorksite, setSelectedWorksite] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [deviceId, setDeviceId] = useState('')
  const [deviceMismatch, setDeviceMismatch] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Paso 1: Validación de Dispositivo al montar
  useEffect(() => {
    let localId = localStorage.getItem('locksys_device_id')
    if (!localId) {
      localId = crypto.randomUUID()
      localStorage.setItem('locksys_device_id', localId)
    }
    setDeviceId(localId)

    if (!employee.device_id) {
      // Si no tiene device_id en la DB, se vinculará automáticamente al fichar
      setStep(2)
    } else if (employee.device_id === localId) {
      // Dispositivo correcto
      setStep(2)
    } else {
      // Dispositivo incorrecto
      setDeviceMismatch(true)
    }
  }, [employee.device_id])

  // Paso 2: Iniciar Scanner de QR de forma segura
  useEffect(() => {
    if (step === 2) {
      let scanner: Html5QrcodeScanner | null = null
      
      const timer = setTimeout(() => {
        try {
          const container = document.getElementById('reader')
          if (container) {
            scanner = new Html5QrcodeScanner(
              "reader", 
              { fps: 10, qrbox: { width: 250, height: 250 } },
              /* verbose= */ false
            )

            scanner.render((decodedText) => {
              const found = worksites.find(w => w.id === decodedText)
              if (found) {
                setSelectedWorksite(found.id)
                setStep(3)
                scanner?.clear().catch(e => console.error("Error clearing scanner:", e))
              } else {
                toast.error("Código QR no corresponde a ninguna sede registrada.")
              }
            }, (error) => {
              // Ignore standard scanner search feedback
            })
          }
        } catch (err) {
          console.error("Error setting up QR scanner:", err)
        }
      }, 100)

      return () => {
        clearTimeout(timer)
        if (scanner) {
          scanner.clear().catch(e => console.error("Error clearing scanner on unmount:", e))
        }
      }
    }
  }, [step, worksites])

  // Paso 4: Iniciar Cámara para la Selfie
  useEffect(() => {
    let activeStream: MediaStream | null = null

    if (step === 4 && !photo) {
      async function startCamera() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 480, height: 480 } 
          })
          activeStream = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        } catch (err) {
          console.error("Error al iniciar cámara:", err)
          toast.error("No se pudo acceder a la cámara frontal.")
        }
      }
      startCamera()
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [step, photo])

  // Capturar Foto
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

  // Fichaje Final
  const handleFichar = async () => {
    if (!selectedWorksite || !photo) return

    setLoading(true)
    setStatus(null)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const formData = new FormData()
      formData.append('worksiteId', selectedWorksite)
      formData.append('lat', pos.coords.latitude.toString())
      formData.append('long', pos.coords.longitude.toString())
      formData.append('photo', photo)
      formData.append('deviceId', deviceId)

      try {
        const result = await submitAttendance(formData)
        
        if (result?.error) {
          setStatus({ type: 'error', msg: result.error })
          toast.error(result.error)
        } else {
          setStatus({ type: 'success', msg: result?.message || '¡Fichaje registrado con éxito!' })
          toast.success(result?.message || '¡Fichaje registrado con éxito!')
          setPhoto(null)
          
          // Reset y volver al principio
          setTimeout(() => {
            setStatus(null)
            setSelectedWorksite('')
            setPhoto(null)
            setStep(2)
          }, 4000)
        }
      } catch (err) {
        console.error("Fichaje error:", err)
        setStatus({ type: 'error', msg: 'Error de red o del servidor al enviar la asistencia.' })
      } finally {
        setLoading(false)
      }
    }, (err) => {
      setStatus({ type: 'error', msg: 'No se pudo obtener la ubicación GPS requerida para el fichaje.' })
      toast.error('Ubicación GPS requerida. Habilitá los permisos de ubicación.')
      setLoading(false)
    })
  }

  const currentWorksiteObj = worksites.find(w => w.id === selectedWorksite)
  const currentWorksiteName = currentWorksiteObj?.name || 'Sede Seleccionada'

  // Cálculos de Puntualidad (Retorna color y descripción)
  const getPunctualityDetails = () => {
    if (activeAttendance) {
      // Es una salida
      const checkInDate = new Date(activeAttendance.check_in)
      const diffMs = new Date().getTime() - checkInDate.getTime()
      const hours = Math.floor(diffMs / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      return {
        type: 'checkout',
        badge: '🟢 Salida',
        message: `Vas a registrar tu salida de la sede.`,
        detail: `Ingreso registrado a las ${checkInDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}. Tiempo de jornada: ${hours}h ${minutes}m.`,
        colorClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
      }
    }

    if (!todaySchedule) {
      return {
        type: 'blocked',
        badge: '🔴 Sin Horario',
        message: 'No tenés horario programado para hoy.',
        detail: 'El sistema bloquea fichajes en días no planificados. Comunicate con tu supervisor si deberías trabajar hoy.',
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      }
    }

    // Es entrada y tiene horario
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}))
    const currentHours = now.getHours()
    const currentMins = now.getMinutes()
    const [schedHours, schedMins] = todaySchedule.start_time.split(':').map(Number)
    
    const scheduledTotalMins = (schedHours * 60) + schedMins
    const currentTotalMins = (currentHours * 60) + currentMins
    const diffMins = currentTotalMins - scheduledTotalMins
    const tolerance = currentWorksiteObj?.tolerance_minutes || 0

    const formatTimeDiff = (totalMins: number) => {
      const hrs = Math.floor(totalMins / 60)
      const mins = totalMins % 60
      if (hrs > 0) {
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
      }
      return `${mins} min`
    }

    if (diffMins < 0) {
      // Temprano
      const minsEarly = Math.abs(diffMins)
      const formattedDiff = formatTimeDiff(minsEarly)
      return {
        type: 'early',
        badge: '🟢 Temprano',
        message: `Llegaste ${formattedDiff} antes de tu horario.`,
        detail: `Tu entrada programada es a las ${todaySchedule.start_time}. ¡Excelente puntualidad!`,
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      }
    } else if (diffMins <= tolerance) {
      // A tiempo
      return {
        type: 'ontime',
        badge: '🟡 A tiempo',
        message: 'Llegaste justo a tiempo.',
        detail: `Tu entrada programada es a las ${todaySchedule.start_time} (Tolerancia: ${tolerance} min).`,
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      }
    } else {
      // Tarde
      const formattedDiff = formatTimeDiff(diffMins)
      return {
        type: 'late',
        badge: '🔴 Tarde',
        message: `Llegaste ${formattedDiff} tarde.`,
        detail: `Tu entrada programada era a las ${todaySchedule.start_time} (Tolerancia de ${tolerance} min superada).`,
        colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      }
    }
  }

  const punctuality = getPunctualityDetails()

  return (
    <div className="space-y-6">
      {/* Progress step indicators */}
      {!deviceMismatch && (
        <div className="flex items-center justify-between px-2 py-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === s 
                  ? 'bg-[#0072ff] text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/20' 
                  : step > s 
                    ? 'bg-[#6cc04a] text-white' 
                    : 'bg-slate-900 text-slate-500 border border-white/5'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`h-[2px] flex-1 mx-2 rounded-full transition-all ${
                  step > s ? 'bg-[#6cc04a]' : 'bg-slate-900'
                }`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Device Mismatch Error Screen */}
      {deviceMismatch && (
        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 mx-auto border border-rose-500/20">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Dispositivo no autorizado</h2>
            <p className="text-xs leading-relaxed text-slate-400">
              Estás intentando fichar desde un dispositivo diferente al vinculado en tu cuenta. 
              Por cuestiones de seguridad, solo podés fichar usando tu teléfono registrado.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-[10px] font-mono text-slate-500 break-all select-all">
            ID Detectado: {deviceId}
          </div>
          <DeviceChangeButton newDeviceId={deviceId} className="w-full" />
        </div>
      )}

      {/* STEP 2: QR Code Scanning Screen */}
      {step === 2 && !deviceMismatch && (
        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto border border-blue-500/20">
            <QrCode className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Escaneá el código QR</h2>
            <p className="text-xs text-slate-400">Escaneá el código ubicado en la entrada de la sede.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-800/40 p-4">
            <style dangerouslySetInnerHTML={{__html: `
              #reader {
                border: none !important;
                background: transparent !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 1.5rem !important;
              }
              #reader__scan_region {
                min-height: auto !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                width: 100% !important;
              }
              #reader__scan_region img {
                width: 72px !important;
                height: auto !important;
                margin: 0 auto !important;
                opacity: 0.9 !important;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) !important;
                animation: pulse-slow 3s infinite ease-in-out;
              }
              #reader__dashboard {
                width: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 1rem !important;
              }
              #reader__dashboard_section {
                width: 100% !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 0.75rem !important;
              }
              #reader__dashboard_section_csr {
                width: 100% !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
              }
              #html5-qrcode-button-camera-permission {
                background-color: #0072ff !important;
                color: white !important;
                font-weight: 800 !important;
                font-size: 0.875rem !important;
                padding: 0.875rem 1.75rem !important;
                border-radius: 0.75rem !important;
                border: none !important;
                cursor: pointer !important;
                transition: all 0.2s ease-in-out !important;
                box-shadow: 0 4px 14px rgba(0, 114, 255, 0.3) !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
              }
              #html5-qrcode-button-camera-permission:hover {
                background-color: #0062db !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 6px 20px rgba(0, 114, 255, 0.4) !important;
              }
              #html5-qrcode-button-camera-permission:active {
                transform: translateY(1px) !important;
              }
              #html5-qrcode-anchor-scan-type-change {
                color: #94a3b8 !important;
                font-size: 0.8rem !important;
                font-weight: 700 !important;
                text-decoration: underline !important;
                cursor: pointer !important;
                transition: color 0.2s !important;
              }
              #html5-qrcode-anchor-scan-type-change:hover {
                color: white !important;
              }
              @keyframes pulse-slow {
                0%, 100% {
                  transform: scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: scale(1.05);
                  opacity: 1;
                }
              }
            `}} />
            <div id="reader" className="w-full overflow-hidden rounded-xl" />
          </div>
        </div>
      )}

      {/* STEP 3: Punctuality & Attendance Feedback Screen */}
      {step === 3 && (
        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Sede Detectada</p>
              <h3 className="text-2xl font-black text-white tracking-tight">{currentWorksiteName}</h3>
            </div>
            <button 
              onClick={() => setStep(2)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-white/10"
              title="Volver a escanear"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${punctuality.colorClass}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10">
                {punctuality.badge}
              </span>
            </div>
            <div className="space-y-1">
              <p className="font-black text-base text-white">{punctuality.message}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{punctuality.detail}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Volver
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={punctuality.type === 'blocked'}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-black py-4 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30"
            >
              Continuar a la Foto <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Camera Selfie & Confirm screen */}
      {step === 4 && (
        <div className="rounded-3xl bg-slate-900/50 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Último Paso</p>
              <h3 className="text-xl font-black text-white tracking-tight">Validación Facial</h3>
            </div>
            <button 
              onClick={() => {
                setPhoto(null)
                setStep(3)
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all hover:bg-white/10"
              title="Volver"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center">
            {!photo ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover scale-x-[-1] rounded-2xl" />
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white font-bold uppercase tracking-widest border border-white/15">
                  Mirá a la cámara
                </div>
                <button 
                  onClick={takePhoto}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-indigo-600 p-4.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform"
                >
                  <Camera className="h-7 w-7" />
                </button>
              </>
            ) : (
              <>
                <img src={photo} alt="Preview" className="h-full w-full object-cover rounded-2xl" />
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md p-2.5 rounded-full text-white border border-white/15 hover:bg-slate-800 transition-colors"
                  title="Tomar otra foto"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhoto(null)
                setStep(3)
              }}
              className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              Atrás
            </button>
            <button
              onClick={handleFichar}
              disabled={loading || !photo}
              className="flex-[2] bg-[#6cc04a] hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black py-4 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-slate-950" />
                  {activeAttendance ? 'CONFIRMAR SALIDA' : 'CONFIRMAR ENTRADA'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Status Message Notification */}
      {status && (
        <div className={`fixed bottom-10 left-4 right-4 p-5 rounded-2xl flex items-center gap-3.5 shadow-2xl border animate-in slide-in-from-bottom-full duration-500 z-50 ${
          status.type === 'success' 
            ? 'bg-slate-900/90 text-white border-[#6cc04a]/30 backdrop-blur-md' 
            : 'bg-rose-950/95 text-white border-rose-500/20 backdrop-blur-md'
        }`}>
          {status.type === 'success' ? (
            <div className="p-2 bg-[#6cc04a]/10 rounded-xl text-[#6cc04a]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          ) : (
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-black text-sm leading-tight">
              {status.type === 'success' ? 'Fichaje Exitoso' : 'Error de Fichaje'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{status.msg}</p>
          </div>
        </div>
      )}
    </div>
  )
}
