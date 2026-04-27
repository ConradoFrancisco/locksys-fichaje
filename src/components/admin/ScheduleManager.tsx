'use client'

import { useState, useEffect } from 'react'
import { saveSchedule, saveWeekSchedules } from '@/lib/actions/schedules'
import { Clock, MousePointer2, RefreshCw, Ban } from 'lucide-react'
import { addDays, isSameMonth, parseISO } from 'date-fns'
import { toast } from 'sonner'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface ScheduleManagerProps {
  employeeId: string
  initialSchedules: any[]
  weekNumber: number
  month: number
  year: number
  weekStartDate: string
  weekEndDate: string
}

export function ScheduleManager({ 
  employeeId, 
  initialSchedules,
  weekNumber,
  month,
  year,
  weekStartDate,
  weekEndDate
}: ScheduleManagerProps) {
  const [data, setData] = useState<{ [key: number]: { start: number, end: number, active: boolean } }>(() => {
    const initial: any = {}
    DAYS.forEach((_, i) => {
      // Mapeo inverso: de índice UI (Lunes=0) a DB (Lunes=1, Dom=0)
      const dbDay = (i + 1) % 7
      const existing = initialSchedules.find(s => s.day_of_week === dbDay)
      if (existing) {
        initial[i] = {
          start: parseInt(existing.start_time.split(':')[0]),
          end: parseInt(existing.end_time.split(':')[0]),
          active: true
        }
      } else {
        initial[i] = { start: 9, end: 18, active: false }
      }
    })
    return initial
  })

  // Sincronizar estado cuando cambian los horarios iniciales (cambio de semana)
  useEffect(() => {
    const newData: any = {}
    DAYS.forEach((_, i) => {
      const dbDay = (i + 1) % 7
      const existing = initialSchedules.find(s => s.day_of_week === dbDay)
      if (existing) {
        newData[i] = {
          start: parseInt(existing.start_time.split(':')[0]),
          end: parseInt(existing.end_time.split(':')[0]),
          active: true
        }
      } else {
        newData[i] = { start: 9, end: 18, active: false }
      }
    })
    setData(newData)
    setHasChanges(false)
  }, [initialSchedules])

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number, hour: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const [hasChanges, setHasChanges] = useState(false)

  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true)
    setDragStart({ day, hour })
    setData(prev => ({
      ...prev,
      [day]: { ...prev[day], start: hour, end: hour + 1, active: true }
    }))
    setHasChanges(true)
  }

  const handleMouseEnter = (day: number, hour: number) => {
    if (!isDragging || !dragStart || dragStart.day !== day) return

    const start = Math.min(dragStart.hour, hour)
    const end = Math.max(dragStart.hour, hour) + 1

    setData(prev => ({
      ...prev,
      [day]: { ...prev[day], start, end, active: true }
    }))
    setHasChanges(true)
  }

  const handleMouseUp = () => {
    if (!isDragging || !dragStart) return
    setIsDragging(false)
    setDragStart(null)
  }

  const clearDay = (day: number) => {
    setData(prev => ({ ...prev, [day]: { ...prev[day], active: false } }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const weeksData = DAYS.map((_, i) => ({
        dayOfWeek: (i + 1) % 7,
        startTime: `${data[i].start.toString().padStart(2, '0')}:00`,
        endTime: `${data[i].end.toString().padStart(2, '0')}:00`,
        isActive: data[i].active
      }))

      const result = await saveWeekSchedules(
        employeeId,
        weeksData,
        weekNumber,
        month,
        year,
        weekStartDate,
        weekEndDate
      )

      if (result?.error) {
        toast.error(`Error: ${result.error}`)
      } else {
        setHasChanges(false)
        toast.success('¡Horarios guardados con éxito!')
      }
    } catch (error) {
      toast.error('Error de conexión al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="locksys-card overflow-hidden select-none w-full border-white/5 shadow-2xl">
      <div className="bg-white/5 p-6 text-white flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-black flex items-center gap-3 text-[#0072ff]">
              <Clock className="h-6 w-6" />
              Línea de Tiempo Semanal
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Arrastrá horizontalmente para definir turnos.</p>
          </div>
          <div className="h-10 w-px bg-white/5"></div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <div className="h-3 w-3 bg-[#0072ff] rounded-sm shadow-[0_0_8px_#0072ff]"></div>
               <span>Laboral</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <div className="h-3 w-3 bg-white/5 border border-white/10 rounded-sm"></div>
               <span>No laboral</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest animate-pulse mr-2">
              Cambios pendientes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              hasChanges 
                ? 'bg-[#0072ff] text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {loading ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>
      </div>

      <div className="p-8 overflow-x-auto custom-scrollbar">
        <div className="min-w-[1200px] space-y-6">
          {/* Cabecera Horas */}
          <div className="grid grid-cols-[150px_repeat(24,1fr)]">
            <div className="h-8"></div>
            {HOURS.map(h => (
              <div key={h} className="text-center text-[10px] font-black text-slate-600 border-l border-white/5">
                {h}h
              </div>
            ))}
          </div>

          {/* Filas de Días */}
          <div className="space-y-4">
            {DAYS.map((dayName, dayIndex) => {
              const start = parseISO(weekStartDate)
              const offset = dayIndex
              const dayDate = addDays(start, offset)
              const outOfMonth = dayDate.getMonth() + 1 !== month

              return (
                <div 
                  key={dayIndex} 
                  className={`grid grid-cols-[150px_repeat(24,1fr)] items-center group transition-all ${
                    outOfMonth ? 'opacity-20 grayscale pointer-events-none select-none' : ''
                  }`}
                >
                  <div className="pr-4 flex flex-col justify-center relative">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{dayName}</span>
                      {outOfMonth && <Ban className="h-3 w-3 text-slate-600" />}
                    </div>
                    {outOfMonth ? (
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">Fuera de mes</span>
                    ) : (
                      <button 
                        onClick={() => clearDay(dayIndex)}
                        className="text-[10px] text-red-500/70 hover:text-red-400 font-bold text-left opacity-0 group-hover:opacity-100 transition-all uppercase tracking-tighter mt-1"
                      >
                        Limpiar día
                      </button>
                    )}
                  </div>
                  
                  <div className="col-span-24 flex h-14 bg-white/5 rounded-2xl overflow-hidden border border-white/5 relative">
                    {HOURS.map(hour => {
                      const isSelected = data[dayIndex].active && hour >= data[dayIndex].start && hour < data[dayIndex].end
                      const isStart = data[dayIndex].active && hour === data[dayIndex].start
                      const isEnd = data[dayIndex].active && hour === data[dayIndex].end - 1
                      
                      return (
                        <div
                          key={hour}
                          onMouseDown={() => !outOfMonth && handleMouseDown(dayIndex, hour)}
                          onMouseEnter={() => !outOfMonth && handleMouseEnter(dayIndex, hour)}
                          onMouseUp={handleMouseUp}
                          className={`flex-1 border-r border-white/5 transition-all relative ${
                            outOfMonth ? 'cursor-not-allowed bg-black/20' : 'cursor-pointer hover:bg-white/10'
                          } ${
                            isSelected && !outOfMonth
                              ? 'bg-[#0072ff] shadow-[0_0_15px_rgba(0,114,255,0.4)] z-10' 
                              : ''
                          } ${isStart ? 'rounded-l-xl border-l-2 border-l-blue-400' : ''} ${isEnd ? 'rounded-r-xl border-r-2 border-r-blue-400' : ''}`}
                        >
                          {isStart && (
                            <div className="absolute -top-7 left-0 text-[9px] font-black text-[#0072ff] whitespace-nowrap bg-black/50 px-2 py-0.5 rounded-full border border-[#0072ff]/30">
                              INICIO: {hour}:00
                            </div>
                          )}
                          {isEnd && (
                            <div className="absolute -top-7 right-0 text-[9px] font-black text-[#0072ff] whitespace-nowrap text-right bg-black/50 px-2 py-0.5 rounded-full border border-[#0072ff]/30">
                              FIN: {hour + 1}:00
                            </div>
                          )}
                          {outOfMonth && (
                             <div className="absolute inset-0 flex items-center justify-center opacity-10">
                               <div className="w-[1px] h-full bg-white rotate-45"></div>
                             </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  )
}
