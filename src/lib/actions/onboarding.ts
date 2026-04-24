'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(prevState: any, formData: FormData) {
  // Usamos la Service Role Key para saltar problemas de RLS y FK en el onboarding
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Verificar sesión (con el cliente normal para seguridad)
  const { createClient: createNormalClient } = await import('@/lib/supabase/server')
  const normalSupabase = await createNormalClient()
  const { data: { session } } = await normalSupabase.auth.getSession()
  const user = session?.user

  if (!user) {
    return { error: 'Sesión no válida. Por favor, ingresá de nuevo.' }
  }

  console.log('Attempting onboarding for user ID:', user.id)

  const tenantName = formData.get('tenantName') as string
  const fullName = formData.get('fullName') as string || user.user_metadata.full_name || 'Admin'

  // 2. Crear el Tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: tenantName,
      plan_tier: 'free',
      status: 'active',
    })
    .select()
    .single()

  if (tenantError) {
    console.error('Tenant Creation Error:', tenantError)
    return { error: 'Error al crear la empresa: ' + tenantError.message }
  }

  console.log('Created Tenant ID:', tenantData.id)

  // 3. Crear o actualizar el perfil de usuario con el tenant_id
  const { error: userError } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      tenant_id: tenantData.id,
      full_name: fullName,
      role: 'admin',
    })

  if (userError) {
    console.error('User Link Error:', userError)
    return { error: 'Error al vincular tu cuenta: ' + userError.message }
  }

  // 4. Actualizar metadata de Auth para que el Middleware sepa que ya terminó (mejor performance)
  await supabase.auth.updateUser({
    data: { onboarded: true }
  })

  revalidatePath('/', 'layout')
  redirect('/admin')
}
