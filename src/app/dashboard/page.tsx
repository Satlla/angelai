import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  const session = await getSession()
  if (!session) redirect('/')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/')

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  if (checkIns.length === 0) redirect('/onboarding')

  const badges = await prisma.userBadge.findMany({ where: { userId: user.id } })
  const latest = checkIns[0]
  const nextCheckIn = new Date(latest.createdAt)
  nextCheckIn.setDate(nextCheckIn.getDate() + 15)
  const daysLeft = Math.max(0, Math.ceil((nextCheckIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <DashboardClient
      user={{ id: user.id, email: user.email, name: user.name }}
      checkIns={checkIns.map((c: typeof checkIns[0]) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        weight: c.weight,
        bodyScore: c.bodyScore,
        rank: c.rank,
        analysis: c.analysis,
        dietPlan: c.dietPlan,
        goal: c.goal,
        waist: c.waist,
        hips: c.hips,
        chest: c.chest,
        arms: c.arms,
      }))}
      badges={badges.map((b: typeof badges[0]) => ({ badge: b.badge, earnedAt: b.earnedAt.toISOString() }))}
      daysLeft={daysLeft}
    />
  )
}
