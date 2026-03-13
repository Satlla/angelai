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
  waterGlasses: z.number().int().min(0).max(12).optional(),
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
  const { dietScore, trainedToday, sleptWell, waterOk, waterGlasses, stressLevel, notes } = parsed.data

  // Calcular disciplineScore (0-100)
  const disciplineScore = Math.round(
    (dietScore / 100) * 40 +
    (trainedToday ? 25 : 0) +
    (sleptWell ? 20 : 0) +
    (waterOk ? 10 : 0) +
    ((6 - stressLevel) / 5) * 5
  )

  // Fecha en timezone España usando Intl (correcto en servidor UTC)
  const now = new Date()
  const spainParts = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const sp = Object.fromEntries(spainParts.filter(p => p.type !== 'literal').map(p => [p.type, parseInt(p.value)]))
  const todayDate = new Date(Date.UTC(sp.year, sp.month - 1, sp.day))

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: user.id, date: todayDate } },
    update: { dietScore, trainedToday, sleptWell, waterOk, waterGlasses, stressLevel, notes, disciplineScore },
    create: {
      userId: user.id,
      date: todayDate,
      dietScore,
      trainedToday: !!trainedToday,
      sleptWell: !!sleptWell,
      waterOk: !!waterOk,
      waterGlasses: waterGlasses ?? null,
      stressLevel: stressLevel ?? 3,
      notes,
      disciplineScore,
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
