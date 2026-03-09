import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function Settings() {
  const session = await getSession()
  if (!session) redirect('/')

  const [user, lastCheckIn, prefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, name: true, age: true, sex: true },
    }),
    prisma.checkIn.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { height: true, activityLevel: true },
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.userId },
      select: { dietNotes: true, weeklyEmailEnabled: true },
    }),
  ])

  if (!user) redirect('/')

  return (
    <SettingsClient
      email={user.email}
      defaultName={user.name || ''}
      defaultAge={user.age ? String(user.age) : ''}
      defaultSex={user.sex || ''}
      height={lastCheckIn?.height || null}
      activityLevel={lastCheckIn?.activityLevel || null}
      dietNotes={prefs?.dietNotes || ''}
      weeklyEmailEnabled={prefs?.weeklyEmailEnabled ?? true}
    />
  )
}
