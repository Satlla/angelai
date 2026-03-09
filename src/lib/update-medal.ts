import { prisma } from './prisma'
import { calcularMedalla, calcularProgreso, clasificarRecorrido } from './medals'

/**
 * Recalcula la medalla del usuario y actualiza user.currentMedal si cambió.
 * Llamar tras cada check-in y cada daily log.
 */
export async function actualizarMedalla(userId: string): Promise<string | null> {
  const [user, checkIns, dailyLogStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { currentMedal: true },
    }),
    prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { weight: true, bodyScore: true, goal: true, createdAt: true },
    }),
    prisma.dailyLog.aggregate({
      where: { userId },
      _count: { id: true },
      _avg: { dietScore: true },
    }),
  ])

  if (!user || checkIns.length === 0) return null

  const first = checkIns[0]
  const latest = checkIns[checkIns.length - 1]

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(first.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const totalDailyLogs = dailyLogStats._count.id
  const avgDietScore = dailyLogStats._avg.dietScore ?? 0

  // Estimar cambio de peso objetivo según goal
  const goal = latest.goal
  const weightChange = latest.weight - first.weight
  // Para definición queremos perder; para volumen ganar; para mantenimiento 0
  const targetWeightChange =
    goal === 'volumen' ? Math.abs(first.weight) * 0.05   // +5% peso inicial
    : goal === 'mantenimiento' ? 0
    : -(first.weight * 0.10)                              // -10% peso inicial (definición)

  const progressPercent = calcularProgreso({
    initialWeight: first.weight,
    currentWeight: latest.weight,
    targetWeightChange,
    avgDietScore,
    totalDailyLogs,
  })

  const recorrido = clasificarRecorrido(targetWeightChange)

  const objectiveReached =
    goal === 'mantenimiento'
      ? totalDailyLogs >= 30
      : Math.abs(weightChange) >= Math.abs(targetWeightChange) * 0.95

  // Mantenimiento exitoso: objetivo alcanzado y 30 días más de daily logs
  const maintenanceOk = objectiveReached && totalDailyLogs >= 60 && daysSinceStart >= 90

  const newMedal = calcularMedalla({
    daysSinceStart,
    totalDailyLogs,
    progressPercent,
    recorrido,
    objectiveReached,
    maintenanceOk,
    currentMedal: user.currentMedal,
  })

  if (newMedal !== user.currentMedal) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentMedal: newMedal, medalUpdatedAt: new Date() },
    })
  }

  return newMedal
}
