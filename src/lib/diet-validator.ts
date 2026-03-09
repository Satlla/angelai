/**
 * Diet structure and macro validators for automated testing.
 */

export function validateDietStructure(diet: Record<string, unknown>): string[] {
  const errors: string[] = []

  const requiredKeys = ['antesDesayuno', 'desayuno', 'mediaManana', 'comida', 'merienda', 'cena']
  for (const key of requiredKeys) {
    if (!(key in diet)) {
      errors.push(`Missing required diet key: ${key}`)
    }
  }

  // desayuno, comida, cena must have opcionA, opcionB, opcionC — each a non-empty array
  const mealsWithOptions = ['desayuno', 'comida', 'cena']
  for (const meal of mealsWithOptions) {
    const mealData = diet[meal]
    if (!mealData || typeof mealData !== 'object' || Array.isArray(mealData)) {
      errors.push(`${meal} must be an object with opcionA/opcionB/opcionC`)
      continue
    }
    const mealObj = mealData as Record<string, unknown>
    for (const option of ['opcionA', 'opcionB', 'opcionC']) {
      if (!Array.isArray(mealObj[option])) {
        errors.push(`${meal}.${option} must be an array`)
      } else if ((mealObj[option] as unknown[]).length === 0) {
        errors.push(`${meal}.${option} must be a non-empty array`)
      }
    }
  }

  return errors
}

export function validateMacros(
  result: { calories: number; protein: number; carbs: number; fat: number },
  targets: { calories: number; protein: number; carbs: number; fat: number }
): string[] {
  const errors: string[] = []
  const tolerance = 0.10

  const fields = ['calories', 'protein', 'carbs', 'fat'] as const
  for (const field of fields) {
    const actual = result[field]
    const target = targets[field]
    if (target === 0) continue
    const deviation = Math.abs(actual - target) / target
    if (deviation > tolerance) {
      errors.push(
        `${field}: actual ${actual} deviates more than 10% from target ${target} (deviation: ${(deviation * 100).toFixed(1)}%)`
      )
    }
  }

  return errors
}

export function validateShoppingList(list: unknown[]): string[] {
  const errors: string[] = []

  if (!Array.isArray(list) || list.length === 0) {
    errors.push('shoppingList must be a non-empty array')
    return errors
  }

  list.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`shoppingList[${index}] must be an object`)
      return
    }
    const obj = item as Record<string, unknown>
    if (typeof obj.item !== 'string' || obj.item.trim() === '') {
      errors.push(`shoppingList[${index}].item must be a non-empty string`)
    }
    if (typeof obj.weeklyGrams !== 'number') {
      errors.push(`shoppingList[${index}].weeklyGrams must be a number`)
    }
    if (typeof obj.category !== 'string' || obj.category.trim() === '') {
      errors.push(`shoppingList[${index}].category must be a non-empty string`)
    }
  })

  return errors
}

export function validateTraining(training: { dias: number; rutina: unknown[] }): string[] {
  const errors: string[] = []

  if (!training || typeof training !== 'object') {
    errors.push('training must be an object')
    return errors
  }

  if (typeof training.dias !== 'number' || training.dias <= 0) {
    errors.push('training.dias must be a positive number')
  }

  if (!Array.isArray(training.rutina) || training.rutina.length === 0) {
    errors.push('training.rutina must be a non-empty array')
  }

  return errors
}
