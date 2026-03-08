import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
const COOKIE = 'angelai_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 días

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  return token
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, secret)
    const session = payload as { userId: string; email: string; iat?: number }

    // Renovar si queda menos de 7 días
    if (payload.exp) {
      const sevenDays = 7 * 24 * 60 * 60
      const remaining = payload.exp - Math.floor(Date.now() / 1000)
      if (remaining < sevenDays) {
        await createSession(session.userId, session.email)
      }
    }

    return session
  } catch {
    // Token inválido o expirado — limpiar cookie
    try {
      const cookieStore = await cookies()
      cookieStore.delete(COOKIE)
    } catch { /* ignorar */ }
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}
