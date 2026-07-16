export type Constraints = {
  maxPages: number
  maxLinesPerBullet: number
  minFontSize: number
}

export type ConstraintKey = keyof Constraints

export const CONSTRAINT_LIMITS = {
  maxPages: { min: 1, max: 10 },
  maxLinesPerBullet: { min: 1, max: 10 },
  minFontSize: { min: 4, max: 16 },
} as const satisfies Record<ConstraintKey, { min: number; max: number }>

export const DEFAULT_CONSTRAINTS: Constraints = {
  maxPages: 1,
  maxLinesPerBullet: 1,
  minFontSize: 8,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isValidConstraintValue(key: ConstraintKey, value: unknown): value is number {
  const limit = CONSTRAINT_LIMITS[key]
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= limit.min &&
    value <= limit.max
  )
}

export function parseConstraints(data: unknown): Constraints | null {
  if (!isRecord(data)) return null
  if (!isValidConstraintValue('maxPages', data.maxPages)) return null
  if (!isValidConstraintValue('maxLinesPerBullet', data.maxLinesPerBullet)) {
    return null
  }
  if (!isValidConstraintValue('minFontSize', data.minFontSize)) return null
  return {
    maxPages: data.maxPages,
    maxLinesPerBullet: data.maxLinesPerBullet,
    minFontSize: data.minFontSize,
  }
}

export function updateConstraint<K extends ConstraintKey>(
  constraints: Constraints,
  key: K,
  value: number
): Constraints {
  if (!Number.isFinite(value)) return constraints
  const limit = CONSTRAINT_LIMITS[key]
  const nextValue = Math.min(limit.max, Math.max(limit.min, Math.round(value)))
  return { ...constraints, [key]: nextValue }
}
