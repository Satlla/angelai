import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import DailyClient from './DailyClient'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export default async function DailyPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('angelai_session')?.value
  if (!token) redirect('/')

  try {
    await jwtVerify(token, secret)
  } catch {
    redirect('/')
  }

  return <DailyClient />
}
