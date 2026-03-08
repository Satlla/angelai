import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [user, lastCheckIn] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, age: true, sex: true },
    }),
    prisma.checkIn.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { height: true, activityLevel: true, goal: true },
    }),
  ])

  return NextResponse.json({ ...user, height: lastCheckIn?.height, activityLevel: lastCheckIn?.activityLevel, goal: lastCheckIn?.goal })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, age, sex } = await req.json()

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: name || null,
      age: age ? parseInt(age) : null,
      sex: sex || null,
    },
    select: { id: true, email: true, name: true, age: true, sex: true },
  })

  return NextResponse.json(user)
}
