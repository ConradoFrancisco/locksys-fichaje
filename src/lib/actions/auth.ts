'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ActionState } from '@/types/actions'

export async function signUp(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const tenantName = formData.get('tenantName') as string

  // 1. Crear el Tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: tenantName,
      plan_tier: 'free',
      status: 'active',
    })
    .select()
    .single()

  if (tenantError) return { error: 'Error al crear empresa: ' + tenantError.message }

  // 2. Registro en Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError || !authData.user) {
    return { error: 'Error en Auth: ' + authError?.message }
  }

  const userId = authData.user.id

  // 3. Crear el perfil en public.users MANUALLY
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      tenant_id: tenantData.id,
      full_name: fullName,
      role: 'admin',
    })

  if (userError) {
    console.error('Error manual insert users:', userError)
    return { error: 'Error al vincular usuario: ' + userError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function signIn(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Error al recuperar usuario' }

  // 1. Obtener el perfil y rol
  const { data: userData } = await supabase
    .from('users')
    .select('*, employees(needs_password_change)')
    .eq('id', user.id)
    .single()


  revalidatePath('/', 'layout')

  // Si no se encuentra perfil (posible RLS o usuario nuevo via OAuth)
  if (!userData) {
    redirect('/onboarding')
  }

  // 2. Lógica de Redirección Inteligente
  if (userData.role === 'employee') {
    // PostgREST devuelve joins como array, tomar el primer elemento
    const employeeData = Array.isArray(userData.employees)
      ? userData.employees[0]
      : userData.employees
    const needsChange = employeeData?.needs_password_change ?? true

    if (needsChange) {
      redirect('/setup-password')
    }
    redirect('/fichar')
  }

  redirect('/admin')
}

/**
 * Server Action exclusiva para el portal de empleados.
 * Valida que el usuario tenga rol 'employee' antes de permitir el acceso.
 */
export async function signInEmployee(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[signInEmployee] Intentando iniciar sesión para:', email)
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[signInEmployee] Error en Supabase signInWithPassword:', error.message, error.status)
    return { error: 'Email o contraseña incorrectos.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[signInEmployee] Error: No se pudo recuperar el usuario después del login exitoso.')
    return { error: 'Error al recuperar sesión.' }
  }

  console.log('[signInEmployee] Sesión recuperada para:', user.email, 'ID:', user.id)

  // Verificar que sea empleado
  const { data: userData } = await supabase
    .from('users')
    .select('role, employees(needs_password_change)')
    .eq('id', user.id)
    .single()

  console.log('[signInEmployee] Datos de usuario en DB:', userData)

  if (!userData || userData.role !== 'employee') {
    // No es un empleado: cerrar sesión y rechazar
    console.warn('[signInEmployee] Rechazado: El usuario no es empleado. Rol actual:', userData?.role)
    await supabase.auth.signOut()
    return { error: 'Esta cuenta no es de empleado. Accedé desde el portal de empresa.' }
  }

  // Determinar si necesita configurar contraseña/dispositivo
  const employeeData = Array.isArray(userData.employees)
    ? userData.employees[0]
    : userData.employees
  const needsSetup = employeeData?.needs_password_change ?? true

  console.log('[signInEmployee] Redirigiendo. Necesita setup:', needsSetup)

  revalidatePath('/', 'layout')

  if (needsSetup) {
    redirect('/setup-password')
  }
  redirect('/fichar')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function createTenantBySuperAdmin(formData: FormData) {
  const supabase = await createClient()

  // Verificar que el usuario actual sea super_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: adminUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'super_admin') {
    return { error: 'No tenés permisos para crear empresas' }
  }

  const tenantName = formData.get('tenantName') as string
  const planTier = formData.get('planTier') as string || 'free'

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: tenantName,
      plan_tier: planTier,
      status: 'active',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/backoffice')
  return { success: true, tenant: data }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = (await import('next/headers')).headers().then(h => h.get('origin'))

  // Nota: Next.js 15+ requiere await en headers()
  const resolvedOrigin = await origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${resolvedOrigin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Error Google Auth:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function setupPasswordAndDevice(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const deviceId = formData.get('deviceId') as string
  const phone = formData.get('phone') as string || null

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[setupPasswordAndDevice] Error: No hay sesión válida para actualizar contraseña.')
    return { error: 'Sesión no válida' }
  }

  console.log('[setupPasswordAndDevice] Iniciando actualización de clave para:', user.email, 'ID:', user.id)

  // 2. Actualizar contraseña en Auth
  const { error: authError } = await supabase.auth.updateUser({
    password: password
  })

  if (authError) {
    console.error('[setupPasswordAndDevice] Error al actualizar clave en Supabase Auth:', authError.message)
    return { error: `Error al actualizar clave: ${authError.message}` }
  }

  console.log('[setupPasswordAndDevice] Clave actualizada con éxito en Supabase Auth.')

  // 3. Vincular dispositivo, guardar teléfono y marcar como configurado
  const updateData: any = {
    device_id: deviceId,
    needs_password_change: false
  }
  if (phone) updateData.phone = phone

  console.log('[setupPasswordAndDevice] Actualizando datos de empleado en DB. Datos:', updateData)

  const { error: dbError } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', user.id)

  if (dbError) {
    console.error('[setupPasswordAndDevice] Error al actualizar la tabla employees:', dbError.message)
    return { error: `Error al vincular dispositivo: ${dbError.message}` }
  }

  console.log('[setupPasswordAndDevice] Registro en public.employees actualizado con éxito.')

  revalidatePath('/', 'layout')
  redirect('/fichar')
}
