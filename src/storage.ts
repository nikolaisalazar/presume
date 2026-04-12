import type { Constraints, Resume } from './types'
import { validateResume, validateConstraints } from './types'

const RESUME_KEY = 'presume:resume'
const CONSTRAINTS_KEY = 'presume:constraints'

export function saveResume(resume: Resume): void {
  localStorage.setItem(RESUME_KEY, JSON.stringify(resume))
}

export function loadResume(): Resume | null {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    return validateResume(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveConstraints(constraints: Constraints): void {
  localStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(constraints))
}

export function loadConstraints(): Constraints | null {
  try {
    const raw = localStorage.getItem(CONSTRAINTS_KEY)
    if (!raw) return null
    return validateConstraints(JSON.parse(raw))
  } catch {
    return null
  }
}
