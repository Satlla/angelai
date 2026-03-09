import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const protectedRoutes = ['/dashboard', '/onboarding', '/checkin', '/settings', '/daily']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (!isProtected) return NextResponse.next()

  if (!process.env.JWT_SECRET) {
    // Misconfigured server — block access to protected routes
    return NextResponse.redirect(new URL('/?error=misconfigured', request.url))
  }

  const token = request.cookies.get('angelai_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/checkin/:path*', '/settings/:path*', '/daily/:path*'],
}
