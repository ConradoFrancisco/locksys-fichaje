'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(prevState: any, formData: FormData) {
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

export async function signIn(prevState: any, formData: FormData) {
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

  // 2. Lógica de Redirección Inteligente
  if (userData?.role === 'employee') {
    // @ts-ignore
    const needsChange = userData.employees?.needs_password_change
    if (needsChange) {
      redirect('/setup-password')
    }
    redirect('/fichar')
  }

  redirect('/admin')
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

export async function setupPasswordAndDevice(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const deviceId = formData.get('deviceId') as string

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no válida' }

  // 2. Actualizar contraseña en Auth
  const { error: authError } = await supabase.auth.updateUser({
    password: password
  })

  if (authError) return { error: `Error al actualizar clave: ${authError.message}` }

  // 3. Vincular dispositivo y marcar como configurado
  const { error: dbError } = await supabase
    .from('employees')
    .update({
      device_id: deviceId,
      needs_password_change: false
    })
    .eq('id', user.id)

  if (dbError) return { error: `Error al vincular dispositivo: ${dbError.message}` }

  revalidatePath('/', 'layout')
  redirect('/fichar')
}
