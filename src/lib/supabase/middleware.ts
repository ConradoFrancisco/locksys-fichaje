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

  // 1. Refrescar sesión y obtener usuario
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAuthCallback = pathname.startsWith('/auth/callback')
  const isOnboardingPage = pathname.startsWith('/onboarding')
  const isSetupPasswordPage = pathname.startsWith('/setup-password')
  const isDashboardPage = pathname.startsWith('/admin')
  const isAttendancePage = pathname.startsWith('/fichar')

  // LOG PARA DEBUG EXTREMO
  if (user) {
    console.log(`[Middleware DEBUG] User: ${user.email} | Path: ${pathname}`)
  } else {
    console.log(`[Middleware DEBUG] No User Session | Path: ${pathname}`)
  }

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
    const tenantId = userData?.tenant_id

    console.log(`[Middleware DEBUG] Role: ${role} | Tenant: ${tenantId}`)

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
        .eq('user_id', user.id)
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
    if (role === 'employee' && isDashboardPage) {
      return NextResponse.redirect(new URL('/fichar', request.url))
    }
    if (role === 'admin' && isAttendancePage) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // D. Si ya está logueado y va a login/register
    if (isAuthPage) {
      const dest = role === 'admin' ? '/admin' : '/fichar'
      return NextResponse.redirect(new URL(dest, request.url))
    }

    // E. Onboarding de empresa (solo para admins)
    // Verificamos tanto la metadata como si ya tiene un tenant_id asignado en la DB
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
    if (isDashboardPage || isAttendancePage || isOnboardingPage || isSetupPasswordPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}
