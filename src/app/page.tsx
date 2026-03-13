import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LandingClient from './LandingClient'

export default async function Page() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  return <LandingClient />
}
