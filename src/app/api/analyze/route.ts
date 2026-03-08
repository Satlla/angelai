import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analyzBodyAndGenerateDiet } from '@/lib/anthropic'
import { put } from '@vercel/blob'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()

  const weight = parseFloat(formData.get('weight') as string)
  const height = parseFloat(formData.get('height') as string)
  const waist = formData.get('waist') ? parseFloat(formData.get('waist') as string) : undefined
  const hips = formData.get('hips') ? parseFloat(formData.get('hips') as string) : undefined
  const chest = formData.get('chest') ? parseFloat(formData.get('chest') as string) : undefined
  const arms = formData.get('arms') ? parseFloat(formData.get('arms') as string) : undefined
  const goal = (formData.get('goal') as string) || 'definicion'

  const frontPhoto = formData.get('frontPhoto') as File | null
  const sidePhoto = formData.get('sidePhoto') as File | null

  // Subir fotos a Vercel Blob (se eliminarán a los 30 días con una cron job)
  let frontPhotoUrl: string | undefined
  let sidePhotoUrl: string | undefined
  let frontPhotoBase64: string | undefined
  let sidePhotoBase64: string | undefined

  if (frontPhoto && frontPhoto.size > 0) {
    const bytes = await frontPhoto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    frontPhotoBase64 = buffer.toString('base64')
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`angelai/photos/${session.userId}/front-${Date.now()}.jpg`, buffer, { access: 'public' })
      frontPhotoUrl = blob.url
    }
  }

  if (sidePhoto && sidePhoto.size > 0) {
    const bytes = await sidePhoto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    sidePhotoBase64 = buffer.toString('base64')
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`angelai/photos/${session.userId}/side-${Date.now()}.jpg`, buffer, { access: 'public' })
      sidePhotoUrl = blob.url
    }
  }

  // Obtener check-in anterior
  const previousCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { weight: true, bodyScore: true, analysis: true, createdAt: true },
  })

  // Llamar a Claude
  const result = await analyzBodyAndGenerateDiet({
    weight, height, waist, hips, chest, arms, goal,
    previousCheckIn: previousCheckIn ? {
      weight: previousCheckIn.weight,
      bodyScore: previousCheckIn.bodyScore || 0,
      analysis: previousCheckIn.analysis || '',
      createdAt: previousCheckIn.createdAt.toISOString(),
    } : null,
    frontPhotoBase64,
    sidePhotoBase64,
  })

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
      goal,
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

  return NextResponse.json({ success: true, checkInId: checkIn.id, result, newBadges: [...new Set(badgesToAdd)] })
}
