import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const FoodEntrySchema = z.object({
  name: z.string().min(1).max(200),
  calories: z.number().int().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  meal: z.enum(['desayuno', 'almuerzo', 'merienda', 'cena', 'otros']),
})

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')

  // Spain timezone date
  const now = new Date()
  const spainParts = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const sp = Object.fromEntries(spainParts.filter(p => p.type !== 'literal').map(p => [p.type, parseInt(p.value)]))
  const todayDate = dateParam ? new Date(dateParam) : new Date(Date.UTC(sp.year, sp.month - 1, sp.day))

  const nextDay = new Date(todayDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const entries = await prisma.foodEntry.findMany({
    where: { userId: session.userId, date: { gte: todayDate, lt: nextDay } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = FoodEntrySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const now = new Date()
  const spainParts = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const sp = Object.fromEntries(spainParts.filter(p => p.type !== 'literal').map(p => [p.type, parseInt(p.value)]))
  const todayDate = new Date(Date.UTC(sp.year, sp.month - 1, sp.day))

  const entry = await prisma.foodEntry.create({
    data: { userId: session.userId, date: todayDate, ...parsed.data },
  })

  return NextResponse.json({ entry })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await prisma.foodEntry.deleteMany({ where: { id, userId: session.userId } })
  return NextResponse.json({ ok: true })
}
