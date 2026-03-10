import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { z } from 'zod'

const Schema = z.object({
  message: z.string().min(1).max(1000),
  checkInId: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { message, checkInId, history = [] } = parsed.data

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId, userId: session.userId },
  })

  if (!checkIn?.dietPlan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

  const plan = JSON.parse(checkIn.dietPlan)

  const systemPrompt = `Eres el mejor nutricionista deportivo y entrenador personal del mundo. El usuario acaba de recibir su plan personalizado y puede pedirte cambios en la dieta o el entrenamiento.

MACROS OBJETIVO (mantener ±5% salvo petición expresa):
- Calorías: ${plan.calories} kcal
- Proteína: ${plan.protein}g
- Carbohidratos: ${plan.carbs}g
- Grasa: ${plan.fat}g

REGLAS DIETA:
1. Gramos exactos siempre ("150g pechuga a la plancha", "80g espaguetis en seco")
2. Métodos: plancha, horno, vapor, hervido. Nunca frito. Máx 10g aceite/comida
3. Si pide eliminar un alimento: sustitúyelo por otro equivalente en macros
4. Si pide añadir algo: ajusta el resto de la comida para mantener macros ±5%
5. Ingredientes de España: pollo, ternera, merluza, salmón, atún, bacalao, jamón serrano, queso fresco
6. Variedad: rota proteínas y carbohidratos en el plan
7. Si algo es nutricionalmente inviable (ej: quitar toda la proteína): explícalo y propón alternativa

REGLAS ENTRENAMIENTO:
1. Si pide eliminar/cambiar un ejercicio: sustitúyelo por uno del mismo grupo muscular
2. Si no tiene equipo: sustitúyelo por uno con equipamiento disponible
3. Si pide cambiar días: respeta el objetivo y nivel del usuario
4. Si algo no es viable: explícalo

PLAN DIETA ACTUAL:
${JSON.stringify(plan.diet, null, 2)}

PLAN ENTRENAMIENTO ACTUAL:
${JSON.stringify(plan.training, null, 2)}

Responde SIEMPRE con este JSON exacto sin markdown:
{
  "reply": "<respuesta conversacional en 2-3 frases directas y motivadoras, en español>",
  "possible": true,
  "diet": null,
  "training": null,
  "mealCalories": null
}

- Si cambias la dieta: incluye el plan dieta completo en "diet" y kcal por comida en "mealCalories"
- Si cambias el entrenamiento: incluye el plan entrenamiento completo en "training"
- Si no es posible: "possible": false, explica en "reply", diet y training null`

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Error al procesar respuesta' }, { status: 500 })

  try {
    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Error al parsear respuesta' }, { status: 500 })
  }
}
