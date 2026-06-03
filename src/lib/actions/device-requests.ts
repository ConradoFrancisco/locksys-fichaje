'use server'

import { createClient } from '@/lib/supabase/server'
import { ActionState } from '@/types/actions'
import { revalidatePath } from 'next/cache'

export async function requestDeviceChange(newDeviceId: string): Promise<ActionState> {
  const supabase = await createClient()

  // 1. Obtener sesión del empleado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no válida o expirada' }

  // 2. Obtener perfil de empleado
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, tenant_id, device_id')
    .eq('id', user.id)
    .single()

  if (empError || !employee) {
    return { error: 'No se encontró tu perfil de empleado.' }
  }

  // 3. Verificar si ya existe una solicitud pendiente
  const { data: pendingRequest } = await supabase
    .from('device_change_requests')
    .select('id')
    .eq('employee_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pendingRequest) {
    return { error: 'Ya tenés una solicitud de cambio de dispositivo pendiente de aprobación.' }
  }

  // 4. Crear la solicitud de cambio de dispositivo
  const { error: insertError } = await supabase
    .from('device_change_requests')
    .insert({
      tenant_id: employee.tenant_id,
      employee_id: user.id,
      old_device_id: employee.device_id,
      new_device_id: newDeviceId,
      status: 'pending',
      created_at: new Date().toISOString()
    })

  if (insertError) {
    return { error: 'Error al registrar la solicitud: ' + insertError.message }
  }

  return { success: true }
}

export async function approveDeviceChange(requestId: string): Promise<ActionState> {
  const supabase = await createClient()

  // 1. Obtener la sesión del admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 2. Verificar rol de administrador o manager
  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin' && adminUser?.role !== 'super_admin' && adminUser?.role !== 'manager') {
    return { error: 'No tienes permisos para realizar esta acción.' }
  }

  // 3. Obtener la solicitud
  const { data: request, error: reqError } = await supabase
    .from('device_change_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (reqError || !request) {
    return { error: 'No se encontró la solicitud de cambio.' }
  }

  if (request.status !== 'pending') {
    return { error: 'Esta solicitud ya ha sido procesada.' }
  }

  // 4. Actualizar el dispositivo del empleado
  const { error: empUpdateError } = await supabase
    .from('employees')
    .update({ device_id: request.new_device_id })
    .eq('id', request.employee_id)

  if (empUpdateError) {
    return { error: 'Error al actualizar el dispositivo del empleado: ' + empUpdateError.message }
  }

  // 5. Marcar solicitud como aprobada
  const { error: reqUpdateError } = await supabase
    .from('device_change_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)

  if (reqUpdateError) {
    // Intentar rollback de ser necesario, pero al menos reportar
    return { error: 'El dispositivo se actualizó pero no se pudo actualizar el estado de la solicitud: ' + reqUpdateError.message }
  }

  revalidatePath('/admin/empleados')
  revalidatePath(`/admin/empleados/${request.employee_id}`)
  return { success: true }
}

export async function rejectDeviceChange(requestId: string): Promise<ActionState> {
  const supabase = await createClient()

  // 1. Obtener la sesión del admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 2. Verificar rol de administrador o manager
  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'admin' && adminUser?.role !== 'super_admin' && adminUser?.role !== 'manager') {
    return { error: 'No tienes permisos para realizar esta acción.' }
  }

  // 3. Marcar solicitud como rechazada
  const { data: request, error: reqError } = await supabase
    .from('device_change_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select('employee_id')
    .single()

  if (reqError) {
    return { error: 'Error al rechazar la solicitud: ' + reqError.message }
  }

  if (request) {
    revalidatePath('/admin/empleados')
    revalidatePath(`/admin/empleados/${request.employee_id}`)
  }

  return { success: true }
}
