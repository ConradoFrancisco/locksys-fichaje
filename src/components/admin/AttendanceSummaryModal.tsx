'use client'

import { useState } from 'react'
import { getEmployeesAttendanceSummary } from '@/lib/actions/attendance'
import { 
  X, 
  ChevronDown, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  ChevronUp,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeAttendanceSummary {
  id: string
  name: string
  email: string
  onTime: number
  late: number
  early: number
  absent: number
  avgLateMinutes: number
  avgEarlyMinutes: number
  totalDays: number
  attendancePercentage: number
  records: Array<{
    date: string
    status: 'early' | 'ontime' | 'late' | 'absent'
    minutesDifference: number
  }>
}

interface AttendanceSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  tenantId: string
}

export function AttendanceSummaryModal({ isOpen, onClose, tenantId }: AttendanceSummaryModalProps) {
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmployeeAttendanceSummary[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const result = await getEmployeesAttendanceSummary(tenantId, month, year)
      if (result.success && result.data) {
        setData(result.data)
        setShowDetails(true)
        if (result.data.length === 0) {
          toast.info('Sin empleados con registros en este período')
        }
      } else {
        toast.error(result.error || 'Error cargando datos')
      }
    } catch (error) {
      toast.error('Error en la búsqueda')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (data.length === 0) return

    const csvContent = [
      ['Empleado', 'Email', 'A Tiempo', 'Tardes', 'Temprano', 'Ausentes', 'Puntualidad %', 'Prom. Minutos (Tarde)', 'Prom. Minutos (Temprano)'],
      ...data.map(emp => [
        emp.name,
        emp.email,
        emp.onTime,
        emp.late,
        emp.early,
        emp.absent,
        `${emp.attendancePercentage}%`,
        emp.avgLateMinutes,
        emp.avgEarlyMinutes
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asistencias_${month}_${year}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ontime':
        return 'bg-green-500/10 text-green-400'
      case 'late':
        return 'bg-red-500/10 text-red-400'
      case 'early':
        return 'bg-yellow-500/10 text-yellow-400'
      case 'absent':
        return 'bg-gray-500/10 text-gray-400'
      default:
        return ''
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ontime':
        return '✓ A Tiempo'
      case 'late':
        return '↓ Tarde'
      case 'early':
        return '⏃ Temprano'
      case 'absent':
        return '✗ Ausente'
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-slate-950 border border-white/10 rounded-3xl w-full h-screen sm:h-auto sm:max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="border-b border-white/5 p-6 sm:p-8 flex items-center justify-between sticky top-0 bg-slate-950">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Resumen de Asistencias</h2>
            <p className="text-slate-400 text-sm mt-1">Análisis mes a mes de puntualidad y asistencia</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
          
          {/* Filtros */}
          {!showDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Mes</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6cc04a]"
                  >
                    {monthNames.map((m, i) => (
                      <option key={i} value={i + 1} className="bg-slate-950">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Año</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6cc04a]"
                  >
                    {years.map((y) => (
                      <option key={y} value={y} className="bg-slate-950">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-300 mb-2">&nbsp;</label>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full bg-[#6cc04a] hover:bg-[#5ab03a] text-black font-black py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {loading ? 'Cargando...' : 'Generar Reporte'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Resultados */}
          {showDetails && data.length > 0 && (
            <>
              {/* Stats Generales */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-300">A Tiempo</div>
                  <div className="text-2xl font-black text-green-400">{data.reduce((sum, e) => sum + e.onTime, 0)}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-300">Tardes</div>
                  <div className="text-2xl font-black text-red-400">{data.reduce((sum, e) => sum + e.late, 0)}</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-300">Temprano</div>
                  <div className="text-2xl font-black text-yellow-400">{data.reduce((sum, e) => sum + e.early, 0)}</div>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-4 text-center">
                  <Clock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-300">Ausentes</div>
                  <div className="text-2xl font-black text-gray-400">{data.reduce((sum, e) => sum + e.absent, 0)}</div>
                </div>
              </div>

              {/* Tabla de Empleados */}
              <div className="space-y-2">
                {data.map((employee) => (
                  <div key={employee.id} className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/5 transition-all">
                    
                    {/* Resumen Empleado */}
                    <button
                      onClick={() => setExpandedId(expandedId === employee.id ? null : employee.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
                    >
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white">{employee.name}</div>
                        <div className="text-xs text-slate-500">{employee.email}</div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm">
                            <span className="text-green-400 font-bold">{employee.onTime}✓</span>
                            <span className="text-red-400 font-bold mx-2">{employee.late}↓</span>
                            <span className="text-yellow-400 font-bold">{employee.early}⏃</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">Puntualidad: {employee.attendancePercentage}%</div>
                        </div>
                        {expandedId === employee.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Detalles Expandidos */}
                    {expandedId === employee.id && (
                      <div className="border-t border-white/5 p-4 bg-black/20 space-y-4">
                        {/* Estadísticas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-slate-400 text-xs">A Tiempo</div>
                            <div className="text-green-400 font-bold text-lg">{employee.onTime}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-slate-400 text-xs">Tardanzas</div>
                            <div className="text-red-400 font-bold text-lg">{employee.late}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-slate-400 text-xs">Temprano</div>
                            <div className="text-yellow-400 font-bold text-lg">{employee.early}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-slate-400 text-xs">Ausente</div>
                            <div className="text-gray-400 font-bold text-lg">{employee.absent}</div>
                          </div>
                        </div>

                        {/* Promedios */}
                        {(employee.avgLateMinutes > 0 || employee.avgEarlyMinutes > 0) && (
                          <div className="grid grid-cols-2 gap-2 text-sm bg-white/5 rounded-lg p-3">
                            {employee.avgLateMinutes > 0 && (
                              <div>
                                <span className="text-slate-400">Prom. Tardanza: </span>
                                <span className="text-red-400 font-bold">{employee.avgLateMinutes} min</span>
                              </div>
                            )}
                            {employee.avgEarlyMinutes > 0 && (
                              <div>
                                <span className="text-slate-400">Prom. Temprano: </span>
                                <span className="text-yellow-400 font-bold">{employee.avgEarlyMinutes} min</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Histórico */}
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-400 mb-2">Histórico del mes:</div>
                          <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
                            {employee.records.map((record) => (
                              <div
                                key={record.date}
                                title={`${record.date}: ${getStatusLabel(record.status)} (${record.minutesDifference} min)`}
                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-help ${getStatusColor(record.status)} transition-all hover:scale-110`}
                              >
                                {new Date(record.date).getDate()}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                            <span className="text-green-400">● A Tiempo</span>
                            <span className="text-red-400">● Tarde</span>
                            <span className="text-yellow-400">● Temprano</span>
                            <span className="text-gray-400">● Ausente</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Botón Exportar */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 bg-[#0072ff] hover:bg-[#0062dd] text-white font-bold px-6 py-3 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>

              {/* Botón Volver */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setShowDetails(false)
                    setData([])
                  }}
                  className="text-slate-400 hover:text-slate-300 font-bold transition-all"
                >
                  ← Cambiar período
                </button>
              </div>
            </>
          )}

          {showDetails && data.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No hay empleados con registros en este período</p>
              <button
                onClick={() => {
                  setShowDetails(false)
                  setData([])
                }}
                className="text-[#6cc04a] hover:text-[#7ad456] font-bold mt-4 transition-all"
              >
                Intentar otro período
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
