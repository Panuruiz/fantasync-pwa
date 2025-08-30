import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected route patterns
const protectedRoutes = [
  '/dashboard',
  '/game',
  '/profile',
  '/settings',
]

// Define auth routes that should redirect to dashboard if already logged in
const authRoutes = [
  '/login',
  '/register',
  '/reset-password',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user || error) {
      // User not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Handle auth routes
  if (isAuthRoute) {
    if (user && !error) {
      // User is already authenticated, redirect to dashboard
      const redirectTo = request.nextUrl.searchParams.get('redirectTo')
      const redirectUrl = redirectTo && redirectTo.startsWith('/') 
        ? new URL(redirectTo, request.url)
        : new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
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
     * - Files with extensions (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}