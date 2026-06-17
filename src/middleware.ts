import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // PROYECTO PAUSADO: Redirigir todas las rutas a la página de pausa (excepto la home)
  if (pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Actualizar sesión de Supabase para la home
  let response = await updateSession(request)

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
