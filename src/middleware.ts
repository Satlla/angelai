import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

const protectedRoutes = ['/dashboard', '/onboarding', '/checkin']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get('angelai_session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/checkin/:path*'],
}
