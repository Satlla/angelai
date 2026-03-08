import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CheckInClient from './CheckInClient'

export default async function CheckIn() {
  const session = await getSession()
  if (!session) redirect('/')

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      height: true,
      goal: true,
      age: true,
      sex: true,
      activityLevel: true,
    },
  })

  if (!lastCheckIn) redirect('/onboarding')

  // Guard: no se puede hacer check-in antes de 15 días
  const nextAllowed = new Date(lastCheckIn.createdAt)
  nextAllowed.setDate(nextAllowed.getDate() + 15)
  const daysLeft = Math.ceil((nextAllowed.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  if (daysLeft > 0) redirect(`/dashboard?checkin_blocked=${daysLeft}`)

  return (
    <CheckInClient
      defaultHeight={lastCheckIn.height}
      defaultGoal={lastCheckIn.goal}
      defaultAge={lastCheckIn.age}
      defaultSex={lastCheckIn.sex}
      defaultActivityLevel={lastCheckIn.activityLevel}
    />
  )
}
