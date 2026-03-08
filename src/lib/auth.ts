import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('angelai_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return token
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('angelai_session')?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('angelai_session')
}
