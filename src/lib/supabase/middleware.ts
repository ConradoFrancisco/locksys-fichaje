import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Refrescar sesión y obtener usuario de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/empleado/login')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isOnboardingPage = pathname.startsWith('/onboarding')
  const isSetupPasswordPage = pathname.startsWith('/setup-password')
  const isDashboardPage = pathname.startsWith('/admin')
  const isAttendancePage = pathname.startsWith('/fichar')

  // IMPORTANTE: Dejar pasar el callback sin interferir
  if (isAuthCallback) {
    return supabaseResponse
  }

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const role = userData?.role

    // 3. LÓGICA PARA USUARIOS NUEVOS (Sin registro en public.users)
    if (!role) {
      // Si no tiene registro, es un alta nueva (probablemente Admin) -> Al onboarding
      if (!isOnboardingPage && !isAuthPage) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      return supabaseResponse
    }

    // 4. Si es empleado, verificar si necesita configurar clave/dispositivo
    let needsSetup = false
    if (role === 'employee') {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('needs_password_change')
        .eq('id', user.id)
        .single()
      
      needsSetup = employeeData?.needs_password_change ?? false
    }

    // --- LÓGICA DE REDIRECCIÓN ---

    // A. Si necesita configurar clave y no está en esa página -> Mandarlo a setup
    if (role === 'employee' && needsSetup && !isSetupPasswordPage) {
      return NextResponse.redirect(new URL('/setup-password', request.url))
    }

    // B. Si YA configuró y trata de entrar a setup -> Mandarlo a fichar
    if (role === 'employee' && !needsSetup && isSetupPasswordPage) {
      return NextResponse.redirect(new URL('/fichar', request.url))
    }

    // C. Protección de rutas por ROL
    const isAnyAdmin = role === 'admin' || role === 'manager'

    if (role === 'employee' && isDashboardPage) {
      return NextResponse.redirect(new URL('/fichar', request.url))
    }
    if (isAnyAdmin && isAttendancePage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // D. Si ya está logueado y va a login/register/empleado-login
    if (isAuthPage) {
      const dest = role === 'employee' ? '/fichar' : '/admin'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // E. Onboarding de empresa (solo para el admin principal/owner)
    const hasTenant = !!userData?.tenant_id
    const isOnboarded = user.user_metadata?.onboarded === true || hasTenant

    // E1. Si NO terminó onboarding y va al dashboard -> Al onboarding
    if (role === 'admin' && !isOnboarded && !isOnboardingPage && isDashboardPage) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // E2. Si YA terminó onboarding y trata de entrar a onboarding -> Al dashboard
    if (role === 'admin' && isOnboarded && isOnboardingPage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  } else {
    // Si NO está logueado y trata de entrar a zonas protegidas
    if (isAttendancePage || isSetupPasswordPage) {
      return NextResponse.redirect(new URL('/empleado/login', request.url))
    }
    if (isDashboardPage || isOnboardingPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}
