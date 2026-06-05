'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, getHours, getMinutes, getDay, parse } from 'date-fns'

interface AttendanceStats {
  employeeId: string
  employeeName: string
  employeeDni: string | null
  late: number
  onTime: number
  early: number
  total: number
}

export async function getAttendanceAnalysisByMonth(month: number, year: number) {
  const supabase = await createClient()

  // Obtener usuario y tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) throw new Error('Tenant no encontrado')

  // Construir rango de fechas
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  // Obtener asistencias del mes
  let query = supabase
    .from('attendance')
    .select(`
      id,
      check_in,
      employee_id,
      worksite_id,
      employees!inner(full_name, dni),
      worksites!inner(tolerance_minutes)
    `)
    .eq('tenant_id', userData.tenant_id)
    .gte('check_in', startDate.toISOString())
    .lte('check_in', endDate.toISOString())

  // Si el usuario es manager, filtrar por sus sedes
  if (userData.role === 'manager') {
    const { data: assignments } = await supabase
      .from('admin_worksites')
      .select('worksite_id')
      .eq('user_id', user.id)

    const worksiteIds = assignments?.map(a => a.worksite_id) || []
    query = query.in('worksite_id', worksiteIds)
  }

  const { data: attendance, error } = await query

  if (error) {
    console.error('Error en query:', error)
    throw new Error(error.message)
  }

  // Obtener todos los schedules para los empleados en este mes
  const employeeIds = [...new Set(attendance?.map(a => a.employee_id) || [])]
  
  let schedulesQuery = supabase
    .from('schedules')
    .select('employee_id, day_of_week, start_time')
    .in('employee_id', employeeIds)

  const { data: schedules, error: schedError } = await schedulesQuery

  if (schedError) {
    console.error('Error en schedules:', schedError)
  }

  // Crear mapa de schedules para búsqueda rápida
  const scheduleMap = new Map<string, any>()
  schedules?.forEach(schedule => {
    const key = `${schedule.employee_id}-${schedule.day_of_week}`
    scheduleMap.set(key, schedule)
  })

  // Procesar datos para calcular si fue tarde, a tiempo, o temprano
  const statsMap = new Map<string, AttendanceStats>()

  attendance?.forEach((record: any) => {
    const employeeId = record.employee_id
    const employeeName = record.employees?.full_name || 'Desconocido'
    const employeeDni = record.employees?.dni || null

    if (!statsMap.has(employeeId)) {
      statsMap.set(employeeId, {
        employeeId,
        employeeName,
        employeeDni,
        late: 0,
        onTime: 0,
        early: 0,
        total: 0,
      })
    }

    const stats = statsMap.get(employeeId)!
    stats.total += 1

    // Obtener hora de llegada
    const checkInDate = new Date(record.check_in)
    const checkInHour = getHours(checkInDate)
    const checkInMin = getMinutes(checkInDate)
    const checkInTotalMins = checkInHour * 60 + checkInMin

    // Obtener día de la semana (0 = Sunday, 1 = Monday, etc)
    const dayOfWeek = getDay(checkInDate)

    // Buscar horario para ese día
    const scheduleKey = `${employeeId}-${dayOfWeek}`
    const schedule = scheduleMap.get(scheduleKey)
    const tolerance = record.worksites?.tolerance_minutes || 0

    if (schedule && schedule.start_time) {
      const [schedHour, schedMin] = schedule.start_time.split(':').map(Number)
      const scheduledTotalMins = schedHour * 60 + schedMin

      const diffMins = checkInTotalMins - scheduledTotalMins

      if (diffMins > tolerance) {
        // Llegada tarde
        stats.late += 1
      } else if (diffMins < -5) {
        // Llegada temprano (más de 5 mins antes)
        stats.early += 1
      } else {
        // Llegada puntual
        stats.onTime += 1
      }
    } else {
      // Sin horario definido, contar como puntual (siendo flexible)
      stats.onTime += 1
    }
  })

  return Array.from(statsMap.values()).sort((a, b) => 
    a.employeeName.localeCompare(b.employeeName)
  )
}

export async function getMonthYearOptions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  // Obtener tenant del usuario
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) throw new Error('Tenant no encontrado')

  // Obtener rango de años con registros
  let query = supabase
    .from('attendance')
    .select('check_in')
    .eq('tenant_id', userData.tenant_id)
    .order('check_in', { ascending: false })

  const { data: attendance, error } = await query

  if (error) throw new Error(error.message)

  const months = new Set<string>()
  attendance?.forEach((record: any) => {
    const date = new Date(record.check_in)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.add(key)
  })

  return Array.from(months).sort().reverse()
}

