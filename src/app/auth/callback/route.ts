import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const origin = requestUrl.origin

  const supabase = await createClient()

  /**
   * Helper: resolve the redirect URL based on the user's role.
   * If `next` was explicitly provided in the query string, honour it.
   * Otherwise derive from role: employee → /fichar, everyone else → /admin.
   */
  async function getRedirectUrl() {
    if (next) return `${origin}${next}`

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return `${origin}/login`

    const { data: userData } = await supabase
      .from('users')
      .select('role, employees(needs_password_change)')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'employee') {
      const employeeData = Array.isArray(userData.employees)
        ? (userData.employees as any[])[0]
        : userData.employees as any
      const needsChange = employeeData?.needs_password_change ?? true
      return needsChange ? `${origin}/setup-password` : `${origin}/fichar`
    }

    return `${origin}/admin`
  }

  // Si viene un `code` en la URL, SIEMPRE procesarlo primero.
  // Esto cubre el link de invitación del empleado (tipo 'recovery').
  // Es importante hacerlo ANTES de chequear sesión existente,
  // para que la nueva sesión del empleado reemplace la del admin si corresponde.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[callback] Error exchanging code:', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    const url = await getRedirectUrl()
    console.log('[callback] Code exchanged OK → redirecting to:', url)

    // Forzar la copia de cookies al objeto de respuesta de redirección
    const response = NextResponse.redirect(url)
    const cookieStore = await cookies()
    cookieStore.getAll().forEach((cookie: any) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
      })
    })

    return response
  }

  // Sin code: verificar sesión existente y redirigir según rol
  const { data: { user: existingUser } } = await supabase.auth.getUser()
  if (existingUser) {
    const url = await getRedirectUrl()
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
