'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDepartment(name: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user?.id || '')
    .single()

  if (!userData?.tenant_id) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('departments')
    .insert({
      tenant_id: userData.tenant_id,
      name: name
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/empleados')
  return { success: true }
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/empleados')
}
