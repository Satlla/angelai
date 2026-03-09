import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'
import { actualizarMedalla } from '@/lib/update-medal'

const DailyLogSchema = z.object({
  dietScore: z.number().int().min(0).max(100),
  trainedToday: z.boolean(),
  sleptWell: z.boolean(),
  waterOk: z.boolean(),
  stressLevel: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = { id: session.userId }

  const parsed = DailyLogSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { dietScore, trainedToday, sleptWell, waterOk, stressLevel, notes } = parsed.data

  // Normalizar la fecha a medianoche UTC del día de España (UTC+1/+2)
  const now = new Date()
  const spainOffset = isDST(now) ? 2 : 1
  const spainNow = new Date(now.getTime() + spainOffset * 60 * 60 * 1000)
  const todayDate = new Date(Date.UTC(
    spainNow.getUTCFullYear(),
    spainNow.getUTCMonth(),
    spainNow.getUTCDate()
  ))

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: todayDate } },
    update: { dietScore, trainedToday, sleptWell, waterOk, stressLevel, notes },
    create: {
      userId: user.id,
      date: todayDate,
      dietScore,
      trainedToday: !!trainedToday,
      sleptWell: !!sleptWell,
      waterOk: !!waterOk,
      stressLevel: stressLevel ?? 3,
      notes,
    },
  })

  // Actualizar medalla en background (no bloqueante)
  const medal = await actualizarMedalla(user.id).catch(() => null)

  return NextResponse.json({ ok: true, log, medal })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = { id: session.userId }

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 60,
  })

  return NextResponse.json({ logs })
}

function isDST(date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset()
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset()
  return Math.min(jan, jul) === date.getTimezoneOffset()
}
