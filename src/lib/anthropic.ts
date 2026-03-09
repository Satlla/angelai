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
  currentDiet?: string | null
  currentTraining?: string | null
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
    freeTextContext, currentDiet, currentTraining, preferences,
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

DISTRIBUCIÓN CALÓRICA POR COMIDA (obligatoria):
4. Desayuno: ~25% de las calorías diarias
5. Media mañana: ~10% de las calorías diarias
6. Comida: ~30% de las calorías diarias
7. Merienda: ~10% de las calorías diarias
8. Cena: ~25% de las calorías diarias

TIMING DE CARBOHIDRATOS:
9. Días de entrenamiento: mayor proporción de carbohidratos en las comidas pre y post entreno (comida o cena según horario)
10. Días de descanso: reducir carbohidratos totales un 15–20%, compensar con más verduras y grasa de calidad
11. Post-entreno inmediato (dentro de 90 min): priorizar carbohidratos de absorción rápida + proteína rápida (ej: arroz blanco + whey o plátano + yogur griego)

OBJETIVOS DE PROTEÍNA POR COMIDA:
12. Desayuno, comida y cena: MÍNIMO 30g de proteína neta por toma
13. Media mañana y merienda: MÍNIMO 15g de proteína neta por toma
14. antesDeCormir (solo en volumen): OBLIGATORIO — 150g requesón o 1 scoop caseína (proteína de liberación lenta). Para otros objetivos: opcional, solo si el déficit proteico lo requiere

MÉTODOS DE COCCIÓN (siempre especificar):
15. Usa: al horno, a la plancha, al vapor, hervido, en papillote
16. NUNCA frito en abundante aceite
17. Aceite de oliva virgen extra: máximo 1 cucharada (10g) por comida. Especifica la cantidad exacta

HIDRATACIÓN:
18. Indica siempre: mínimo 35ml por kg de peso corporal al día
19. Añade al menos 500ml extra los días de entrenamiento intenso
20. Incluir en tips o suplementación: "Beber [X] litros de agua al día (35ml × [peso] kg)"

VARIEDAD (el error más grave en dietas IA es la monotonía):
21. MÍNIMO 15 alimentos distintos por semana — sin excepción
22. La proteína principal NO puede repetirse dos días seguidos. Rota: pollo → salmón → ternera → huevos → merluza → atún → pavo
23. Pescado azul (salmón, atún, caballa, sardinas) MÍNIMO 2 veces por semana
24. Legumbres (lentejas, garbanzos, alubias) MÍNIMO 1 vez por semana
25. Cada comida principal tiene SIEMPRE 3 opciones distintas (opcionA, opcionB, opcionC)
26. Media mañana y merienda tienen SIEMPRE 3 opciones distintas (opcionA, opcionB, opcionC)

VERDURAS (especificación obligatoria):
27. Mínimo 400g/día de verduras en PESO CRUDO — distribuidas en comida y cena
28. Variedad de colores: MÍNIMO 3 colores distintos en la semana (verde, rojo/naranja, blanco/amarillo)
29. Crucíferas (brócoli, coliflor, coles de Bruselas, repollo) MÍNIMO 2 veces por semana
30. NUNCA escribir solo "verduras" — especifica siempre qué verdura y cuántos gramos en crudo

FRUTA:
31. 2–3 piezas/día variadas (no solo manzana y naranja — incluye kiwi, frutos rojos, plátano, etc.)
32. Preferiblemente por la mañana o post-entreno (aprovecha el pico de insulina)
33. Evitar fruta después de las 19:00 salvo que el entreno sea nocturno

CARBOHIDRATOS — FUENTES VARIADAS (rota, no siempre arroz):
34. Usa estas fuentes de carbohidratos rotando a lo largo de la semana:
    - Pasta (espaguetis, macarrones, penne) — perfecta para comida o post-entreno: 80g en seco = ~280 kcal
    - Arroz blanco o integral — post-entreno ideal
    - Avena — desayuno perfecto
    - Patata o batata — comida o cena
    - Pan integral 100% — desayuno o merienda
    - Legumbres (lentejas, garbanzos) — aportan también proteína
    - Quinoa — alternativa sin gluten
35. NO uses siempre arroz — la pasta es igual de válida y más variada y sabrosa
36. Pasta: especifica "80g pasta integral en seco" o "80g espaguetis en seco" + salsa saludable (ej: tomate natural, pesto ligero, sin nata)

CALIDAD NUTRICIONAL:
37. Fibra mínima: 25g/día — usa avena, legumbres, verduras, frutas, pasta integral
38. Grasas de calidad: frutos secos, aguacate, salmón, huevos — no solo aceite de oliva
39. El desayuno SIEMPRE incluye fibra (avena, pan integral real, fruta) y proteína de calidad

CHEAT MEAL:
37. Solo 1 cheat meal por semana (NO 3). Una cena libre, no un día libre entero
38. Contextualiza: "Sábado — cena libre. Disfrútala, no compenses el domingo"

SUPLEMENTACIÓN:
39. Omega 3: 1–2g EPA+DHA/día (NO 3g). Preferible de pescado azul natural
40. Whey protein: úsalo POST-ENTRENAMIENTO o para completar proteína diaria — NUNCA asociado al cheat meal
41. Solo recomienda suplementos con evidencia científica sólida (creatina, whey, omega3, vitamina D si déficit)

CALIDAD POR COMIDA:
42. antesDesayuno: SOLO si hay razón deportiva o médica clara. Ejemplos válidos: "Vaso de agua + 5g creatina monohidrato" o "300ml agua en ayunas". Si no aplica claramente, devuelve array vacío []
43. Desayuno: SIEMPRE proteína real + carbohidrato con fibra. Ejemplo: "80g avena + 200g yogur griego 0% + 1 plátano + 1 scoop whey". NUNCA solo café
44. Comida/Cena: SIEMPRE proteína (≥30g netos) + verduras (≥200g en crudo, especificadas) + carbohidrato complejo + método de cocción. Ejemplos:
    - "180g salmón al horno + 250g brócoli al vapor + 80g arroz integral en seco + 10g AOVE"
    - "150g pechuga de pollo a la plancha + 200g espinacas salteadas + 80g espaguetis integrales en seco + salsa de tomate natural"
    - "200g merluza al vapor + 250g judías verdes + 80g macarrones en seco + 10g AOVE"
    - "150g ternera a la plancha + 200g pimiento rojo asado + 200g patata cocida + tomate"
45. Media mañana/Merienda: snacks con ≥15g proteína. Ejemplo: "30g nueces + 200g yogur griego 0% (17g proteína)" o "2 tortitas de arroz + 100g requesón + frutos rojos"

ULTRA-PROCESADOS PROHIBIDOS:
46. Nunca incluyas barritas de proteína procesadas (salvo whey en polvo) como fuente proteica principal
47. Nunca incluyas fiambres procesados (salchichas, mortadela, chopped) como fuente proteica principal
48. El embutido permitido como complemento ocasional: jamón serrano, pavo en lonchas natural (máximo 1 vez/semana)

ERRORES PROHIBIDOS (nunca hagas esto):
❌ Café cortado como única ingesta matutina o como antesDesayuno
❌ "Ensalada" o "verduras" sin especificar los ingredientes exactos con gramos en crudo
❌ Repetir el mismo alimento proteico más de 2 días seguidos
❌ Menos de 3 verduras distintas en la semana
❌ Whey protein en el cheat meal
❌ Omega 3 en dosis de 3g
❌ Un solo alimento en una comida principal sin acompañamiento
❌ Fritar en aceite (usar siempre métodos saludables)
❌ Más de 10g aceite por comida sin especificar
❌ Fruta después de las 19:00 (salvo entreno nocturno)
❌ Barritas o fiambres procesados como proteína principal
❌ antesDeCormir vacío en objetivo volumen

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

${currentDiet ? `═══ DIETA ACTUAL DEL USUARIO ═══
El usuario ya lleva una dieta. Analízala, identifica sus puntos fuertes y débiles, y úsala como referencia para diseñar la nueva. Adapta el nuevo plan a sus preferencias y hábitos alimentarios actuales, mejorando lo que sea necesario para alcanzar su objetivo:

${currentDiet}` : ''}

${currentTraining ? `═══ ENTRENAMIENTO ACTUAL DEL USUARIO ═══
El usuario ya tiene una rutina de entrenamiento. Analízala y úsala como referencia para diseñar la nueva rutina. Respeta su nivel, los grupos musculares que trabaja y los ejercicios que conoce, mejorando la estructura si es necesario para su objetivo:

${currentTraining}` : ''}

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
      "opcionB": ["<item>"],
      "opcionC": ["<item>"]
    },
    "comida": {
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
    "comida": <kcal>,
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
