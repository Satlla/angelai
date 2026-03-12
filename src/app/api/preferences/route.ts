import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PreferencesSchema = z.object({
  trainingDays: z.number().int().min(0).max(7).optional(),
  cardioTime: z.enum(['mañana', 'tarde', 'noche', 'separado', 'ninguno']).optional(),
  equipment: z.enum(['gym', 'casa', 'mixto']).optional(),
  likedExercises: z.array(z.string().max(60)).max(20).optional(),
  dislikedExercises: z.array(z.string().max(60)).max(20).optional(),
  trainingNotes: z.string().max(500).optional(),
  dietNotes: z.string().max(500).optional(),
  freeTextContext: z.string().max(2000).optional(),
  weeklyEmailEnabled: z.boolean().optional(),
  dailyReminderEnabled: z.boolean().optional(),
  height: z.number().min(100).max(250).optional(),
  activityLevel: z.enum(['sedentario', 'ligero', 'moderado', 'activo', 'atletico']).optional(),
})

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
  })

  return NextResponse.json(prefs || {})
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = PreferencesSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { trainingDays, cardioTime, equipment, likedExercises, dislikedExercises, trainingNotes, dietNotes, freeTextContext, weeklyEmailEnabled, dailyReminderEnabled, height, activityLevel } = parsed.data

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: session.userId },
    update: {
      trainingDays: trainingDays ?? undefined,
      cardioTime: cardioTime ?? undefined,
      equipment: equipment ?? undefined,
      likedExercises: likedExercises !== undefined ? JSON.stringify(likedExercises) : undefined,
      dislikedExercises: dislikedExercises !== undefined ? JSON.stringify(dislikedExercises) : undefined,
      trainingNotes: trainingNotes ?? undefined,
      dietNotes: dietNotes ?? undefined,
      freeTextContext: freeTextContext ?? undefined,
      weeklyEmailEnabled: weeklyEmailEnabled ?? undefined,
      dailyReminderEnabled: dailyReminderEnabled ?? undefined,
      height: height ?? undefined,
      activityLevel: activityLevel ?? undefined,
    },
    create: {
      userId: session.userId,
      trainingDays: trainingDays ?? null,
      cardioTime: cardioTime ?? null,
      equipment: equipment ?? null,
      likedExercises: likedExercises ? JSON.stringify(likedExercises) : null,
      dislikedExercises: dislikedExercises ? JSON.stringify(dislikedExercises) : null,
      trainingNotes: trainingNotes ?? null,
      dietNotes: dietNotes ?? null,
      freeTextContext: freeTextContext ?? null,
      weeklyEmailEnabled: weeklyEmailEnabled ?? true,
      dailyReminderEnabled: dailyReminderEnabled ?? true,
      height: height ?? null,
      activityLevel: activityLevel ?? null,
    },
  })

  return NextResponse.json(prefs)
}
