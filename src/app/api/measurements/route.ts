import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const MeasurementsSchema = z.object({
  weight:      z.number().min(30).max(300).optional(),
  waist:       z.number().min(40).max(200).optional().nullable(),
  hips:        z.number().min(40).max(200).optional().nullable(),
  chest:       z.number().min(40).max(200).optional().nullable(),
  arms:        z.number().min(10).max(100).optional().nullable(),
  bicepFlexed: z.number().min(10).max(100).optional().nullable(),
  thighs:      z.number().min(20).max(150).optional().nullable(),
  calves:      z.number().min(10).max(100).optional().nullable(),
  shoulders:   z.number().min(50).max(200).optional().nullable(),
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      weight: true, waist: true, hips: true, chest: true,
      arms: true, bicepFlexed: true, thighs: true, calves: true, shoulders: true,
    },
  })

  return NextResponse.json(lastCheckIn ?? {})
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = MeasurementsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (!lastCheckIn) {
    return NextResponse.json({ error: 'Haz tu primer check-in antes de actualizar medidas' }, { status: 400 })
  }

  const updated = await prisma.checkIn.update({
    where: { id: lastCheckIn.id },
    data: parsed.data,
    select: {
      weight: true, waist: true, hips: true, chest: true,
      arms: true, bicepFlexed: true, thighs: true, calves: true, shoulders: true,
    },
  })

  return NextResponse.json(updated)
}
