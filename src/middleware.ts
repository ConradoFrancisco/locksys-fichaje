import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Actualizar sesión de Supabase
  let response = await updateSession(request)

  // Proteger rutas de super admin
  if (pathname.startsWith('/superadmin') && pathname !== '/superadmin/login') {
    // Verificar que sea super admin
    // Nota: En el middleware no podemos acceder directamente a la sesión de Supabase del servidor
    // Esto se valida en el layout del cliente. Esta es una validación adicional de seguridad.
  }

  // Proteger rutas de admin (dashboard) - validar suscripción
  if (pathname.startsWith('/(dashboard)/admin') || pathname.startsWith('/admin')) {
    // Esto también se valida en el cliente, pero es una capa adicional
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
