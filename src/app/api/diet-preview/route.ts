import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { z } from 'zod'

const Schema = z.object({
  message: z.string().min(1).max(1000),
  checkInId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(10).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { message, checkInId, history = [] } = parsed.data

  const checkIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId, ...(checkInId ? { id: checkInId } : {}) },
    orderBy: { createdAt: 'desc' },
  })

  if (!checkIn?.dietPlan) {
    return NextResponse.json({ error: 'No hay plan activo' }, { status: 404 })
  }

  const currentPlan = JSON.parse(checkIn.dietPlan)
  const macros = {
    calories: currentPlan.calories,
    protein: currentPlan.protein,
    carbs: currentPlan.carbs,
    fat: currentPlan.fat,
  }

  const systemPrompt = `Eres el mejor nutricionista deportivo del mundo. El usuario tiene un plan de dieta activo y quiere refinarlo conversando contigo. Eres directo, experto y motivador.

MACROS FIJOS (no cambiar salvo que el usuario pida explícitamente redistribuir comidas):
- Calorías totales: ${macros.calories} kcal
- Proteína: ${macros.protein}g
- Carbohidratos: ${macros.carbs}g
- Grasa: ${macros.fat}g

REGLAS AL ADAPTAR:
1. Gramos exactos siempre ("150g pechuga a la plancha", "80g espaguetis en seco")
2. Métodos sanos: plancha, horno, vapor, hervido. Nunca frito. Máx 10g aceite/comida
3. Rota proteínas: pollo → salmón → ternera → huevos → merluza → atún → pavo
4. Carbohidratos variados: pasta (espaguetis, macarrones, penne), arroz, patata, avena, pan integral
5. Verduras: mínimo 400g/día en peso crudo, siempre especificadas con gramos
6. Desayuno: proteína real + fibra. Nunca solo café
7. Si el usuario pide eliminar una comida (ej: "no puedo merendar"), redistribuye esas calorías y macros en las demás comidas proporcionalmente
8. Si pide añadir pasta o cambiar un alimento, hazlo manteniendo macros ±5%
9. Pescado azul mínimo 2x/semana en el plan
10. Fruta 2-3 piezas/día variadas

PLAN ACTUAL DEL USUARIO (JSON):
${JSON.stringify(currentPlan.diet, null, 2)}

Responde SIEMPRE con este JSON exacto (sin markdown):
{
  "reply": "<tu respuesta conversacional explicando qué cambiaste y por qué, en 2-3 frases directas y motivadoras>",
  "diet": { <plan completo modificado en el mismo formato que el plan actual> },
  "mealCalories": { "desayuno": <kcal>, "mediaManana": <kcal>, "comida": <kcal>, "merienda": <kcal>, "cena": <kcal> },
  "changed": true
}`

  // Build conversation messages
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []

  // Add conversation history
  for (const h of history) {
    messages.push({ role: h.role, content: h.content })
  }

  // Add current user message
  messages.push({ role: 'user', content: message })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Error al procesar la respuesta' }, { status: 500 })

  const result = JSON.parse(jsonMatch[0])

  return NextResponse.json({
    reply: result.reply,
    diet: result.diet,
    mealCalories: result.mealCalories,
  })
}
