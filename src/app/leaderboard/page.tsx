import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import LeaderboardClient from './LeaderboardClient'

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/')
  return <LeaderboardClient />
}
