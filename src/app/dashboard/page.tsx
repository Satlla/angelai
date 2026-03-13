import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  const session = await getSession()
  if (!session) redirect('/')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/')

  try {
  const [checkIns, badges, preferences, todayLog, dailyLogs] = await Promise.all([
    prisma.checkIn.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, createdAt: true, weight: true, bodyScore: true, rank: true,
        analysis: true, dietPlan: true, goal: true, waist: true, hips: true,
        chest: true, arms: true, customizationUsed: true,
      },
    }),
    prisma.userBadge.findMany({ where: { userId: user.id } }),
    prisma.userPreferences.findUnique({ where: { userId: user.id } }),
    prisma.dailyLog.findFirst({ where: { userId: user.id, date: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    prisma.dailyLog.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' }, take: 60, select: { date: true, disciplineScore: true, trainedToday: true } }),
  ])

  if (checkIns.length === 0) redirect('/onboarding')

  const latest = checkIns[0]
  const nextCheckIn = new Date(latest.createdAt)
  nextCheckIn.setDate(nextCheckIn.getDate() + 15)
  const daysLeft = Math.max(0, Math.ceil((nextCheckIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#07080F' }} />}>
    <DashboardClient
      user={{ id: user.id, email: user.email, name: user.name, profilePhotoUrl: user.profilePhotoUrl }}
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
        customizationUsed: c.customizationUsed,
      }))}
      badges={badges.map((b: typeof badges[0]) => ({ badge: b.badge, earnedAt: b.earnedAt.toISOString() }))}
      daysLeft={daysLeft}
      dailyReminderEnabled={preferences?.dailyReminderEnabled ?? true}
      hasLoggedToday={!!todayLog}
      dailyLogs={dailyLogs.map(l => ({ date: l.date.toISOString(), disciplineScore: l.disciplineScore, trainedToday: l.trainedToday }))}
      preferences={{
        trainingDays: preferences?.trainingDays ?? null,
        cardioTime: preferences?.cardioTime ?? null,
        equipment: preferences?.equipment ?? null,
        likedExercises: (() => { try { return preferences?.likedExercises ? JSON.parse(preferences.likedExercises) : [] } catch { return [] } })(),
        dislikedExercises: (() => { try { return preferences?.dislikedExercises ? JSON.parse(preferences.dislikedExercises) : [] } catch { return [] } })(),
        trainingNotes: preferences?.trainingNotes ?? null,
        dietNotes: preferences?.dietNotes ?? null,
      }}
    />
    </Suspense>
  )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Dashboard] Server error:', msg)
    throw err
  }
}
