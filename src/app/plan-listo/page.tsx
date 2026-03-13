import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PlanListoClient from './PlanListoClient'

export default async function PlanListo({
  searchParams,
}: {
  searchParams: Promise<{ checkInId?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/')

  const { checkInId } = await searchParams
  if (!checkInId) redirect('/dashboard')

  const [checkIn, user] = await Promise.all([
    prisma.checkIn.findUnique({
      where: { id: checkInId, userId: session.userId },
      select: { id: true, dietPlan: true, sex: true, goal: true, weight: true },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, sex: true },
    }),
  ])

  if (!checkIn?.dietPlan) redirect('/dashboard')

  let plan
  try { plan = JSON.parse(checkIn.dietPlan) } catch { redirect('/dashboard') }

  const sex = user?.sex || checkIn.sex || 'hombre'

  return (
    <PlanListoClient
      checkInId={checkInId}
      sex={sex}
      name={user?.name || null}
      plan={plan}
    />
  )
}
