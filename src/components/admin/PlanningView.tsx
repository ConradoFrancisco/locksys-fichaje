'use client'

import { useState, useEffect } from 'react'
import { getBulkSchedules } from '@/lib/actions/schedules'
import { Calendar, MapPin, LayoutGrid, Share2, Printer, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, endOfWeek, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface Props {
  worksites: any[]
  departments: any[]
  tenantId: string
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function PlanningView({ worksites, departments, tenantId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedWorksite, setSelectedWorksite] = useState<string>('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  
  const [weeks, setWeeks] = useState<any[]>([])
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Calcular semanas del mes
  useEffect(() => {
    const start = startOfMonth(new Date(year, month - 1))
    const end = endOfMonth(start)
    const weeksInterval = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 })
    
    const weekOptions = weeksInterval.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      return {
        number: index + 1,
        start: weekStart,
        end: weekEnd,
        label: `Semana ${index + 1} (${format(weekStart, 'd/M')} - ${format(weekEnd, 'd/M')})`
      }
    })
    setWeeks(weekOptions)
    if (selectedWeek > weekOptions.length) setSelectedWeek(1)
  }, [year, month])

  const fetchData = async () => {
    setLoading(true)
    const result = await getBulkSchedules(
      tenantId,
      year,
      month,
      selectedWeek,
      selectedWorksite || undefined,
      selectedDepartment || undefined
    )
    if (result.error) {
      toast.error(result.error)
    } else {
      setData(result.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [selectedWeek, selectedWorksite, selectedDepartment, year, month])

  const copyForWhatsApp = () => {
    if (data.length === 0) return
    
    const week = weeks.find(w => w.number === selectedWeek)
    let text = `📅 *PLANIFICACIÓN SEMANAL*\n`
    text += `🗓️ ${week?.label}\n`
    if (selectedWorksite) {
      const ws = worksites.find(w => w.id === selectedWorksite)
      text += `📍 Sede: *${ws?.name}*\n`
    }
    text += `----------------------------\n\n`

    data.forEach(emp => {
      text += `👤 *${emp.full_name}*\n`
      DAYS.forEach((day, i) => {
        const dbDay = (i + 1) % 7
        const sch = emp.schedules.find((s: any) => s.day_of_week === dbDay)
        if (sch) {
          text += `  • ${day}: ${sch.start_time.slice(0, 5)} - ${sch.end_time.slice(0, 5)}\n`
        }
      })
      text += `\n`
    })

    navigator.clipboard.writeText(text)
    toast.success('¡Copiado para WhatsApp!')
  }

  const handlePrint = () => {
     window.print()
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="locksys-card p-4 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Mes y Año
          </label>
          <div className="flex items-center justify-between">
             <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} className="p-1 hover:text-[#0072ff]"><ChevronLeft className="h-4 w-4"/></button>
             <span className="text-sm font-black text-white capitalize">{format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}</span>
             <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} className="p-1 hover:text-[#0072ff]"><ChevronRight className="h-4 w-4"/></button>
          </div>
        </div>

        <div className="locksys-card p-4 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Semana
          </label>
          <select 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="w-full bg-transparent text-sm font-black text-white outline-none cursor-pointer"
          >
            {weeks.map(w => (
              <option key={w.number} value={w.number} className="bg-slate-900">{w.label}</option>
            ))}
          </select>
        </div>

        <div className="locksys-card p-4 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <MapPin className="h-3 w-3" /> Sede
          </label>
          <select 
            value={selectedWorksite}
            onChange={(e) => setSelectedWorksite(e.target.value)}
            className="w-full bg-transparent text-sm font-black text-white outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">Todas las sedes</option>
            {worksites.map(w => (
              <option key={w.id} value={w.id} className="bg-slate-900">{w.name}</option>
            ))}
          </select>
        </div>

        <div className="locksys-card p-4 space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <LayoutGrid className="h-3 w-3" /> Sector
          </label>
          <select 
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full bg-transparent text-sm font-black text-white outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">Todos los sectores</option>
            {departments.map(d => (
              <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 no-print">
        <button 
          onClick={handlePrint}
          className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <Printer className="h-4 w-4" /> Imprimir
        </button>
        <button 
          onClick={copyForWhatsApp}
          className="bg-[#25D366] text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
        >
          <Share2 className="h-4 w-4" /> Compartir WhatsApp
        </button>
      </div>

      {/* Grilla de Planificación */}
      <div className="locksys-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest border-r border-white/5">Empleado</th>
                {DAYS.map(day => (
                  <th key={day} className="p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0072ff] mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando planificación...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                    No se encontraron horarios para los filtros seleccionados
                  </td>
                </tr>
              ) : data.map(emp => (
                <tr key={emp.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 border-r border-white/5">
                    <p className="font-black text-white">{emp.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{departments.find(d => d.id === emp.department_id)?.name || 'Sin Área'}</p>
                  </td>
                  {DAYS.map((_, i) => {
                    const dbDay = (i + 1) % 7
                    const sch = emp.schedules.find((s: any) => s.day_of_week === dbDay)
                    return (
                      <td key={i} className="p-4">
                        {sch ? (
                          <div className="bg-[#0072ff]/10 border border-[#0072ff]/20 rounded-xl p-3 text-center">
                            <p className="text-xs font-black text-[#0072ff]">
                              {sch.start_time.slice(0, 5)} - {sch.end_time.slice(0, 5)}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-slate-700 font-bold uppercase">Franco</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .locksys-card { border: 1px solid #eee !important; box-shadow: none !important; background: white !important; }
          th, td { border: 1px solid #eee !important; color: black !important; }
          .text-[#0072ff] { color: black !important; }
          .bg-[#0072ff]\/10 { background: #f0f0f0 !important; }
          .text-white { color: black !important; }
        }
      `}</style>
    </div>
  )
}
