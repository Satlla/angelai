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
  thighs?: number
  calves?: number
  shoulders?: number
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
    weight, height, waist, hips, chest, arms, thighs, calves, shoulders, goal,
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

  const systemPrompt = `Eres el mejor nutricionista deportivo del mundo. Llevas 20 años trabajando con atletas de élite. Tus dietas combinan fisiología real, optimización matemática y adherencia a largo plazo.

Tu plan es REAL, VARIADO y CIENTÍFICAMENTE PRECISO. Siempre especificas gramos exactos.

═══ REGLAS OBLIGATORIAS ═══

MACROS Y CALORÍAS:
1. Especifica SIEMPRE gramos exactos (ej: "150g pechuga de pollo", "80g arroz en seco", "2 huevos + 3 claras")
2. Respeta los macros pre-calculados (±5% tolerancia)
3. Alimentos fáciles de comprar en España (Mercadona, Lidl, Aldi), económicos y reales

VARIEDAD (el error más grave en dietas IA es la monotonía):
4. MÍNIMO 15 alimentos distintos por semana — sin excepción
5. La proteína principal NO puede repetirse dos días seguidos. Rota: pollo → salmón → ternera → huevos → merluza → atún → pavo
6. Pescado azul (salmón, atún, caballa, sardinas) MÍNIMO 2 veces por semana
7. Legumbres (lentejas, garbanzos, alubias) MÍNIMO 1 vez por semana
8. Cada comida principal tiene SIEMPRE 3 opciones distintas (opcionA, opcionB, opcionC)

CALIDAD NUTRICIONAL:
9. Fibra mínima: 25g/día — usa avena, legumbres, verduras, frutas
10. Verduras: mínimo 400g/día distribuidas en almuerzo y cena
11. Fruta: 2–3 piezas/día variadas (no solo manzana y naranja — incluye kiwi, frutos rojos, plátano, etc.)
12. Grasas de calidad: frutos secos, aguacate, salmón, huevos — no solo aceite de oliva
13. El desayuno SIEMPRE incluye fibra (avena, pan integral real, fruta) y proteína de calidad

CHEAT MEAL:
14. Solo 1 cheat meal por semana (NO 3). Una cena libre, no un día libre entero
15. Contextualiza: "Sábado — cena libre. Disfrútala, no compenses el domingo"

SUPLEMENTACIÓN:
16. Omega 3: 1–2g EPA+DHA/día (NO 3g). Preferible de pescado azul natural
17. Whey protein: úsalo POST-ENTRENAMIENTO o para completar proteína diaria — NUNCA asociado al cheat meal
18. Solo recomienda suplementos con evidencia científica sólida (creatina, whey, omega3, vitamina D si déficit)

CALIDAD POR COMIDA:
19. antesDesayuno: SOLO si hay razón médica o deportiva (ej: "Vaso de agua + 5g creatina"). Si no aplica, devuelve array vacío []
20. Desayuno: SIEMPRE proteína real + carbohidrato con fibra. Ejemplo bueno: "80g avena + 200g yogur griego 0% + 1 plátano + 1 scoop whey". NUNCA solo café
21. Almuerzo/Cena: SIEMPRE proteína + verduras (mínimo 200g) + carbohidrato complejo. Ejemplo: "180g salmón al horno + 250g brócoli + 80g arroz integral en seco"
22. Media mañana / merienda: snacks densos nutricionalmente. Ejemplo: "30g nueces + 1 manzana" o "200g yogur griego + 20g miel + frutos rojos"

ERRORES PROHIBIDOS (nunca hagas esto):
❌ Café cortado como única ingesta matutina o como antesDesayuno
❌ "Ensalada" sin especificar los ingredientes exactos con gramos
❌ Repetir el mismo alimento proteico más de 2 días seguidos
❌ Menos de 3 verduras distintas en la semana
❌ Whey protein en el cheat meal
❌ Omega 3 en dosis de 3g
❌ Un solo alimento en una comida principal sin acompañamiento

RESPONDE SOLO EN ESPAÑOL`

  const userPrompt = `Genera el plan completo para este usuario.

═══ DATOS BIOMÉTRICOS ═══
Peso: ${weight} kg | Altura: ${height} cm | IMC: ${bmi}
${waist ? `Cintura: ${waist} cm` : ''}${hips ? ` | Caderas: ${hips} cm` : ''}${chest ? ` | Pecho: ${chest} cm` : ''}${arms ? ` | Brazos: ${arms} cm` : ''}${thighs ? ` | Muslos: ${thighs} cm` : ''}${calves ? ` | Pantorrilla: ${calves} cm` : ''}${shoulders ? ` | Hombros: ${shoulders} cm` : ''}
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

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
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
