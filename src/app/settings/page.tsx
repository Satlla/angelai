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
      select: { email: true, name: true, age: true, sex: true, profilePhotoUrl: true },
    }),
    prisma.checkIn.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { height: true, activityLevel: true },
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.userId },
      select: { dietNotes: true, weeklyEmailEnabled: true, height: true, activityLevel: true },
    }),
  ])

  if (!user) redirect('/')

  return (
    <SettingsClient
      email={user.email}
      profilePhotoUrl={user.profilePhotoUrl || null}
      defaultName={user.name || ''}
      defaultAge={user.age ? String(user.age) : ''}
      defaultSex={user.sex || ''}
      height={prefs?.height ?? lastCheckIn?.height ?? null}
      activityLevel={prefs?.activityLevel ?? lastCheckIn?.activityLevel ?? null}
      dietNotes={prefs?.dietNotes || ''}
      weeklyEmailEnabled={prefs?.weeklyEmailEnabled ?? true}
    />
  )
}
