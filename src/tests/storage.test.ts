import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadResume, saveResume, loadConstraints, saveConstraints } from '../storage'
import type { Resume, Constraints } from '../types'

const RESUME_KEY = 'presume:resume'
const CONSTRAINTS_KEY = 'presume:constraints'

const mockResume: Resume = {
  name: 'Test User',
  contact: ['test@example.com'],
  sections: [],
}

const mockConstraints: Constraints = {
  maxPages: 2,
  maxLinesPerBullet: 2,
  minFontSize: 9,
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('saveResume / loadResume', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadResume()).toBeNull()
  })

  it('round-trips a resume through localStorage', () => {
    saveResume(mockResume)
    expect(loadResume()).toEqual(mockResume)
  })

  it('returns null when stored data is invalid JSON', () => {
    localStorage.setItem(RESUME_KEY, '{invalid json')
    expect(loadResume()).toBeNull()
  })

  it('returns null when stored data fails validation', () => {
    localStorage.setItem(RESUME_KEY, JSON.stringify({ badField: true }))
    expect(loadResume()).toBeNull()
  })
})

describe('saveConstraints / loadConstraints', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadConstraints()).toBeNull()
  })

  it('round-trips constraints through localStorage', () => {
    saveConstraints(mockConstraints)
    expect(loadConstraints()).toEqual(mockConstraints)
  })

  it('returns null when stored constraints are invalid JSON', () => {
    localStorage.setItem(CONSTRAINTS_KEY, '{invalid json')
    expect(loadConstraints()).toBeNull()
  })
})
