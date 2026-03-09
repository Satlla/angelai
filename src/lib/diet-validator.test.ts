import { describe, it, expect } from 'vitest'
import {
  validateDietStructure,
  validateMacros,
  validateShoppingList,
  validateTraining,
} from './diet-validator'

// ─── validateDietStructure ────────────────────────────────────────────────────

describe('validateDietStructure', () => {
  const validDiet = {
    antesDesayuno: ['300ml agua'],
    desayuno: {
      opcionA: ['80g avena', '200g yogur griego'],
      opcionB: ['2 huevos', '2 tostadas integrales'],
      opcionC: ['1 scoop whey', '1 plátano', '30g copos avena'],
    },
    mediaManana: {
      opcionA: ['30g nueces', '200g yogur griego 0%'],
      opcionB: ['2 tortitas de arroz', '100g requesón'],
      opcionC: ['1 manzana', '150g cottage cheese'],
    },
    comida: {
      opcionA: ['180g pechuga de pollo', '200g brócoli', '80g arroz integral'],
      opcionB: ['200g merluza', '250g judías verdes', '80g pasta integral'],
      opcionC: ['150g ternera', '200g pimientos asados', '200g patata cocida'],
    },
    merienda: {
      opcionA: ['200g yogur griego 0%', '20g almendras'],
      opcionB: ['100g requesón', 'frutos rojos'],
      opcionC: ['30g nueces', '1 manzana'],
    },
    cena: {
      opcionA: ['180g salmón al horno', '300g espinacas', '10g AOVE'],
      opcionB: ['200g pechuga de pavo', '200g coliflor', '80g quinoa'],
      opcionC: ['150g atún a la plancha', '250g calabacín', '80g arroz blanco'],
    },
    antesDeCormir: [],
  }

  it('returns no errors for a valid diet', () => {
    const errors = validateDietStructure(validDiet)
    expect(errors).toHaveLength(0)
  })

  it('returns error when desayuno is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { desayuno, ...dietWithout } = validDiet
    const errors = validateDietStructure(dietWithout as Record<string, unknown>)
    expect(errors.some(e => e.includes('desayuno'))).toBe(true)
  })

  it('returns error when comida is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { comida, ...dietWithout } = validDiet
    const errors = validateDietStructure(dietWithout as Record<string, unknown>)
    expect(errors.some(e => e.includes('comida'))).toBe(true)
  })

  it('returns error when cena is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cena, ...dietWithout } = validDiet
    const errors = validateDietStructure(dietWithout as Record<string, unknown>)
    expect(errors.some(e => e.includes('cena'))).toBe(true)
  })

  it('returns error when desayuno.opcionA is empty', () => {
    const diet = {
      ...validDiet,
      desayuno: { ...validDiet.desayuno, opcionA: [] },
    }
    const errors = validateDietStructure(diet as unknown as Record<string, unknown>)
    expect(errors.some(e => e.includes('desayuno.opcionA'))).toBe(true)
  })

  it('returns error when comida.opcionB is missing', () => {
    const diet = {
      ...validDiet,
      comida: { opcionA: validDiet.comida.opcionA, opcionC: validDiet.comida.opcionC },
    }
    const errors = validateDietStructure(diet as unknown as Record<string, unknown>)
    expect(errors.some(e => e.includes('comida.opcionB'))).toBe(true)
  })

  it('returns error when meal is an array instead of object', () => {
    const diet = { ...validDiet, desayuno: ['wrong'] }
    const errors = validateDietStructure(diet as unknown as Record<string, unknown>)
    expect(errors.some(e => e.includes('desayuno'))).toBe(true)
  })
})

// ─── validateMacros ───────────────────────────────────────────────────────────

describe('validateMacros', () => {
  const targets = { calories: 2000, protein: 180, carbs: 200, fat: 60 }

  it('returns no errors when macros are within 10%', () => {
    const result = { calories: 2000, protein: 180, carbs: 200, fat: 60 }
    expect(validateMacros(result, targets)).toHaveLength(0)
  })

  it('returns no errors at exactly 10% deviation', () => {
    const result = { calories: 2200, protein: 198, carbs: 220, fat: 66 }
    expect(validateMacros(result, targets)).toHaveLength(0)
  })

  it('returns error when calories exceed 10% tolerance', () => {
    const result = { calories: 2300, protein: 180, carbs: 200, fat: 60 }
    const errors = validateMacros(result, targets)
    expect(errors.some(e => e.includes('calories'))).toBe(true)
  })

  it('returns error when protein is below 10% tolerance', () => {
    const result = { calories: 2000, protein: 150, carbs: 200, fat: 60 }
    const errors = validateMacros(result, targets)
    expect(errors.some(e => e.includes('protein'))).toBe(true)
  })

  it('returns multiple errors for multiple deviations', () => {
    const result = { calories: 2500, protein: 100, carbs: 300, fat: 100 }
    const errors = validateMacros(result, targets)
    expect(errors.length).toBeGreaterThan(1)
  })
})

// ─── validateShoppingList ─────────────────────────────────────────────────────

describe('validateShoppingList', () => {
  const validList = [
    { item: 'Pechuga de pollo', weeklyGrams: 1050, category: 'Proteína' },
    { item: 'Arroz integral', weeklyGrams: 560, category: 'Carbohidratos' },
    { item: 'Brócoli', weeklyGrams: 700, category: 'Verdura' },
  ]

  it('returns no errors for a valid shopping list', () => {
    expect(validateShoppingList(validList)).toHaveLength(0)
  })

  it('returns error for empty list', () => {
    const errors = validateShoppingList([])
    expect(errors.length).toBeGreaterThan(0)
  })

  it('returns error when item field is missing', () => {
    const list = [{ weeklyGrams: 500, category: 'Proteína' }]
    const errors = validateShoppingList(list)
    expect(errors.some(e => e.includes('item'))).toBe(true)
  })

  it('returns error when weeklyGrams is not a number', () => {
    const list = [{ item: 'Pollo', weeklyGrams: '500', category: 'Proteína' }]
    const errors = validateShoppingList(list)
    expect(errors.some(e => e.includes('weeklyGrams'))).toBe(true)
  })

  it('returns error when category is missing', () => {
    const list = [{ item: 'Pollo', weeklyGrams: 500 }]
    const errors = validateShoppingList(list)
    expect(errors.some(e => e.includes('category'))).toBe(true)
  })

  it('returns error for non-array input', () => {
    const errors = validateShoppingList(null as unknown as unknown[])
    expect(errors.length).toBeGreaterThan(0)
  })
})

// ─── validateTraining ─────────────────────────────────────────────────────────

describe('validateTraining', () => {
  const validTraining = {
    dias: 4,
    rutina: [
      {
        dia: 'Día 1',
        nombre: 'Pecho + Tríceps',
        ejercicios: [
          { nombre: 'Press banca', series: 4, reps: '8-10', descanso: '90s' },
        ],
      },
    ],
  }

  it('returns no errors for valid training', () => {
    expect(validateTraining(validTraining)).toHaveLength(0)
  })

  it('returns error when dias is 0', () => {
    const errors = validateTraining({ ...validTraining, dias: 0 })
    expect(errors.some(e => e.includes('dias'))).toBe(true)
  })

  it('returns error when dias is negative', () => {
    const errors = validateTraining({ ...validTraining, dias: -1 })
    expect(errors.some(e => e.includes('dias'))).toBe(true)
  })

  it('returns error when rutina is empty', () => {
    const errors = validateTraining({ ...validTraining, rutina: [] })
    expect(errors.some(e => e.includes('rutina'))).toBe(true)
  })

  it('returns error when training is not an object', () => {
    const errors = validateTraining(null as unknown as { dias: number; rutina: unknown[] })
    expect(errors.length).toBeGreaterThan(0)
  })
})
