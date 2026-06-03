'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/actions'
import { sendInvitationEmail } from '@/lib/email/send'

export async function createEmployee(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Obtener usuario y su tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'Usuario no vinculado a una empresa' }

  // 1.5 Obtener nombre de la empresa (Tenant)
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', userData.tenant_id)
    .single()

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const dni = formData.get('internalId') as string || null 
  const departmentId = formData.get('department_id') as string || null
  const worksiteId = formData.get('worksite_id') as string || null
  const companyName = tenantData?.name || 'nuestra plataforma'

  // Generar contraseña temporal (mínimo 6 caracteres para cumplir políticas de Supabase)
  const tempPassword = dni && dni.trim().length >= 6 ? dni.trim() : Math.random().toString(36).substring(2, 10)

  // 2. Crear el usuario en Auth (Confirmado inmediatamente para que no envíe el correo por defecto de Supabase)
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      company_name: companyName
    }
  })

  if (authError) return { error: `Error al crear usuario de autenticación: ${authError.message}` }

  const userId = authUser.user.id

  // 3. Registrar en public.users (para el rol)
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      tenant_id: userData.tenant_id,
      full_name: fullName,
      role: 'employee'
    })

  if (userError) {
    await adminClient.auth.admin.deleteUser(userId)
    return { error: `Error creando perfil: ${userError.message}` }
  }

  // 4. Registrar en public.employees (datos específicos)
  const { error: empError } = await supabase
    .from('employees')
    .insert({
      id: userId,
      tenant_id: userData.tenant_id,
      full_name: fullName,
      email: email,
      dni: dni,
      department_id: departmentId,
      worksite_id: worksiteId,
      is_active: true,
      needs_password_change: true
    })

  if (empError) {
    await adminClient.auth.admin.deleteUser(userId)
    await supabase.from('users').delete().eq('id', userId)
    return { error: `Error creando empleado: ${empError.message}` }
  }

  // 5. Generar link de recuperación/setup de contraseña
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/setup-password`
    }
  })

  if (linkError) {
    // Rollback completo
    await adminClient.auth.admin.deleteUser(userId)
    await supabase.from('employees').delete().eq('id', userId)
    await supabase.from('users').delete().eq('id', userId)
    return { error: `Error al generar link de acceso: ${linkError.message}` }
  }

  // 6. Enviar invitación por email a través de Resend
  const emailRes = await sendInvitationEmail(
    email,
    fullName,
    companyName,
    linkData.properties.action_link,
    tempPassword
  )

  if (!emailRes.success) {
    // Rollback completo
    await adminClient.auth.admin.deleteUser(userId)
    await supabase.from('employees').delete().eq('id', userId)
    await supabase.from('users').delete().eq('id', userId)
    return { error: `Error al enviar email de invitación: ${emailRes.error}` }
  }

  revalidatePath('/admin/empleados')
  return { success: true }
}

export async function updateEmployee(id: string, data: { fullName?: string, dni?: string | null, departmentId?: string | null, worksiteId?: string | null, isActive?: boolean }) {
  const supabase = await createClient()
  
  const updateData: any = {}
  if (data.fullName !== undefined) updateData.full_name = data.fullName
  if (data.dni !== undefined) updateData.dni = data.dni
  if (data.departmentId !== undefined) updateData.department_id = data.departmentId
  if (data.worksiteId !== undefined) updateData.worksite_id = data.worksiteId
  if (data.isActive !== undefined) updateData.is_active = data.isActive

  const { error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }
  
  // Si cambió el nombre, actualizar también en la tabla users
  if (data.fullName) {
    await supabase.from('users').update({ full_name: data.fullName }).eq('id', id)
  }

  revalidatePath('/admin/empleados')
  revalidatePath(`/admin/empleados/${id}`)
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Borrar de la tabla y de Auth
  await adminClient.auth.admin.deleteUser(id)
  const { error } = await supabase.from('employees').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/empleados')
}

export async function resetDevice(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('employees').update({ device_id: null }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/empleados/${id}`)
}
