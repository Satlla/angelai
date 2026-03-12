import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Admin-only endpoint: backdates the latest check-in to 16 days ago so the user can do a new check-in
// Protected by CRON_SECRET to prevent unauthorized access
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const latest = await prisma.checkIn.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  if (!latest) return NextResponse.json({ error: 'No hay check-ins' }, { status: 404 })

  const sixteenDaysAgo = new Date()
  sixteenDaysAgo.setDate(sixteenDaysAgo.getDate() - 16)

  await prisma.checkIn.update({
    where: { id: latest.id },
    data: { createdAt: sixteenDaysAgo },
  })

  return NextResponse.json({
    ok: true,
    message: `Check-in ${latest.id} backdated to ${sixteenDaysAgo.toISOString()}`,
  })
}
