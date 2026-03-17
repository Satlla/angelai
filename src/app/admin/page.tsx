import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import dynamic from 'next/dynamic'

const AdminClient = dynamic(() => import('./AdminClient'), { ssr: false })

export default async function AdminPage() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  const expectedToken = adminPassword.slice(0, 8) + '_ok'
  if (!adminSession || adminSession !== expectedToken) redirect('/admin/login')

  try {
  const [users, analyticsGrouped, recentEvents, invites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        checkIns: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, createdAt: true, weight: true, bodyScore: true,
            rank: true, goal: true, waist: true, hips: true, chest: true,
            arms: true, analysis: true, dietPlan: true,
          },
        },
        badges: true,
        preferences: {
          select: {
            trainingDays: true, equipment: true, activityLevel: true,
            weeklyEmailEnabled: true, dailyReminderEnabled: true,
          },
        },
        dailyLogs: {
          orderBy: { date: 'desc' },
          take: 30,
          select: {
            date: true, dietScore: true, trainedToday: true,
            sleptWell: true, waterOk: true, disciplineScore: true,
          },
        },
        coachMessages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ['event'],
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take: 20,
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, event: true, userId: true, createdAt: true, metadata: true },
    }),
    prisma.pendingInvite.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const serialized = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    profilePhotoUrl: u.profilePhotoUrl,
    age: u.age,
    sex: u.sex,
    createdAt: u.createdAt.toISOString(),
    checkIns: u.checkIns.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
    badges: u.badges.map(b => ({ badge: b.badge, earnedAt: b.earnedAt.toISOString() })),
    preferences: u.preferences,
    dailyLogs: u.dailyLogs.map(l => ({ ...l, date: l.date.toISOString() })),
    coachMessages: u.coachMessages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
  }))

  return (
    <AdminClient
      users={serialized}
      analytics={analyticsGrouped.map(a => ({ event: a.event, count: a._count.event }))}
      recentEvents={recentEvents.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      invites={invites.map(i => ({
        id: i.id,
        token: i.token,
        inviterUserId: i.inviterUserId,
        inviteeEmail: i.inviteeEmail,
        usedAt: i.usedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Admin] Server error:', msg)
    return (
      <div style={{ padding: '40px', fontFamily: 'monospace', color: 'red', background: '#07080F' }}>
        <h2>Admin Error</h2>
        <pre>{msg}</pre>
      </div>
    )
  }
}
