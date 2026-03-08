import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || email.toLowerCase() !== process.env.ALLOWED_EMAIL?.toLowerCase()) {
    return NextResponse.json({ error: 'Email no autorizado. Esta plataforma es de acceso privado.' }, { status: 401 })
  }

  let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

  if (!user) {
    user = await prisma.user.create({ data: { email: email.toLowerCase() } })
  }

  const hasProfile = (await prisma.checkIn.count({ where: { userId: user.id } })) > 0

  await createSession(user.id, user.email)

  return NextResponse.json({ success: true, hasProfile })
}
