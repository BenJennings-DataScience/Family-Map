import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login page and auth API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('family-map-auth')?.value

  if (token !== process.env.AUTH_TOKEN) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
