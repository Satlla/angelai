import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Get weekly discipline scores per user
  const logs = await prisma.dailyLog.groupBy({
    by: ['userId'],
    where: { date: { gte: sevenDaysAgo }, disciplineScore: { not: null } },
    _avg: { disciplineScore: true },
    _count: { id: true },
    orderBy: { _avg: { disciplineScore: 'desc' } },
    take: 20,
  })

  const userIds = logs.map(l => l.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, currentMedal: true },
  })

  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  const ranking = logs
    .filter(l => (l._avg.disciplineScore ?? 0) > 0 && l._count.id >= 3)
    .map((l, i) => {
      const u = userMap[l.userId]
      // Anonymize: show first name only, rest as initials
      const fullName = u?.name || 'Anónimo'
      const parts = fullName.trim().split(' ')
      const displayName = parts[0] + (parts[1] ? ` ${parts[1][0]}.` : '')
      return {
        rank: i + 1,
        name: displayName,
        isMe: l.userId === session.userId,
        score: Math.round(l._avg.disciplineScore ?? 0),
        days: l._count.id,
        medal: u?.currentMedal ?? null,
      }
    })

  // Find user's own position if not in top 20
  let myPosition = null
  if (!ranking.find(r => r.isMe)) {
    const myLogs = await prisma.dailyLog.aggregate({
      where: { userId: session.userId, date: { gte: sevenDaysAgo }, disciplineScore: { not: null } },
      _avg: { disciplineScore: true },
      _count: { id: true },
    })
    if ((myLogs._avg.disciplineScore ?? 0) > 0) {
      myPosition = { score: Math.round(myLogs._avg.disciplineScore ?? 0), days: myLogs._count.id }
    }
  }

  return NextResponse.json({ ranking, myPosition })
}
