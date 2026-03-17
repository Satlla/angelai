import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const meal = searchParams.get('meal') || 'almuerzo' // breakfast, lunch, dinner, snack

  const latestCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { dietPlan: true },
  })

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.userId },
    select: { dietNotes: true },
  })

  let context = ''
  if (latestCheckIn?.dietPlan) {
    try {
      const plan = JSON.parse(latestCheckIn.dietPlan)
      context = `Macros diarios objetivo: ${plan.calories}kcal, ${plan.protein}g proteína, ${plan.carbs}g carbos, ${plan.fat}g grasas.`
    } catch { /* */ }
  }
  if (prefs?.dietNotes) context += ` Notas dieta: ${prefs.dietNotes}`

  const mealNames: Record<string, string> = {
    desayuno: 'desayuno', almuerzo: 'almuerzo/comida', merienda: 'merienda', cena: 'cena'
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Eres el Dra. AngelAI, nutricionista experto en cocina española. Genera 3 recetas para ${mealNames[meal] || meal}.

${context}

Responde en JSON con este formato exacto:
{
  "recipes": [
    {
      "name": "Nombre del plato",
      "emoji": "🍳",
      "calories": número,
      "protein": número,
      "carbs": número,
      "fat": número,
      "time": "15 min",
      "ingredients": ["200g pollo", "1 limón", ...],
      "steps": ["Paso 1...", "Paso 2...", ...],
      "tip": "Consejo de AngelAI"
    }
  ]
}

Usa ingredientes comunes en España. Las recetas deben ser realistas, sabrosas y ajustadas a los macros. Máximo 3 pasos simples.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { recipes: [] }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ recipes: [] })
  }
}
