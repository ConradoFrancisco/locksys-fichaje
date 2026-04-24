import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()

  // 1. Cerrar sesión en Supabase (limpia las cookies)
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error cerrando sesión:', error)
  }

  // 2. Limpiar cache y redirigir
  revalidatePath('/', 'layout')
  redirect('/login')
}
