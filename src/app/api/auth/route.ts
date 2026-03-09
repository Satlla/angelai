import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    const allowed = (process.env.ALLOWED_EMAILS || process.env.ALLOWED_EMAIL || '')
      .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

    if (!email || !allowed.includes(email.toLowerCase())) {
      return NextResponse.json({ error: 'Email no autorizado. Esta plataforma es de acceso privado.' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      user = await prisma.user.create({ data: { email: email.toLowerCase() } })
    }

    const hasProfile = (await prisma.checkIn.count({ where: { userId: user.id } })) > 0

    await createSession(user.id, user.email)

    return NextResponse.json({ success: true, hasProfile })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/auth] Error:', msg)
    return NextResponse.json({ error: 'Error interno', detail: msg }, { status: 500 })
  }
}
