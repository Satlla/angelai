import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE = 'angelai_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 días

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function createSession(userId: string, email: string) {
  const secret = getSecret()
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

    const { payload } = await jwtVerify(token, getSecret())
    const session = payload as { userId: string; email: string; iat?: number }

    return session
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}
