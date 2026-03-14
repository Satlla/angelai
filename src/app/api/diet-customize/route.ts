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

  let currentPlan: Record<string, unknown>
  try {
    currentPlan = JSON.parse(checkIn.dietPlan)
  } catch {
    return NextResponse.json({ error: 'Plan corrupto, haz un nuevo check-in.' }, { status: 500 })
  }
  const macros = {
    calories: currentPlan.calories,
    protein: currentPlan.protein,
    carbs: currentPlan.carbs,
    fat: currentPlan.fat,
  }

  const systemPrompt = `Eres el mejor nutricionista deportivo del mundo. El usuario tiene un plan activo con macros fijos que NO puedes cambiar bajo ningún concepto.

Tu tarea: ADAPTAR los alimentos según la petición del usuario respetando estas reglas igual que el plan original:

REGLAS OBLIGATORIAS AL ADAPTAR:
1. Mantén los macros totales exactos (±5% tolerancia): calorías, proteína, carbs y grasa
2. Especifica SIEMPRE gramos exactos ("150g pechuga de pollo a la plancha", "80g espaguetis en seco")
3. Alimentos reales de supermercados de España (Mercadona, Lidl, Aldi)
4. Métodos de cocción saludables: a la plancha, al horno, al vapor, hervido. NUNCA frito
5. Aceite de oliva: máximo 1 cucharada (10g) por comida
6. Rota las proteínas: no repitas la misma dos días seguidos (pollo, salmón, ternera, huevos, merluza, atún, pavo)
7. Carbohidratos variados: usa pasta (espaguetis, macarrones), arroz, patata, avena, pan integral — no siempre arroz
8. Pescado azul mínimo 2 veces por semana en el plan adaptado
9. Verduras: mínimo 400g/día en peso crudo, especifica qué verdura y cuántos gramos
10. Desayuno: siempre proteína real + carbohidrato con fibra. NUNCA solo café
11. Comidas principales (desayuno, comida, cena): mínimo 30g proteína neta
12. Snacks (media mañana, merienda): mínimo 15g proteína
13. Fruta: 2-3 piezas/día variadas
14. Omega 3: máximo 1-2g EPA+DHA si se menciona
15. Whey protein: solo post-entrenamiento, nunca en cheat meal

PROHIBIDO:
- Café cortado como ingesta única
- "Ensalada" o "verduras" sin especificar con gramos
- Repetir proteína principal más de 2 días seguidos
- Barritas procesadas o fiambres como proteína principal
- Más de 10g aceite por comida

Responde siempre en español.`

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
    model: 'claude-sonnet-4-6',
    max_tokens: 5000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'Error al procesar la respuesta de IA' }, { status: 500 })

  let result: { changes: string; diet: unknown; mealCalories: unknown }
  try {
    result = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Error al procesar la respuesta de IA' }, { status: 500 })
  }

  // Use a transaction to atomically check and set customizationUsed (prevents race conditions)
  const updatedCheckIn = await prisma.$transaction(async (tx) => {
    const fresh = await tx.checkIn.findUnique({ where: { id: checkIn.id }, select: { customizationUsed: true } })
    if (fresh?.customizationUsed) return null

    const updatedPlan = {
      ...currentPlan,
      diet: result.diet,
      mealCalories: result.mealCalories,
      lastCustomization: result.changes,
    }

    return tx.checkIn.update({
      where: { id: checkIn.id },
      data: { dietPlan: JSON.stringify(updatedPlan), customizationUsed: true },
    })
  })

  if (!updatedCheckIn) {
    return NextResponse.json({ error: 'Ya usaste tu ajuste para este ciclo.', limitReached: true }, { status: 403 })
  }

  return NextResponse.json({ ok: true, changes: result.changes, diet: result.diet, mealCalories: result.mealCalories })
}
