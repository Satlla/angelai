import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function analyzBodyAndGenerateDiet(params: {
  weight: number
  height: number
  waist?: number
  hips?: number
  chest?: number
  arms?: number
  goal: string
  previousCheckIn?: {
    weight: number
    bodyScore: number
    analysis: string
    createdAt: string
  } | null
  frontPhotoBase64?: string
  sidePhotoBase64?: string
}) {
  const { weight, height, waist, hips, chest, arms, goal, previousCheckIn, frontPhotoBase64, sidePhotoBase64 } = params

  const bmi = (weight / ((height / 100) ** 2)).toFixed(1)
  const goalLabels: Record<string, string> = {
    definicion: 'definición muscular (bajar grasa manteniendo músculo)',
    volumen: 'ganar masa muscular',
    mantenimiento: 'mantenimiento del peso actual',
    perdida: 'pérdida de peso significativa',
  }

  const systemPrompt = `Eres el mejor nutricionista y entrenador personal del mundo, especializado en mujeres.
Analizas datos corporales y fotos para crear planes de nutrición ultra personalizados y científicamente respaldados.
Siempre respondes en español. Eres directo, motivador pero estricto. Tu análisis es preciso y tu dieta es práctica.
Basas todo en evidencia científica: periodización de la dieta, RIR, progressive overload, ciclado de carbohidratos.`

  const userPrompt = `Analiza esta usuaria y genera su plan completo.

DATOS ACTUALES:
- Peso: ${weight} kg
- Altura: ${height} cm
- IMC: ${bmi}
- Cintura: ${waist ? waist + ' cm' : 'no proporcionada'}
- Caderas: ${hips ? hips + ' cm' : 'no proporcionada'}
- Pecho: ${chest ? chest + ' cm' : 'no proporcionado'}
- Brazos: ${arms ? arms + ' cm' : 'no proporcionados'}
- Objetivo: ${goalLabels[goal] || goal}

${previousCheckIn ? `COMPARATIVA CON CHECK-IN ANTERIOR (${new Date(previousCheckIn.createdAt).toLocaleDateString('es-ES')}):
- Peso anterior: ${previousCheckIn.weight} kg
- Cambio de peso: ${(weight - previousCheckIn.weight).toFixed(1)} kg
- Body Score anterior: ${previousCheckIn.bodyScore}
- Análisis anterior: ${previousCheckIn.analysis}` : 'PRIMER CHECK-IN — establece línea base'}

${frontPhotoBase64 || sidePhotoBase64 ? 'ANÁLISIS VISUAL: Analiza las fotos adjuntas para evaluar composición corporal, distribución de grasa, tono muscular y progreso visual.' : ''}

RESPONDE EXACTAMENTE EN ESTE FORMATO JSON (sin markdown, solo JSON puro):
{
  "bodyScore": <número 0-1000>,
  "rank": <"BRONCE"|"PLATA"|"ORO"|"PLATINO"|"DIAMANTE"|"LEYENDA">,
  "analysis": "<análisis personalizado de 3-4 frases, directo y motivador>",
  "progressSummary": "<si hay check-in anterior: qué cambió y por qué. Si es primero: evaluación inicial>",
  "calories": <número kcal>,
  "protein": <gramos>,
  "carbs": <gramos>,
  "fat": <gramos>,
  "diet": {
    "antesDesayuno": ["<item1>", "<item2>"],
    "desayuno": {
      "opcionA": ["<item1>", "<item2>"],
      "opcionB": ["<item1>", "<item2>"],
      "opcionC": ["<item1>", "<item2>"]
    },
    "almuerzo": {
      "opcionA": ["<item1>", "<item2>"],
      "opcionB": ["<item1>", "<item2>"]
    },
    "comida": {
      "opcionA": ["<item1>", "<item2>"],
      "opcionB": ["<item1>", "<item2>"],
      "opcionC": ["<item1>", "<item2>"]
    },
    "merienda": {
      "opcionA": ["<item1>", "<item2>"],
      "opcionB": ["<item1>", "<item2>"]
    },
    "cena": {
      "opcionA": ["<item1>", "<item2>"],
      "opcionB": ["<item1>", "<item2>"],
      "opcionC": ["<item1>", "<item2>"]
    }
  },
  "training": {
    "dias": <número 3-5>,
    "tipo": "<descripción del tipo de entrenamiento>",
    "rutina": [
      {
        "dia": "Día 1",
        "nombre": "<nombre del día>",
        "ejercicios": [
          {"nombre": "<ejercicio>", "series": <n>, "reps": "<reps o tiempo>"}
        ]
      }
    ]
  },
  "supplements": ["<suplemento 1>", "<suplemento 2>"],
  "tips": ["<tip personalizado 1>", "<tip personalizado 2>", "<tip personalizado 3>"],
  "badges": ["<badge_ganado_1>"]
}`

  const messages: Anthropic.MessageParam[] = []

  if (frontPhotoBase64 || sidePhotoBase64) {
    const content: Anthropic.ContentBlockParam[] = []

    if (frontPhotoBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: frontPhotoBase64 },
      })
    }
    if (sidePhotoBase64) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: sidePhotoBase64 },
      })
    }
    content.push({ type: 'text', text: userPrompt })
    messages.push({ role: 'user', content })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear la respuesta de la IA')

  return JSON.parse(jsonMatch[0])
}
