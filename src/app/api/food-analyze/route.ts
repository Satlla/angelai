import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { imageBase64, mimeType = 'image/jpeg' } = body

  if (!imageBase64) return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })

  // Get user's diet plan for context
  const latestCheckIn = await prisma.checkIn.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: { dietPlan: true },
  })

  let macroTarget = ''
  if (latestCheckIn?.dietPlan) {
    try {
      const plan = JSON.parse(latestCheckIn.dietPlan)
      macroTarget = `El objetivo diario del usuario es: ${plan.calories}kcal, ${plan.protein}g proteína, ${plan.carbs}g carbos, ${plan.fat}g grasas.`
    } catch { /* */ }
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp', data: imageBase64 },
        },
        {
          type: 'text',
          text: `Eres el Dr. Jarvis, nutricionista IA experto. Analiza esta comida y responde en JSON con este formato exacto:
{
  "name": "Nombre del plato",
  "calories": número estimado,
  "protein": gramos,
  "carbs": gramos,
  "fat": gramos,
  "assessment": "Valoración breve de 1-2 frases al estilo Jarvis (directo, cabroncete pero útil)",
  "fits_diet": true/false,
  "tip": "Un consejo práctico muy concreto"
}

${macroTarget}

Si no ves comida claramente, devuelve assessment explicando que no puedes analizar la imagen. Sé preciso con las estimaciones.`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { assessment: text }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ assessment: text })
  }
}
