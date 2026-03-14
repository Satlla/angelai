import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { message, history } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })

  const [user, latestCheckIn, recentLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, age: true, sex: true } }),
    prisma.checkIn.findFirst({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { weight: true, goal: true, bodyScore: true, rank: true, dietPlan: true },
    }),
    prisma.dailyLog.findMany({
      where: { userId: session.userId },
      orderBy: { date: 'desc' },
      take: 7,
      select: { date: true, dietScore: true, trainedToday: true, sleptWell: true, disciplineScore: true },
    }),
  ])

  let macros = ''
  if (latestCheckIn?.dietPlan) {
    try {
      const plan = JSON.parse(latestCheckIn.dietPlan)
      macros = `Calorías: ${plan.calories}kcal, Proteína: ${plan.protein}g, Carbos: ${plan.carbs}g, Grasas: ${plan.fat}g`
    } catch { /* */ }
  }

  const avgDiscipline = recentLogs.length
    ? Math.round(recentLogs.reduce((s, l) => s + (l.disciplineScore ?? 0), 0) / recentLogs.length)
    : 0
  const trainedDays = recentLogs.filter(l => l.trainedToday).length

  const systemPrompt = `Eres el Dr. Jarvis, el asistente IA personal de AngelAI, una app de fitness española. Eres directo, experto en nutrición y entrenamiento, y un poco "cabroncete" motivador — dices las verdades aunque duelan, pero con la intención de ayudar.

Perfil del usuario:
- Nombre: ${user?.name ?? 'Usuario'}
- Edad: ${user?.age ?? '?'} años, Sexo: ${user?.sex ?? '?'}
- Objetivo: ${latestCheckIn?.goal ?? '?'}
- Peso actual: ${latestCheckIn?.weight ?? '?'}kg
- Body score: ${latestCheckIn?.bodyScore ?? '?'} (${latestCheckIn?.rank ?? '?'})
- Plan nutricional: ${macros || 'no disponible'}
- Últimos 7 días: disciplina media ${avgDiscipline}%, entrenó ${trainedDays}/7 días

Responde en español. Sé conciso (máximo 150 palabras). Usa **negritas** solo para conceptos clave importantes. No uses asteriscos simples para cursiva. Si el usuario pregunta sobre dieta o entrenamiento, da consejos específicos basados en su perfil. Si el usuario pregunta algo que no tiene relación con fitness, nutrición o entrenamiento, rediríjelo con algo como "Eso está fuera de mi especialidad — estoy aquí para ayudarte con tu dieta y entreno. ¿En qué puedo ayudarte?" Si va con excusas, dale caña.`

  const messages = [
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: systemPrompt,
    messages,
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  // Save both messages to DB
  try {
    await prisma.coachMessage.createMany({
      data: [
        { userId: session.userId, role: 'user', content: message },
        { userId: session.userId, role: 'assistant', content: reply },
      ],
    })
  } catch (err) {
    console.error('[coach-chat] Error saving messages:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ reply })
}
