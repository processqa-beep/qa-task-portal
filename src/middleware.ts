import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple check: the auth is handled client-side via localStorage.
  // For a production app, you'd use Supabase server-side session.
  // This middleware just handles redirects for the login flow.
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = ['/', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith('/api/'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
