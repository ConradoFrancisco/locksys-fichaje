'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { ScheduleManager } from './ScheduleManager'

import { getEmployeeSchedules, saveSchedule, saveWeekSchedules } from '@/lib/actions/schedules'

interface Props {
  employeeId: string
}

interface WeekOption {
  weekNumber: number
  startDate: Date
  endDate: Date
  label: string
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

import { 
  startOfMonth, 
  endOfMonth, 
  eachWeekOfInterval, 
  endOfWeek, 
  format as formatDate,
  isWithinInterval
} from 'date-fns'
import { toast } from 'sonner'
import { es } from 'date-fns/locale'

function getWeeksOfMonth(year: number, month: number): WeekOption[] {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(start)
  
  // Obtenemos el inicio de cada semana (empezando en lunes = 1)
  const weeksInterval = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
  
  return weeksInterval.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    
    // El label debe mostrar los días reales
    return {
      weekNumber: index + 1,
      startDate: weekStart,
      endDate: weekEnd,
      label: `Semana ${index + 1} (${formatDate(weekStart, 'd/M')} - ${formatDate(weekEnd, 'd/M')})`
    }
  })
}

export function WeekSchedulePicker({ employeeId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [weeks, setWeeks] = useState<WeekOption[]>([])
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null)
  const [localSchedules, setLocalSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const newWeeks = getWeeksOfMonth(year, month)
    setWeeks(newWeeks)
    // Siempre seleccionar la primera semana del nuevo mes/año
    if (newWeeks.length > 0) {
      setSelectedWeek(newWeeks[0])
    }
  }, [year, month])

  useEffect(() => {
    async function loadSchedules() {
      if (!selectedWeek) return
      setIsLoading(true)
      const { schedules } = await getEmployeeSchedules(employeeId, year, month, selectedWeek.weekNumber)
      setLocalSchedules(schedules || [])
      setIsLoading(false)
    }
    loadSchedules()
  }, [selectedWeek, year, month, employeeId])

  const handleMonthChange = (offset: number) => {
    let newMonth = month + offset
    let newYear = year
    
    if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    } else if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    }
    
    setMonth(newMonth)
    setYear(newYear)
  }

  const handleCopyPrevious = async () => {
    if (!selectedWeek || selectedWeek.weekNumber <= 1) return
    setIsLoading(true)
    const { schedules } = await getEmployeeSchedules(employeeId, year, month, selectedWeek.weekNumber - 1)
    if (schedules && schedules.length > 0) {
      // Preparamos los datos para guardado masivo
      const weeksData = schedules.map(s => ({
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time,
        isActive: true
      }))

      await saveWeekSchedules(
        employeeId,
        weeksData,
        selectedWeek.weekNumber,
        month,
        year,
        selectedWeek.startDate.toISOString().split('T')[0],
        selectedWeek.endDate.toISOString().split('T')[0]
      )
      // Recargar
      const { schedules: newSchedules } = await getEmployeeSchedules(employeeId, year, month, selectedWeek.weekNumber)
      setLocalSchedules(newSchedules || [])
    }
    setIsLoading(false)
  }

  const handleSaveAsBase = async () => {
    if (!localSchedules.length) return
    setIsLoading(true)
    for (const s of localSchedules) {
      await saveSchedule(
        employeeId,
        s.day_of_week,
        s.start_time,
        s.end_time,
        true,
        undefined, // weekNumber null = Base
        undefined,
        year
      )
    }
    toast.success('¡Guardado como horario base!')
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Selector de Mes y Año */}
      <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-lg border border-white/5">
        <button
          onClick={() => handleMonthChange(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="text-center">
          <h3 className="text-2xl font-black text-white">
            {MONTHS[month - 1]} {year}
          </h3>
        </div>
        
        <button
          onClick={() => handleMonthChange(1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Selector de Semanas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => setSelectedWeek(week)}
            className={`p-4 rounded-lg border-2 transition-all text-sm font-bold ${
              selectedWeek?.weekNumber === week.weekNumber
                ? 'bg-[#0072ff] border-[#0072ff] text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-2 justify-center mb-2">
              <Calendar className="h-4 w-4" />
              <span>Sem {week.weekNumber}</span>
            </div>
            <div className="text-xs text-slate-400">
              {week.startDate.getDate()} - {week.endDate.getDate()}
            </div>
          </button>
        ))}
      </div>

      {/* Horarios de la Semana Seleccionada */}
      {selectedWeek && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">
                <span className="font-bold">Semana seleccionada:</span> {selectedWeek.label}
                <br />
                <span className="text-xs text-slate-400">
                  {selectedWeek.startDate.toLocaleDateString('es-AR')} al {selectedWeek.endDate.toLocaleDateString('es-AR')}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {selectedWeek.weekNumber > 1 && (
                <button 
                  onClick={handleCopyPrevious}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all"
                >
                  Copiar de semana anterior
                </button>
              )}
              <button 
                onClick={handleSaveAsBase}
                className="px-4 py-2 bg-[#6cc04a]/10 hover:bg-[#6cc04a]/20 border border-[#6cc04a]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#6cc04a] transition-all"
              >
                Guardar como Base
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="locksys-card p-20 flex flex-col items-center justify-center border-dashed border-white/10">
              <div className="h-12 w-12 border-4 border-[#0072ff] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold animate-pulse">Cargando horarios...</p>
            </div>
          ) : (
            <ScheduleManager 
              employeeId={employeeId}
              initialSchedules={localSchedules}
              weekNumber={selectedWeek.weekNumber}
              month={month}
              year={year}
              weekStartDate={selectedWeek.startDate.toISOString().split('T')[0]}
              weekEndDate={selectedWeek.endDate.toISOString().split('T')[0]}
            />
          )}
        </div>
      )}
    </div>
  )
}
