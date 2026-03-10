import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const Schema = z.object({
  checkInId: z.string(),
  patch: z.object({
    diet: z.unknown().optional(),
    training: z.unknown().optional(),
    mealCalories: z.record(z.string(), z.number()).optional(),
  }),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { checkInId, patch } = parsed.data

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId, userId: session.userId },
  })

  if (!checkIn?.dietPlan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const currentPlan = JSON.parse(checkIn.dietPlan)

  if (patch.diet) currentPlan.diet = patch.diet
  if (patch.training) currentPlan.training = patch.training
  if (patch.mealCalories) currentPlan.mealCalories = patch.mealCalories

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { dietPlan: JSON.stringify(currentPlan) },
  })

  return NextResponse.json({ success: true })
}
