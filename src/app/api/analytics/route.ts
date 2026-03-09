import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = typeof body.event === 'string' ? body.event : ''
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null

    // Try to get userId if session exists — not required
    let userId: string | null = null
    try {
      const session = await getSession()
      if (session) userId = session.userId
    } catch { /* no session is fine */ }

    if (event) {
      await prisma.analyticsEvent.create({
        data: { userId: userId || null, event, metadata },
      })
    }
  } catch { /* fire-and-forget — never fail */ }

  return NextResponse.json({ ok: true })
}
