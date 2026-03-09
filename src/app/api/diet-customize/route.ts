import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { anthropic } from '@/lib/anthropic'
import { z } from 'zod'

const CustomizeSchema = z.object({
  customRequest: z.string().min(1).max(500),
  checkInId: z.string().optional(),
})

// Simple in-memory rate limiter: max 5 requests per user per 10 minutes
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW_MS = 10 * 60 * 1000

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const user = { id: session.userId }

  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: 'Demasiadas peticiones. Espera unos minutos.' }, { status: 429 })
  }

  const parsed = CustomizeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { customRequest, checkInId } = parsed.data

  // Obtener el último check-in con el plan actual
  const checkIn = await prisma.checkIn.findFirst({
    where: { userId: user.id, ...(checkInId ? { id: checkInId } : {}) },
    orderBy: { createdAt: 'desc' },
  })

  if (!checkIn?.dietPlan) {
    return NextResponse.json({ error: 'No hay plan activo' }, { status: 404 })
  }

  if (checkIn.customizationUsed) {
    return NextResponse.json({ error: 'Ya usaste tu ajuste para este ciclo. El próximo check-in te dará uno nuevo.', limitReached: true }, { status: 403 })
  }

  const currentPlan = JSON.parse(checkIn.dietPlan)
  const macros = {
    calories: currentPlan.calories,
    protein: currentPlan.protein,
    carbs: currentPlan.carbs,
    fat: currentPlan.fat,
  }

  const systemPrompt = `Eres un nutricionista deportivo experto. El usuario tiene un plan de dieta activo con macros fijos que NO puedes cambiar.
Tu única tarea es ADAPTAR los alimentos según la petición del usuario, manteniendo los mismos macros totales (±5% tolerancia).
Explica brevemente qué cambios has hecho y por qué. Responde siempre en español.`

  const userPrompt = `Macros fijos a respetar:
- Calorías: ${macros.calories} kcal
- Proteína: ${macros.protein}g
- Carbohidratos: ${macros.carbs}g
- Grasa: ${macros.fat}g

Plan actual:
${JSON.stringify(currentPlan.diet, null, 2)}

Petición del usuario: "${customRequest}"

Responde ÚNICAMENTE con este JSON (sin markdown):
{
  "changes": "<resumen de 2-3 frases de qué cambió y por qué>",
  "diet": {
    "antesDesayuno": ["<item>"],
    "desayuno": { "opcionA": ["<item>"], "opcionB": ["<item>"], "opcionC": ["<item>"] },
    "mediaManana": { "opcionA": ["<item>"], "opcionB": ["<item>"] },
    "almuerzo": { "opcionA": ["<item>", "<item>"], "opcionB": ["<item>", "<item>"], "opcionC": ["<item>", "<item>"] },
    "merienda": { "opcionA": ["<item>"], "opcionB": ["<item>"] },
    "cena": { "opcionA": ["<item>", "<item>"], "opcionB": ["<item>", "<item>"], "opcionC": ["<item>", "<item>"] },
    "antesDeCormir": ["<item>"]
  },
  "mealCalories": { "desayuno": <kcal>, "mediaManana": <kcal>, "almuerzo": <kcal>, "merienda": <kcal>, "cena": <kcal> }
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear respuesta')

  const result = JSON.parse(jsonMatch[0])

  // Guardar el plan actualizado en el check-in
  const updatedPlan = {
    ...currentPlan,
    diet: result.diet,
    mealCalories: result.mealCalories,
    lastCustomization: result.changes,
  }

  await prisma.checkIn.update({
    where: { id: checkIn.id },
    data: { dietPlan: JSON.stringify(updatedPlan), customizationUsed: true },
  })

  return NextResponse.json({ ok: true, changes: result.changes, diet: result.diet, mealCalories: result.mealCalories })
}
