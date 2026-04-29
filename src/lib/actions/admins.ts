'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSubAdmin(prevState: any, formData: FormData) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Obtener usuario actual y su tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return { error: 'Solo el administrador general puede agregar otros administradores' }
  }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string

  // 2. Invitar usuario
  const { data: authUser, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { 
      full_name: fullName,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/setup-password`
  })

  if (authError) return { error: `Error enviando invitación: ${authError.message}` }

  const userId = authUser.user.id

  // 3. Registrar en public.users con el rol 'manager' (Usamos adminClient para saltar RLS)
  const { error: userError } = await adminClient
    .from('users')
    .insert({
      id: userId,
      tenant_id: userData.tenant_id,
      full_name: fullName,
      role: 'manager' // Rol restringido
    })

  if (userError) {
    await adminClient.auth.admin.deleteUser(userId)
    return { error: `Error creando perfil: ${userError.message}` }
  }

  revalidatePath('/admin/administradores')
  return { success: true }
}

export async function toggleWorksiteAssignment(userId: string, worksiteId: string, isAssigned: boolean) {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') {
    return { error: 'No autorizado' }
  }

  if (isAssigned) {
    // Quitar asignación
    const { error } = await adminClient
      .from('admin_worksites')
      .delete()
      .eq('user_id', userId)
      .eq('worksite_id', worksiteId)
    
    if (error) return { error: error.message }
  } else {
    // Agregar asignación
    const { error } = await adminClient
      .from('admin_worksites')
      .insert({
        user_id: userId,
        worksite_id: worksiteId,
        tenant_id: userData.tenant_id
      })
    
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/administradores')
  return { success: true }
}

export async function deleteSubAdmin(id: string) {
  const adminClient = createAdminClient()
  
  // Borrar de Auth y de public.users
  await adminClient.auth.admin.deleteUser(id)
  const { error } = await adminClient.from('users').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/administradores')
}
