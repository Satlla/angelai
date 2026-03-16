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
      select: {
        height: true, activityLevel: true,
        weight: true, waist: true, hips: true, chest: true,
        arms: true, bicepFlexed: true, thighs: true, calves: true, shoulders: true,
      },
    }),
    prisma.userPreferences.findUnique({
      where: { userId: session.userId },
      select: { dietNotes: true, weeklyEmailEnabled: true, dailyReminderEnabled: true, height: true, activityLevel: true },
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
      dailyReminderEnabled={prefs?.dailyReminderEnabled ?? true}
      measurements={{
        weight:      lastCheckIn?.weight ?? null,
        waist:       lastCheckIn?.waist ?? null,
        hips:        lastCheckIn?.hips ?? null,
        chest:       lastCheckIn?.chest ?? null,
        arms:        lastCheckIn?.arms ?? null,
        bicepFlexed: lastCheckIn?.bicepFlexed ?? null,
        thighs:      lastCheckIn?.thighs ?? null,
        calves:      lastCheckIn?.calves ?? null,
        shoulders:   lastCheckIn?.shoulders ?? null,
      }}
      hasCheckIn={!!lastCheckIn}
    />
  )
}
