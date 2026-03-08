import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const body = await req.json()
  const {
    trainingDays, cardioTime, equipment,
    likedExercises, dislikedExercises,
    trainingNotes, dietNotes,
  } = body

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
    },
  })

  return NextResponse.json(prefs)
}
