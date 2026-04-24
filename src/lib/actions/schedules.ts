'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSchedule(
  employeeId: string, 
  dayOfWeek: number, 
  startTime: string, 
  endTime: string,
  isActive: boolean
) {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'No vinculado a empresa' }

  if (!isActive) {
    // Si se desactiva el día, borramos el registro
    await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', employeeId)
      .eq('day_of_week', dayOfWeek)
  } else {
    // Si está activo, guardamos/actualizamos
    const { error } = await supabase
      .from('schedules')
      .upsert({
        tenant_id: userData.tenant_id,
        employee_id: employeeId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      }, {
        onConflict: 'employee_id,day_of_week'
      })

    if (error) return { error: error.message }
  }

  revalidatePath(`/admin/empleados/${employeeId}`)
  return { success: true }
}
