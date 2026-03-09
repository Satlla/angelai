import { describe, it, expect } from 'vitest'
import { calcularMedalla, calcularProgreso, clasificarRecorrido } from './medals'

// ─── clasificarRecorrido ───────────────────────────────────────────────────────

describe('clasificarRecorrido', () => {
  it('returns alto for ≥15 kg', () => {
    expect(clasificarRecorrido(15)).toBe('alto')
    expect(clasificarRecorrido(-20)).toBe('alto')
    expect(clasificarRecorrido(25)).toBe('alto')
  })

  it('returns medio for 5–14 kg', () => {
    expect(clasificarRecorrido(5)).toBe('medio')
    expect(clasificarRecorrido(-10)).toBe('medio')
    expect(clasificarRecorrido(14)).toBe('medio')
  })

  it('returns bajo for <5 kg', () => {
    expect(clasificarRecorrido(0)).toBe('bajo')
    expect(clasificarRecorrido(2)).toBe('bajo')
    expect(clasificarRecorrido(-4)).toBe('bajo')
  })
})

// ─── calcularProgreso ─────────────────────────────────────────────────────────

describe('calcularProgreso', () => {
  it('returns 0 when no progress and no logs', () => {
    const result = calcularProgreso({
      initialWeight: 90,
      currentWeight: 90,
      targetWeightChange: -10,
      avgDietScore: 0,
      totalDailyLogs: 0,
    })
    expect(result).toBe(0)
  })

  it('returns 100 when objective fully achieved', () => {
    const result = calcularProgreso({
      initialWeight: 90,
      currentWeight: 80,
      targetWeightChange: -10,
      avgDietScore: 100,
      totalDailyLogs: 30,
    })
    expect(result).toBe(100)
  })

  it('calculates partial weight progress correctly', () => {
    const result = calcularProgreso({
      initialWeight: 90,
      currentWeight: 85,
      targetWeightChange: -10,  // lost 5 of 10 = 50%
      avgDietScore: 0,
      totalDailyLogs: 0,
    })
    expect(result).toBeGreaterThan(40)
    expect(result).toBeLessThan(70)
  })

  it('handles maintenance goal (targetWeightChange = 0)', () => {
    const result = calcularProgreso({
      initialWeight: 80,
      currentWeight: 80,
      targetWeightChange: 0,
      avgDietScore: 80,
      totalDailyLogs: 30,
    })
    expect(result).toBeGreaterThan(50)
    expect(result).toBeLessThanOrEqual(100)
  })

  it('never exceeds 100', () => {
    const result = calcularProgreso({
      initialWeight: 90,
      currentWeight: 60,   // overcorrected
      targetWeightChange: -10,
      avgDietScore: 100,
      totalDailyLogs: 100,
    })
    expect(result).toBe(100)
  })
})

// ─── calcularMedalla ──────────────────────────────────────────────────────────

describe('calcularMedalla', () => {
  const base = {
    daysSinceStart: 0,
    totalDailyLogs: 0,
    progressPercent: 0,
    recorrido: 'medio' as const,
    objectiveReached: false,
    maintenanceOk: false,
    currentMedal: null,
  }

  it('returns INICIO by default', () => {
    expect(calcularMedalla(base)).toBe('INICIO')
  })

  it('returns BRONCE with 7+ daily logs', () => {
    expect(calcularMedalla({ ...base, totalDailyLogs: 7 })).toBe('BRONCE')
    expect(calcularMedalla({ ...base, totalDailyLogs: 10 })).toBe('BRONCE')
  })

  it('returns PLATA with 15+ logs and 15%+ progress', () => {
    expect(calcularMedalla({ ...base, totalDailyLogs: 15, progressPercent: 15 })).toBe('PLATA')
  })

  it('returns ORO with 20+ logs, 30+ days, 40%+ progress', () => {
    expect(calcularMedalla({ ...base, totalDailyLogs: 20, daysSinceStart: 30, progressPercent: 40 })).toBe('ORO')
  })

  it('returns PLATINO with 30+ logs, 45+ days, 70%+ progress', () => {
    expect(calcularMedalla({ ...base, totalDailyLogs: 30, daysSinceStart: 45, progressPercent: 70 })).toBe('PLATINO')
  })

  it('returns DIAMANTE when objective reached and 60+ days', () => {
    expect(calcularMedalla({ ...base, objectiveReached: true, daysSinceStart: 60 })).toBe('DIAMANTE')
  })

  it('returns LEYENDA when objective reached and maintenance ok', () => {
    expect(calcularMedalla({ ...base, objectiveReached: true, maintenanceOk: true, daysSinceStart: 90 })).toBe('LEYENDA')
  })

  it('factor alto lowers thresholds (needs fewer days)', () => {
    // With recorrido=alto, DIAMANTE threshold is 60*0.8=48 days instead of 60
    const altoResult = calcularMedalla({ ...base, objectiveReached: true, daysSinceStart: 50, recorrido: 'alto' })
    const medioResult = calcularMedalla({ ...base, objectiveReached: true, daysSinceStart: 50, recorrido: 'medio' })
    expect(altoResult).toBe('DIAMANTE')
    expect(medioResult).toBe('INICIO') // 50 days not enough for medio (needs 60)
  })

  it('factor bajo raises thresholds', () => {
    // With recorrido=bajo, BRONCE requires Math.round(7*1.2)=9 logs
    const bajoResult = calcularMedalla({ ...base, totalDailyLogs: 7, recorrido: 'bajo' })
    expect(bajoResult).toBe('INICIO') // 7 logs not enough with bajo factor
  })
})
