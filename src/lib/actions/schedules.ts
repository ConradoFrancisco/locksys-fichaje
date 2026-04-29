'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveWeekSchedules(
  employeeId: string,
  weeksData: {
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
  }[],
  weekNumber: number,
  month: number,
  year: number,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'No vinculado a empresa' }

  // 1. Primero borramos los que ya no están activos
  const inactiveDays = weeksData.filter(d => !d.isActive).map(d => d.dayOfWeek)
  if (inactiveDays.length > 0) {
    await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('year', year)
      .eq('month', month)
      .eq('week_number', weekNumber)
      .in('day_of_week', inactiveDays)
  }

  // 2. Preparamos los datos para el upsert masivo
  const activeSchedules = weeksData
    .filter(d => d.isActive)
    .map(d => ({
      tenant_id: userData.tenant_id,
      employee_id: employeeId,
      day_of_week: d.dayOfWeek,
      start_time: d.startTime,
      end_time: d.endTime,
      week_number: weekNumber,
      month: month,
      year: year,
      start_date: startDate,
      end_date: endDate
    }))

  if (activeSchedules.length > 0) {
    const { error } = await supabase
      .from('schedules')
      .upsert(activeSchedules, {
        onConflict: 'employee_id,day_of_week,year,week_number,month'
      })

    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/empleados/${employeeId}`)
  return { success: true }
}

export async function saveSchedule(
  employeeId: string, 
  dayOfWeek: number, 
  startTime: string, 
  endTime: string,
  isActive: boolean,
  weekNumber?: number,
  month?: number,
  year?: number,
  startDate?: string,
  endDate?: string
) {
  // Mantengo esta función por compatibilidad con el botón de "Guardar como Base"
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'No vinculado a empresa' }

  const currentYear = year || new Date().getFullYear()
  const finalStartDate = startDate || new Date().toISOString().split('T')[0]

  if (!isActive) {
    await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
      .eq('year', currentYear)
      .eq('week_number', weekNumber)
      .eq('month', month)
  } else {
    const { error } = await supabase
      .from('schedules')
      .upsert({
        tenant_id: userData.tenant_id,
        employee_id: employeeId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        week_number: weekNumber || null,
        month: month || null,
        year: currentYear,
        start_date: finalStartDate,
        end_date: endDate || null,
      }, {
        onConflict: 'employee_id,day_of_week,year,week_number,month'
      })

    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/empleados/${employeeId}`)
  return { success: true }
}

export async function getEmployeeSchedules(
  employeeId: string, 
  year?: number, 
  month?: number,
  weekNumber?: number
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado', schedules: [] }

  const currentYear = year || new Date().getFullYear()

  let query = supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', currentYear)

  if (month) {
    query = query.eq('month', month)
  }

  if (weekNumber !== undefined) {
    query = query.eq('week_number', weekNumber)
  }

  const { data, error } = await query

  if (error) return { error: error.message, schedules: [] }
  return { schedules: data || [] }
}

export async function getBulkSchedules(
  tenantId: string,
  year: number,
  month: number,
  weekNumber: number,
  worksiteId?: string,
  departmentId?: string
) {
  const supabase = await createClient()

  // 1. Obtener empleados filtrados
  let employeesQuery = supabase
    .from('employees')
    .select('id, full_name, worksite_id, department_id')
    .eq('tenant_id', tenantId)

  if (worksiteId) employeesQuery = employeesQuery.eq('worksite_id', worksiteId)
  if (departmentId) employeesQuery = employeesQuery.eq('department_id', departmentId)

  const { data: employees, error: empError } = await employeesQuery
  if (empError) return { error: empError.message, data: [] }

  const employeeIds = employees.map(e => e.id)
  if (employeeIds.length === 0) return { data: [] }

  // 2. Obtener horarios para esos empleados
  const { data: schedules, error: schError } = await supabase
    .from('schedules')
    .select('*')
    .in('employee_id', employeeIds)
    .eq('year', year)
    .eq('month', month)
    .eq('week_number', weekNumber)

  if (schError) return { error: schError.message, data: [] }

  // 3. Unir datos
  const result = employees.map(emp => ({
    ...emp,
    schedules: schedules.filter(s => s.employee_id === emp.id)
  }))

  return { data: result }
}
