import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─── Cálculo científico de TDEE y macros ───────────────────────────────────

function calcularTDEE(params: {
  weight: number
  height: number
  age: number
  sex: string
  activityLevel: string
}): number {
  const { weight, height, age, sex, activityLevel } = params

  // Mifflin-St Jeor (más precisa que Harris-Benedict)
  const bmr = sex === 'mujer'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5

  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    ligero:     1.375,
    moderado:   1.55,
    activo:     1.725,
    atletico:   1.9,
  }

  return Math.round(bmr * (multipliers[activityLevel] || 1.55))
}

function calcularMacros(tdee: number, weight: number, goal: string): {
  calories: number
  protein: number
  fat: number
  carbs: number
  deficit: number
} {
  // Ajuste calórico por objetivo
  const goalMultiplier: Record<string, number> = {
    perdida:      0.75,   // déficit 25%
    definicion:   0.82,   // déficit 18%
    mantenimiento: 1.0,
    volumen:      1.12,   // superávit 12%
  }

  const calories = Math.round(tdee * (goalMultiplier[goal] || 0.82))

  // Proteína (evidencia científica por objetivo, g/kg peso corporal)
  const proteinPerKg: Record<string, number> = {
    perdida:      2.4,
    definicion:   2.2,
    mantenimiento: 1.8,
    volumen:      2.0,
  }
  const protein = Math.round(weight * (proteinPerKg[goal] || 2.2))

  // Grasa: mínimo 0.8g/kg, máx 30% calorías
  const fatMin = Math.round(weight * 0.8)
  const fatMax = Math.round((calories * 0.28) / 9)
  const fat = Math.max(fatMin, Math.min(fatMax, Math.round(weight * 1.0)))

  // Carbohidratos: calorías restantes
  const remainingCals = calories - (protein * 4) - (fat * 9)
  const carbs = Math.max(0, Math.round(remainingCals / 4))

  return {
    calories,
    protein,
    fat,
    carbs,
    deficit: Math.round(tdee - calories),
  }
}

// ───────────────────────────────────────────────────────────────────────────

export async function analyzBodyAndGenerateDiet(params: {
  weight: number
  height: number
  waist?: number
  hips?: number
  chest?: number
  arms?: number
  goal: string
  age?: number
  sex?: string
  activityLevel?: string
  previousCheckIn?: {
    weight: number
    bodyScore: number
    analysis: string
    createdAt: string
  } | null
  frontPhotoBase64?: string
  sidePhotoBase64?: string
  frontPhotoMime?: string
  sidePhotoMime?: string
  freeTextContext?: string | null
  preferences?: {
    trainingDays?: number | null
    cardioTime?: string | null
    equipment?: string | null
    likedExercises?: string[]
    dislikedExercises?: string[]
    trainingNotes?: string | null
    dietNotes?: string | null
  } | null
}) {
  const {
    weight, height, waist, hips, chest, arms, goal,
    age, sex, activityLevel, previousCheckIn,
    frontPhotoBase64, sidePhotoBase64, frontPhotoMime, sidePhotoMime,
    freeTextContext, preferences,
  } = params

  const bmi = (weight / ((height / 100) ** 2)).toFixed(1)

  // Pre-calcular TDEE y macros si tenemos los datos necesarios
  const hasTDEEData = age && sex && activityLevel
  const tdee = hasTDEEData
    ? calcularTDEE({ weight, height, age: age!, sex: sex!, activityLevel: activityLevel! })
    : null
  const macros = tdee
    ? calcularMacros(tdee, weight, goal)
    : null

  const goalLabels: Record<string, string> = {
    definicion:    'definición muscular (reducir grasa conservando músculo)',
    volumen:       'ganar masa muscular (superávit calórico controlado)',
    mantenimiento: 'mantenimiento del peso y composición actual',
    perdida:       'pérdida de peso significativa (déficit agresivo pero sostenible)',
  }

  const activityLabels: Record<string, string> = {
    sedentario: 'Sedentario (oficina, sin ejercicio)',
    ligero:     'Ligero (1–2 días/semana)',
    moderado:   'Moderado (3–4 días/semana)',
    activo:     'Activo (5–6 días/semana)',
    atletico:   'Atlético (doble sesión / competición)',
  }

  const systemPrompt = `Eres el mejor nutricionista deportivo y entrenador personal del mundo. Llevas 20 años trabajando con atletas de élite y personas que quieren transformar su cuerpo.

Tu dieta es REAL, PRÁCTICA y CIENTÍFICAMENTE PRECISA. Especificas gramos exactos de cada alimento. Tus planes son los que realmente funcionan porque son detallados y adaptados a cada persona.

Reglas estrictas:
1. SIEMPRE especifica gramos exactos (ej: "150g pechuga de pollo", "80g arroz en seco", "2 huevos enteros + 3 claras")
2. SIEMPRE respeta los macros calculados (±5% de tolerancia)
3. Los alimentos son reales, fáciles de comprar en supermercados de España (Mercadona, Lidl, Aldi) y económicos
4. El plan de comidas encaja con el horario de entrenamiento
5. Si hay intolerancias, alimentos odiados o preferencias del usuario, los respetas al 100%
6. Tu análisis es directo, honesto y motivador — sin rodeos
7. VARIEDAD: no repitas la misma proteína principal dos días consecutivos (ej: si lunes es pollo, martes no puede ser pollo)
8. Incluye siempre un día de trampa semanal (cheat meal) donde el usuario come libre sin restricciones
9. Genera la lista de la compra semanal con gramos exactos para 7 días
10. Respondes SOLO en español`

  const userPrompt = `Genera el plan completo para este usuario.

═══ DATOS BIOMÉTRICOS ═══
Peso: ${weight} kg | Altura: ${height} cm | IMC: ${bmi}
${waist ? `Cintura: ${waist} cm` : ''}${hips ? ` | Caderas: ${hips} cm` : ''}${chest ? ` | Pecho: ${chest} cm` : ''}${arms ? ` | Brazos: ${arms} cm` : ''}
Objetivo: ${goalLabels[goal] || goal}
${age ? `Edad: ${age} años` : ''}${sex ? ` | Sexo: ${sex === 'mujer' ? 'Mujer' : 'Hombre'}` : ''}${activityLevel ? ` | Actividad: ${activityLabels[activityLevel] || activityLevel}` : ''}

${tdee && macros ? `═══ CÁLCULO TDEE (Mifflin-St Jeor) ═══
TDEE calculado: ${tdee} kcal/día
Objetivo calórico: ${macros.calories} kcal/día (${macros.deficit > 0 ? `déficit de ${macros.deficit} kcal` : `superávit de ${Math.abs(macros.deficit)} kcal`})
Proteína objetivo: ${macros.protein}g (${(macros.protein / weight).toFixed(1)}g/kg)
Grasa objetivo: ${macros.fat}g
Carbohidratos objetivo: ${macros.carbs}g

IMPORTANTE: El plan de comidas DEBE sumar exactamente ${macros.calories} kcal con ${macros.protein}g proteína, ${macros.carbs}g carbs y ${macros.fat}g grasa.` : ''}

${previousCheckIn ? `═══ EVOLUCIÓN (vs check-in del ${new Date(previousCheckIn.createdAt).toLocaleDateString('es-ES')}) ═══
Peso anterior: ${previousCheckIn.weight} kg → Ahora: ${weight} kg (${(weight - previousCheckIn.weight) > 0 ? '+' : ''}${(weight - previousCheckIn.weight).toFixed(1)} kg)
Body Score anterior: ${previousCheckIn.bodyScore}
Análisis anterior: "${previousCheckIn.analysis}"

Ajusta el plan teniendo en cuenta esta evolución. Si perdió peso, valida y ajusta. Si no progresó, identifica posibles causas y corrige.` : '═══ PRIMER CHECK-IN ═══\nEstablece línea base. Sé especialmente preciso en la evaluación inicial.'}

${preferences ? `═══ PREFERENCIAS DEL USUARIO ═══
${preferences.trainingDays ? `Días de entrenamiento: ${preferences.trainingDays}/semana` : ''}
${preferences.cardioTime ? `Cardio: ${preferences.cardioTime}` : ''}
${preferences.equipment ? `Equipamiento: ${preferences.equipment}` : ''}
${preferences.dislikedExercises?.length ? `Ejercicios EXCLUIDOS (no incluir): ${preferences.dislikedExercises.join(', ')}` : ''}
${preferences.trainingNotes ? `Notas de entrenamiento: ${preferences.trainingNotes}` : ''}
${preferences.dietNotes ? `Preferencias/intolerancias alimentarias: ${preferences.dietNotes}` : ''}` : ''}

${freeTextContext ? `═══ CONTEXTO ADICIONAL DEL USUARIO ═══
El usuario ha escrito lo siguiente sobre su vida, horarios, gustos y situación personal. Tenlo muy en cuenta al crear el plan:

"${freeTextContext}"` : ''}

${frontPhotoBase64 || sidePhotoBase64 ? '═══ ANÁLISIS VISUAL ═══\nAnaliza las fotos adjuntas con precisión clínica: distribución de grasa, retención de agua visible, tono muscular, postura, zonas de acumulación. Compara con check-in anterior si existe.' : ''}

═══ FORMATO DE RESPUESTA ═══
Responde ÚNICAMENTE con este JSON exacto (sin markdown, sin texto adicional):

{
  "bodyScore": <0-1000, basado en composición corporal, progreso y adherencia>,
  "rank": <"BRONCE"|"PLATA"|"ORO"|"PLATINO"|"DIAMANTE"|"LEYENDA">,
  "analysis": "<3-4 frases. Directo, personalizado, menciona datos específicos del usuario. Si hay progreso, reconócelo. Si hay problemas, nómbralos.>",
  "progressSummary": "<Qué cambió respecto al check-in anterior y por qué. Si es el primero, evaluación inicial detallada.>",
  "calories": ${macros?.calories || '<kcal calculadas>'},
  "protein": ${macros?.protein || '<gramos>'},
  "carbs": ${macros?.carbs || '<gramos>'},
  "fat": ${macros?.fat || '<gramos>'},
  "tdee": ${tdee || '<tdee calculado>'},
  "diet": {
    "antesDesayuno": ["<item con gramos exactos>"],
    "desayuno": {
      "opcionA": ["<150g X>", "<80g Y en seco>", "<cantidad Z>"],
      "opcionB": ["<item>", "<item>"],
      "opcionC": ["<item>", "<item>"]
    },
    "mediaManana": {
      "opcionA": ["<item>"],
      "opcionB": ["<item>"]
    },
    "almuerzo": {
      "opcionA": ["<item>", "<item>", "<item>"],
      "opcionB": ["<item>", "<item>"],
      "opcionC": ["<item>", "<item>"]
    },
    "merienda": {
      "opcionA": ["<item>"],
      "opcionB": ["<item>"]
    },
    "cena": {
      "opcionA": ["<item>", "<item>", "<item>"],
      "opcionB": ["<item>", "<item>"],
      "opcionC": ["<item>", "<item>"]
    },
    "antesDeCormir": ["<item opcional si el objetivo lo requiere>"]
  },
  "mealCalories": {
    "desayuno": <kcal>,
    "mediaManana": <kcal>,
    "almuerzo": <kcal>,
    "merienda": <kcal>,
    "cena": <kcal>
  },
  "training": {
    "dias": <número>,
    "tipo": "<descripción concisa del tipo de entrenamiento>",
    "rutina": [
      {
        "dia": "Día 1",
        "nombre": "<nombre del día>",
        "ejercicios": [
          {"nombre": "<ejercicio>", "series": <n>, "reps": "<reps o tiempo>", "descanso": "<segundos>"}
        ]
      }
    ]
  },
  "supplements": ["<suplemento con dosis y momento exacto>"],
  "tips": ["<tip específico y accionable, no genérico>", "<tip>", "<tip>"],
  "weeklyPlan": "<resumen del plan semanal: cómo distribuir las comidas los días de entreno vs descanso en 2-3 frases>",
  "cheatDay": "<día de la semana para la comida libre y descripción, ej: 'Sábado — cena libre sin restricciones'>",
  "dietVarietyNotes": "<cómo varía la proteína principal cada día para evitar monotonía, ej: 'Lun/Mié/Vie: pollo, Mar/Jue: ternera, Sáb: salmón'>",
  "shoppingList": [
    { "item": "<nombre del alimento>", "weeklyGrams": <gramos para 7 días como número>, "category": "<Proteína|Carbohidratos|Verdura|Fruta|Lácteo|Grasa|Otro>" }
  ],
  "badges": []
}`

  const messages: Anthropic.MessageParam[] = []

  if (frontPhotoBase64 || sidePhotoBase64) {
    const content: Anthropic.ContentBlockParam[] = []
    if (frontPhotoBase64) {
      const mime = (frontPhotoMime || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      content.push({ type: 'image', source: { type: 'base64', media_type: mime, data: frontPhotoBase64 } })
    }
    if (sidePhotoBase64) {
      const mime = (sidePhotoMime || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      content.push({ type: 'image', source: { type: 'base64', media_type: mime, data: sidePhotoBase64 } })
    }
    content.push({ type: 'text', text: userPrompt })
    messages.push({ role: 'user', content })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const hasPhotos = !!(frontPhotoBase64 || sidePhotoBase64)

  const response = await anthropic.messages.create({
    model: hasPhotos ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001',
    max_tokens: 6000,
    system: systemPrompt,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo parsear la respuesta de la IA')

  const result = JSON.parse(jsonMatch[0])

  // Validar y corregir macros si se desviaron demasiado
  if (macros) {
    const tolerance = 0.08 // 8%
    if (Math.abs(result.calories - macros.calories) / macros.calories > tolerance) {
      result.calories = macros.calories
    }
    if (Math.abs(result.protein - macros.protein) / macros.protein > tolerance) {
      result.protein = macros.protein
    }
  }

  return result
}
