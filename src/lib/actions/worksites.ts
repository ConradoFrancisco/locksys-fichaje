'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorksite(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Obtener usuario y su tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!userData?.tenant_id) return { error: 'Usuario no vinculado a una empresa' }

  const name = formData.get('name') as string
  const lat = parseFloat(formData.get('lat') as string)
  const long = parseFloat(formData.get('long') as string)
  const radius = parseInt(formData.get('radius') as string) || 100
  const tolerance = parseInt(formData.get('tolerance_minutes') as string) || 10

  // 2. Insertar sede vinculada al tenant_id
  const { error } = await supabase
    .from('worksites')
    .insert({
      tenant_id: userData.tenant_id,
      name,
      lat,
      long,
      radius_meters: radius,
      tolerance_minutes: tolerance,
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/sedes')
  return { success: true }
}

export async function deleteWorksite(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('worksites')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/sedes')
}
