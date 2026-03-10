import { type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for API routes as they don't need i18n or session updates in the same way
  if (pathname.startsWith('/api')) {
    return
  }

  // 1. Handle session updates (Supabase)
  // This will check auth and return either a redirect or the next response
  const response = await updateSession(request)

  // If Supabase returned a redirect, we should return it directly
  if (response.status !== 200 || response.headers.has('location')) {
    return response
  }

  // 2. Handle internationalization (next-intl)
  // We pass the response from Supabase to ensure cookies/session are preserved
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
