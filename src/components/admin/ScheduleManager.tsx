'use client'

import { useState, useEffect } from 'react'
import { saveSchedule } from '@/lib/actions/schedules'
import { Clock, MousePointer2, RefreshCw } from 'lucide-react'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface ScheduleManagerProps {
  employeeId: string
  initialSchedules: any[]
}

export function ScheduleManager({ employeeId, initialSchedules }: ScheduleManagerProps) {
  const [data, setData] = useState<{ [key: number]: { start: number, end: number, active: boolean } }>(() => {
    const initial: any = {}
    DAYS.forEach((_, i) => {
      const existing = initialSchedules.find(s => s.day_of_week === i)
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

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ day: number, hour: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleMouseDown = (day: number, hour: number) => {
    setIsDragging(true)
    setDragStart({ day, hour })
    setData(prev => ({
      ...prev,
      [day]: { ...prev[day], start: hour, end: hour + 1, active: true }
    }))
  }

  const handleMouseEnter = (day: number, hour: number) => {
    if (!isDragging || !dragStart || dragStart.day !== day) return

    const start = Math.min(dragStart.hour, hour)
    const end = Math.max(dragStart.hour, hour) + 1

    setData(prev => ({
      ...prev,
      [day]: { ...prev[day], start, end, active: true }
    }))
  }

  const handleMouseUp = async () => {
    if (!isDragging || !dragStart) return
    setIsDragging(false)
    
    const day = dragStart.day
    const config = data[day]
    
    setLoading(true)
    await saveSchedule(
      employeeId, 
      day, 
      `${config.start.toString().padStart(2, '0')}:00`, 
      `${config.end.toString().padStart(2, '0')}:00`, 
      true
    )
    setLoading(false)
    setDragStart(null)
  }

  const clearDay = async (day: number) => {
    setData(prev => ({ ...prev, [day]: { ...prev[day], active: false } }))
    await saveSchedule(employeeId, day, '00:00', '00:00', false)
  }

  return (
    <div className="locksys-card overflow-hidden select-none w-full border-white/5 shadow-2xl">
      <div className="bg-white/5 p-6 text-white flex items-center justify-between border-b border-white/5">
        <div>
          <h2 className="text-xl font-black flex items-center gap-3 text-[#0072ff]">
            <Clock className="h-6 w-6" />
            Línea de Tiempo Semanal
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Pintá horizontalmente para definir turnos.</p>
        </div>
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
            {DAYS.map((dayName, dayIndex) => (
              <div key={dayIndex} className="grid grid-cols-[150px_repeat(24,1fr)] items-center group">
                <div className="pr-4 flex flex-col justify-center">
                  <span className="text-sm font-black text-white">{dayName}</span>
                  <button 
                    onClick={() => clearDay(dayIndex)}
                    className="text-[10px] text-red-500/70 hover:text-red-400 font-bold text-left opacity-0 group-hover:opacity-100 transition-all uppercase tracking-tighter mt-1"
                  >
                    Limpiar día
                  </button>
                </div>
                
                <div className="col-span-24 flex h-14 bg-white/5 rounded-2xl overflow-hidden border border-white/5 relative">
                  {HOURS.map(hour => {
                    const isSelected = data[dayIndex].active && hour >= data[dayIndex].start && hour < data[dayIndex].end
                    const isStart = data[dayIndex].active && hour === data[dayIndex].start
                    const isEnd = data[dayIndex].active && hour === data[dayIndex].end - 1
                    
                    return (
                      <div
                        key={hour}
                        onMouseDown={() => handleMouseDown(dayIndex, hour)}
                        onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                        onMouseUp={handleMouseUp}
                        className={`flex-1 border-r border-white/5 cursor-pointer transition-all relative ${
                          isSelected 
                            ? 'bg-[#0072ff] shadow-[0_0_15px_rgba(0,114,255,0.4)] z-10' 
                            : 'hover:bg-white/10'
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
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
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
