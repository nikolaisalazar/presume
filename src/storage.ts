import type { Constraints, Resume } from './types'
import { DEFAULT_CONSTRAINTS, parseConstraints } from './constraints'
import { validateResume } from './types'
import { DEFAULT_RESUME } from './defaultResume'
import type { DocumentData } from './document'

const RESUME_KEY = 'presume:resume'
const CONSTRAINTS_KEY = 'presume:constraints'
export type WriteResult = { status: 'saved' } | { status: 'unsaved'; reason: 'unavailable' | 'quota' | 'write-failed' }
export type LegacyRead = {
  data: DocumentData
  status: 'sample' | 'saved' | 'recovery'
  reason?: 'read-failed' | 'invalid'
  raw?: { resume: string | null; constraints: string | null }
}
export const sampleDocument = (): DocumentData => ({ resume: DEFAULT_RESUME, constraints: DEFAULT_CONSTRAINTS })

/** Transitional only: two keys, no transaction or cross-tab protection. Removed by T2-4. */
export function readTransitionalDocument(): LegacyRead {
  try {
    const storage = window.localStorage
    const raw = { resume: storage.getItem(RESUME_KEY), constraints: storage.getItem(CONSTRAINTS_KEY) }
    const parse = (value: string | null): unknown => { try { return value === null ? null : JSON.parse(value) } catch { return null } }
    const resume = validateResume(parse(raw.resume))
    const constraints = parseConstraints(parse(raw.constraints))
    const data = { resume: resume ?? DEFAULT_RESUME, constraints: constraints ?? DEFAULT_CONSTRAINTS }
    if ((raw.resume !== null && !resume) || (raw.constraints !== null && !constraints)) {
      return { data, status: 'recovery', reason: 'invalid', raw }
    }
    // Missing settings use the documented legacy defaults. Never write on discovery.
    return { data, status: resume ? 'saved' : 'sample', raw }
  } catch {
    return { data: sampleDocument(), status: 'recovery', reason: 'read-failed' }
  }
}

function caughtWrite(write: (storage: Storage) => void): WriteResult {
  try { write(window.localStorage); return { status: 'saved' } } catch (error) {
    const name = error instanceof Error || error instanceof DOMException ? error.name : ''
    return { status: 'unsaved', reason: name === 'QuotaExceededError' ? 'quota' : name === 'SecurityError' ? 'unavailable' : 'write-failed' }
  }
}
export function writeTransitionalDocument(data: DocumentData): WriteResult {
  return caughtWrite(storage => {
    storage.setItem(RESUME_KEY, JSON.stringify(data.resume))
    storage.setItem(CONSTRAINTS_KEY, JSON.stringify(data.constraints))
  })
}
// Kept for independent legacy consumers/tests; all production document writes use the pair above.
export function saveResume(resume: Resume): WriteResult { return caughtWrite(storage => storage.setItem(RESUME_KEY, JSON.stringify(resume))) }
export function saveConstraints(constraints: Constraints): WriteResult { return caughtWrite(storage => storage.setItem(CONSTRAINTS_KEY, JSON.stringify(constraints))) }
export function loadResume(): Resume | null {
  try { return validateResume(JSON.parse(window.localStorage.getItem(RESUME_KEY) ?? 'null')) } catch { return null }
}
export function loadConstraints(): Constraints | null {
  try { return parseConstraints(JSON.parse(window.localStorage.getItem(CONSTRAINTS_KEY) ?? 'null')) } catch { return null }
}
