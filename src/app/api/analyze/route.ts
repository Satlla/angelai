import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzBodyAndGenerateDiet } from '@/lib/anthropic'
import { put } from '@vercel/blob'
import { actualizarMedalla } from '@/lib/update-medal'

// Rate limit: max 3 analyze requests per user per hour (endpoint is expensive)
const analyzeRateMap = new Map<string, { count: number; resetAt: number }>()

function isAnalyzeRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = analyzeRateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    analyzeRateMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }
  if (entry.count >= 3) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (isAnalyzeRateLimited(session.userId)) {
    return NextResponse.json({ error: 'Demasiadas peticiones. Espera una hora antes de intentarlo de nuevo.' }, { status: 429 })
  }

  // Guard: no se puede hacer check-in antes de 15 días (excepto el primero)
  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, weight: true, bodyScore: true, analysis: true },
  })

  if (lastCheckIn) {
    const nextAllowed = new Date(lastCheckIn.createdAt)
    nextAllowed.setDate(nextAllowed.getDate() + 15)
    if (new Date() < nextAllowed) {
      return NextResponse.json({ error: 'Aún no puedes hacer check-in.' }, { status: 403 })
    }
  }

  const formData = await req.formData()

  const weight = parseFloat(formData.get('weight') as string)
  const height = parseFloat(formData.get('height') as string)
  const waist = formData.get('waist') ? parseFloat(formData.get('waist') as string) : undefined
  const hips = formData.get('hips') ? parseFloat(formData.get('hips') as string) : undefined
  const chest = formData.get('chest') ? parseFloat(formData.get('chest') as string) : undefined
  const arms = formData.get('arms') ? parseFloat(formData.get('arms') as string) : undefined
  const thighs = formData.get('thighs') ? parseFloat(formData.get('thighs') as string) : undefined
  const calves = formData.get('calves') ? parseFloat(formData.get('calves') as string) : undefined
  const shoulders = formData.get('shoulders') ? parseFloat(formData.get('shoulders') as string) : undefined
  const goal = (formData.get('goal') as string) || 'definicion'
  const age = formData.get('age') ? parseInt(formData.get('age') as string) : undefined
  const sex = (formData.get('sex') as string) || undefined
  const activityLevel = (formData.get('activityLevel') as string) || undefined
  const freeTextContext = (formData.get('freeTextContext') as string) || undefined

  if (!weight || !height || isNaN(weight) || isNaN(height)) {
    return NextResponse.json({ error: 'Peso y altura son obligatorios.' }, { status: 400 })
  }

  const frontPhoto = formData.get('frontPhoto') as File | null
  const sidePhoto = formData.get('sidePhoto') as File | null

  let frontPhotoUrl: string | undefined
  let sidePhotoUrl: string | undefined
  let frontPhotoBase64: string | undefined
  let sidePhotoBase64: string | undefined
  let frontPhotoMime: string | undefined
  let sidePhotoMime: string | undefined

  if (frontPhoto && frontPhoto.size > 0) {
    const bytes = await frontPhoto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    frontPhotoBase64 = buffer.toString('base64')
    frontPhotoMime = frontPhoto.type || 'image/jpeg'
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`angelai/photos/${session.userId}/front-${Date.now()}.jpg`, buffer, { access: 'public' })
        frontPhotoUrl = blob.url
      } catch {
        // Foto no es bloqueante — continúa sin ella
      }
    }
  }

  if (sidePhoto && sidePhoto.size > 0) {
    const bytes = await sidePhoto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    sidePhotoBase64 = buffer.toString('base64')
    sidePhotoMime = sidePhoto.type || 'image/jpeg'
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`angelai/photos/${session.userId}/side-${Date.now()}.jpg`, buffer, { access: 'public' })
        sidePhotoUrl = blob.url
      } catch {
        // Foto no es bloqueante — continúa sin ella
      }
    }
  }

  // Preferencias y check-in anterior en paralelo
  const [userPreferences, previousCheckIn] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId: session.userId } }),
    prisma.checkIn.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { weight: true, bodyScore: true, analysis: true, createdAt: true },
    }),
  ])

  // Llamar a Claude con reintentos
  let result
  let attempts = 0
  while (attempts < 2) {
    try {
      result = await analyzBodyAndGenerateDiet({
        weight, height, waist, hips, chest, arms, thighs, calves, shoulders, goal, age, sex, activityLevel,
        freeTextContext: freeTextContext || null,
        previousCheckIn: previousCheckIn ? {
          weight: previousCheckIn.weight,
          bodyScore: previousCheckIn.bodyScore || 0,
          analysis: previousCheckIn.analysis || '',
          createdAt: previousCheckIn.createdAt.toISOString(),
        } : null,
        frontPhotoBase64,
        sidePhotoBase64,
        frontPhotoMime,
        sidePhotoMime,
        preferences: userPreferences ? {
          trainingDays: userPreferences.trainingDays,
          cardioTime: userPreferences.cardioTime,
          equipment: userPreferences.equipment,
          likedExercises: userPreferences.likedExercises ? JSON.parse(userPreferences.likedExercises) : [],
          dislikedExercises: userPreferences.dislikedExercises ? JSON.parse(userPreferences.dislikedExercises) : [],
          trainingNotes: userPreferences.trainingNotes,
          dietNotes: userPreferences.dietNotes,
        } : null,
      })
      break
    } catch (err) {
      attempts++
      if (attempts >= 2) {
        console.error('Claude error after retries:', err)
        return NextResponse.json(
          { error: 'El análisis tardó demasiado. Inténtalo de nuevo en unos minutos.' },
          { status: 503 }
        )
      }
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  if (!result) {
    return NextResponse.json({ error: 'No se pudo generar el plan.' }, { status: 503 })
  }

  const photoExpires = new Date()
  photoExpires.setDate(photoExpires.getDate() + 30)

  const checkIn = await prisma.checkIn.create({
    data: {
      userId: session.userId,
      weight, height,
      waist: waist || null,
      hips: hips || null,
      chest: chest || null,
      arms: arms || null,
      thighs: thighs || null,
      calves: calves || null,
      shoulders: shoulders || null,
      goal,
      age: age || null,
      sex: sex || null,
      activityLevel: activityLevel || null,
      frontPhotoUrl: frontPhotoUrl || null,
      sidePhotoUrl: sidePhotoUrl || null,
      photoExpiresAt: frontPhotoUrl ? photoExpires : null,
      bodyScore: result.bodyScore,
      rank: result.rank,
      analysis: result.analysis,
      dietPlan: JSON.stringify(result),
    },
  })

  // Badges
  const allCheckIns = await prisma.checkIn.count({ where: { userId: session.userId } })
  const badgesToAdd: string[] = result.badges || []
  if (allCheckIns === 1) badgesToAdd.push('primer_paso')
  if (allCheckIns === 3) badgesToAdd.push('sin_rendirse')
  if (allCheckIns === 6) badgesToAdd.push('constancia')
  if (previousCheckIn && weight < previousCheckIn.weight - 0.9) badgesToAdd.push('primer_kilo')
  if (previousCheckIn && weight < previousCheckIn.weight - 4.9) badgesToAdd.push('transformacion')

  for (const badge of [...new Set(badgesToAdd)]) {
    await prisma.userBadge.upsert({
      where: { userId_badge: { userId: session.userId, badge } },
      update: {},
      create: { userId: session.userId, badge },
    })
  }

  // Actualizar medalla (no bloqueante — si falla no rompe la respuesta)
  const newMedal = await actualizarMedalla(session.userId).catch(() => null)

  return NextResponse.json({ success: true, checkInId: checkIn.id, result, newBadges: [...new Set(badgesToAdd)], medal: newMedal })
}
