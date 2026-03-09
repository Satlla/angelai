import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

// Cron diario a las 03:00 UTC
// Elimina fotos de Vercel Blob que han superado su fecha de expiración (30 días)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Encontrar check-ins con fotos expiradas
  const expired = await prisma.checkIn.findMany({
    where: {
      photoExpiresAt: { lt: new Date() },
      OR: [
        { frontPhotoUrl: { not: null } },
        { sidePhotoUrl: { not: null } },
      ],
    },
    select: { id: true, frontPhotoUrl: true, sidePhotoUrl: true },
  })

  if (expired.length === 0) {
    return NextResponse.json({ deleted: 0 })
  }

  let deleted = 0

  for (const checkIn of expired) {
    const urls = [checkIn.frontPhotoUrl, checkIn.sidePhotoUrl].filter(Boolean) as string[]

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await Promise.allSettled(urls.map(url => del(url)))
    }

    await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: { frontPhotoUrl: null, sidePhotoUrl: null, photoExpiresAt: null },
    })

    deleted++
  }

  return NextResponse.json({ deleted, total: expired.length })
}
