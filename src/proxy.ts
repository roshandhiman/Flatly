import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Protected routes that require auth
const PROTECTED = ['/live', '/profile'];
// Public routes that logged-in users should be redirected away from
const AUTH_ROUTES = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route needs protection
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Read Supabase session from cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a lightweight client just to read the session
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isLoggedIn = !!session;

  // Redirect unauthenticated users away from protected routes
  if (needsAuth && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect already-logged-in users away from /login
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
