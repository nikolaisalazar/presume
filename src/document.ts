import { parseConstraints, type Constraints } from './constraints'
import { validateResume, type Resume } from './types'

/** Portable document data. Layout measurements, history and Review are excluded. */
export type DocumentData = {
  resume: Resume
  constraints: Constraints
}

export function parseDocumentData(value: unknown): DocumentData | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  const resume = validateResume(data.resume)
  const constraints = parseConstraints(data.constraints)
  return resume && constraints ? { resume, constraints } : null
}
