'use client'

import { useState, useEffect } from 'react'
import { getAttendanceAnalysisByMonth, getMonthYearOptions } from '@/lib/actions/attendance-analysis'
import { X, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface AttendanceStats {
  employeeId: string
  employeeName: string
  employeeDni: string | null
  late: number
  onTime: number
  early: number
  total: number
}

interface AttendanceAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
}

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function AttendanceAnalysisModal({ isOpen, onClose }: AttendanceAnalysisModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [stats, setStats] = useState<AttendanceStats[]>([])
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Cargar opciones de meses disponibles
  useEffect(() => {
    const loadMonthOptions = async () => {
      try {
        const options = await getMonthYearOptions()
        setMonthOptions(options)
        if (options.length > 0 && !selectedMonth) {
          setSelectedMonth(options[0])
        }
      } catch (error) {
        console.error('Error cargando meses:', error)
      }
    }
    loadMonthOptions()
  }, [])

  // Cargar análisis cuando cambia el mes
  useEffect(() => {
    if (!selectedMonth) return

    const loadStats = async () => {
      setLoading(true)
      try {
        const [year, month] = selectedMonth.split('-').map(Number)
        const data = await getAttendanceAnalysisByMonth(month, year)
        setStats(data)
      } catch (error) {
        console.error('Error cargando análisis:', error)
        setStats([])
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [selectedMonth])

  if (!isOpen) return null

  const getMonthLabel = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number)
    return `${monthNames[month - 1]} ${year}`
  }

  const totalLate = stats.reduce((sum, s) => sum + s.late, 0)
  const totalOnTime = stats.reduce((sum, s) => sum + s.onTime, 0)
  const totalEarly = stats.reduce((sum, s) => sum + s.early, 0)
  const totalRecords = stats.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in scale-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-6 bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-white">Análisis de Asistencias</h2>
            <p className="text-sm text-slate-400 mt-1">Revisá puntualidad, llegadas temprano y tarde</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Selector de Mes */}
        <div className="p-6 border-b border-white/5 bg-slate-800/30">
          <label className="block text-sm font-bold text-slate-300 mb-3">Seleccioná el mes:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-white/10 text-white font-bold focus:border-[#0072ff] focus:outline-none transition-colors"
          >
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {getMonthLabel(option)}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen General */}
        {totalRecords > 0 && (
          <div className="p-6 border-b border-white/5 bg-slate-800/30">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900/80 rounded-xl p-4 border border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Total</p>
                <p className="text-3xl font-black text-white">{totalRecords}</p>
              </div>
              <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30">
                <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Puntual</p>
                <p className="text-3xl font-black text-emerald-400">{totalOnTime}</p>
              </div>
              <div className="bg-orange-900/20 rounded-xl p-4 border border-orange-500/30">
                <p className="text-xs font-bold text-orange-400 uppercase mb-2">Tarde</p>
                <p className="text-3xl font-black text-orange-400">{totalLate}</p>
              </div>
              <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                <p className="text-xs font-bold text-blue-400 uppercase mb-2">Temprano</p>
                <p className="text-3xl font-black text-blue-400">{totalEarly}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0072ff]"></div>
              </div>
              <p className="text-slate-400 mt-4 font-medium">Cargando análisis...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No hay registros para este mes</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.map((stat) => {
                const latePercent = stat.total > 0 ? Math.round((stat.late / stat.total) * 100) : 0
                const onTimePercent = stat.total > 0 ? Math.round((stat.onTime / stat.total) * 100) : 0
                const earlyPercent = stat.total > 0 ? Math.round((stat.early / stat.total) * 100) : 0

                return (
                  <div key={stat.employeeId} className="p-6 hover:bg-white/5 transition-all">
                  <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black text-white">{stat.employeeName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-slate-400">
                            {stat.employeeDni ? `DNI: ${stat.employeeDni}` : 'Sin DNI'}
                          </span>
                          <span className="text-xs font-bold text-slate-500">•</span>
                          <span className="text-xs font-bold text-slate-400">{stat.total} registros</span>
                        </div>
                      </div>
                    </div>

                    {/* Barras de progreso */}
                    <div className="space-y-3">
                      {/* Llegadas Puntuales */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-400 uppercase">
                            ✓ Puntual
                          </span>
                          <span className="text-sm font-bold text-emerald-400">
                            {stat.onTime} ({onTimePercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-500"
                            style={{ width: `${onTimePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Llegadas Tarde */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-orange-400 uppercase">
                            ⚠ Tarde
                          </span>
                          <span className="text-sm font-bold text-orange-400">
                            {stat.late} ({latePercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full transition-all duration-500"
                            style={{ width: `${latePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Llegadas Temprano */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-blue-400 uppercase">
                            ⏱ Temprano
                          </span>
                          <span className="text-sm font-bold text-blue-400">
                            {stat.early} ({earlyPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full transition-all duration-500"
                            style={{ width: `${earlyPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
