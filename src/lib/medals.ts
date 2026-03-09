/**
 * Sistema de medallas AngelAI — cualitativo + cuantitativo
 *
 * La clave: el "recorrido" (distancia al objetivo) amplifica el mérito.
 * Alguien que necesita perder 25kg y pierde 5kg hace MÁS MÉRITO relativo
 * que alguien que solo necesita perder 2kg.
 */

export const MEDALS = {
  INICIO: {
    id: 'INICIO',
    emoji: '🌱',
    name: 'Inicio',
    color: '#4CAF50',
    description: 'Has dado el primer paso. El viaje ha comenzado.',
    requirement: 'Completa tu primer check-in',
    rarity: 'Común',
  },
  BRONCE: {
    id: 'BRONCE',
    emoji: '🥉',
    name: 'Bronce',
    color: '#CD7F32',
    description: 'Primera semana de disciplina completada. La constancia empieza aquí.',
    requirement: '7 días respondiendo el cuestionario diario',
    rarity: 'Común',
  },
  PLATA: {
    id: 'PLATA',
    emoji: '🥈',
    name: 'Plata',
    color: '#C0C0C0',
    description: 'Dos semanas de compromiso real. La IA confirma tu progreso.',
    requirement: '15 días + progreso verificado en check-in quincenal',
    rarity: 'Poco común',
  },
  ORO: {
    id: 'ORO',
    emoji: '🥇',
    name: 'Oro',
    color: '#FFD700',
    description: 'Un mes de disciplina. Estás donde muchos no llegan.',
    requirement: '30 días + 40% del objetivo conseguido',
    rarity: 'Raro',
  },
  PLATINO: {
    id: 'PLATINO',
    emoji: '💎',
    name: 'Platino',
    color: '#E5E4E2',
    description: 'Nivel de élite. Tu cuerpo está respondiendo al esfuerzo.',
    requirement: '45 días + 70% del objetivo conseguido',
    rarity: 'Muy raro',
  },
  DIAMANTE: {
    id: 'DIAMANTE',
    emoji: '🔮',
    name: 'Diamante',
    color: '#00D9F5',
    description: 'Has conseguido tu objetivo. Pocos llegan hasta aquí.',
    requirement: 'Objetivo completado + 60 días de disciplina',
    rarity: 'Épico',
  },
  LEYENDA: {
    id: 'LEYENDA',
    emoji: '👑',
    name: 'Leyenda',
    color: '#FFB800',
    description: 'El pináculo. Objetivo conseguido y mantenido. Eres una inspiración.',
    requirement: 'Diamante + 30 días de mantenimiento exitoso',
    rarity: 'Legendario',
  },
} as const

export type MedalId = keyof typeof MEDALS

/**
 * Calcula qué medalla le corresponde al usuario basándose en:
 * - daysSinceStart: días desde el primer check-in
 * - dailyLogStreak: racha de días con cuestionario respondido
 * - progressPercent: % del objetivo conseguido (calculado por IA)
 * - totalDailyLogs: total de cuestionarios respondidos
 * - recorrido: distancia total al objetivo (peso a perder/ganar)
 * - currentMedal: medalla actual (no se puede bajar de medalla salvo leyenda→diamante)
 */
export function calcularMedalla(params: {
  daysSinceStart: number
  totalDailyLogs: number
  progressPercent: number       // 0-100
  recorrido: 'alto' | 'medio' | 'bajo'  // cuánto le falta conseguir
  objectiveReached: boolean
  maintenanceOk: boolean        // ¿lleva 30 días en mantenimiento tras objetivo?
  currentMedal?: string | null
}): MedalId {
  const { daysSinceStart, totalDailyLogs, progressPercent, recorrido, objectiveReached, maintenanceOk } = params

  // Factor de recorrido: si tenía mucho por recorrer, los umbrales son un poco más fáciles
  const factor = recorrido === 'alto' ? 0.80 : recorrido === 'medio' ? 1.0 : 1.20

  if (maintenanceOk && objectiveReached) return 'LEYENDA'
  if (objectiveReached && daysSinceStart >= Math.round(60 * factor)) return 'DIAMANTE'
  if (progressPercent >= 70 && daysSinceStart >= Math.round(45 * factor) && totalDailyLogs >= Math.round(30 * factor)) return 'PLATINO'
  if (progressPercent >= 40 && daysSinceStart >= Math.round(30 * factor) && totalDailyLogs >= Math.round(20 * factor)) return 'ORO'
  if (progressPercent >= 15 && totalDailyLogs >= Math.round(15 * factor)) return 'PLATA'
  if (totalDailyLogs >= Math.round(7 * factor)) return 'BRONCE'

  return 'INICIO'
}

/**
 * Calcula el % de progreso hacia el objetivo de forma cualitativa.
 * No es solo "kilos perdidos" sino también disciplina diaria.
 */
export function calcularProgreso(params: {
  initialWeight: number
  currentWeight: number
  targetWeightChange: number  // positivo = ganar, negativo = perder
  avgDietScore: number        // media de cuestionarios (0-100)
  totalDailyLogs: number
}): number {
  const { initialWeight, currentWeight, targetWeightChange, avgDietScore, totalDailyLogs } = params

  if (targetWeightChange === 0) {
    // Mantenimiento: solo disciplina
    return Math.min(100, Math.round(avgDietScore * 0.7 + Math.min(totalDailyLogs, 30) / 30 * 30))
  }

  const weightProgress = Math.abs(currentWeight - initialWeight) / Math.abs(targetWeightChange)
  const disciplineBonus = (avgDietScore / 100) * 0.25 + Math.min(totalDailyLogs, 30) / 30 * 0.1

  return Math.min(100, Math.round((weightProgress + disciplineBonus) * 100))
}

/**
 * Clasifica el recorrido del usuario según cuánto le falta conseguir.
 */
export function clasificarRecorrido(weightToChange: number): 'alto' | 'medio' | 'bajo' {
  const abs = Math.abs(weightToChange)
  if (abs >= 15) return 'alto'
  if (abs >= 5) return 'medio'
  return 'bajo'
}
