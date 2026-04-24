import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/admin'
  const origin = requestUrl.origin

  console.log('--- AUTH CALLBACK DEBUG ---')
  console.log('Full URL:', request.url)
  
  const supabase = await createClient()

  // 1. Verificamos si ya hay sesión (por si Supabase ya lo logueó)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    console.log('Session already exists! Redirecting to:', next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // 2. Si no hay sesión, intentamos el intercambio de código
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('Auth Success via Code! Redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error('Auth Error during exchange:', error.message)
    }
  }

  // Si llegamos acá sin sesión ni código, falló
  console.error('Auth Callback Failed: No session and no code')
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
