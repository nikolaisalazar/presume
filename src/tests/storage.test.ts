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

  it.each([
    { maxPages: 0, maxLinesPerBullet: 2, minFontSize: 9 },
    { maxPages: 2, maxLinesPerBullet: 11, minFontSize: 9 },
    { maxPages: 2, maxLinesPerBullet: 2, minFontSize: 3 },
    { maxPages: 1.5, maxLinesPerBullet: 2, minFontSize: 9 },
    { maxPages: 2, maxLinesPerBullet: 2 },
  ])('returns null when stored constraints are semantically invalid: %o', value => {
    localStorage.setItem(CONSTRAINTS_KEY, JSON.stringify(value))
    expect(loadConstraints()).toBeNull()
  })

  it('strips unknown fields from valid stored constraints', () => {
    localStorage.setItem(
      CONSTRAINTS_KEY,
      JSON.stringify({ ...mockConstraints, ignored: true })
    )

    expect(loadConstraints()).toEqual(mockConstraints)
  })
})

describe('transitional document safeguards', () => {
  it('distinguishes missing, malformed and method-denied reads without writing', async () => {
    const { readTransitionalDocument } = await import('../storage')
    const set = vi.spyOn(Storage.prototype, 'setItem')
    expect(readTransitionalDocument().status).toBe('sample')
    expect(set).not.toHaveBeenCalled()
    localStorage.setItem(RESUME_KEY, '{bad')
    const read = readTransitionalDocument()
    expect(read.status).toBe('recovery')
    expect(read.reason).toBe('invalid')
    expect(read.raw?.resume).toBe('{bad')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(readTransitionalDocument()).toMatchObject({ status: 'recovery', reason: 'read-failed' })
  })
  it('catches the storage getter in both theme startup and document discovery/writes', async () => {
    const { readTransitionalDocument, writeTransitionalDocument, sampleDocument } = await import('../storage')
    const { initializeTheme } = await import('../theme')
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError') } })
    try {
      expect(() => initializeTheme()).not.toThrow()
      expect(readTransitionalDocument()).toMatchObject({ status: 'recovery', reason: 'read-failed' })
      expect(writeTransitionalDocument(sampleDocument())).toEqual({ status: 'unsaved', reason: 'unavailable' })
    } finally { Object.defineProperty(window, 'localStorage', descriptor) }
  })
  it('reports a second-key failure without claiming a complete save', async () => {
    const { writeTransitionalDocument, sampleDocument } = await import('../storage')
    const set = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === CONSTRAINTS_KEY) throw new DOMException('quota', 'QuotaExceededError')
      set.call(this, key, value)
    })
    expect(writeTransitionalDocument(sampleDocument())).toEqual({ status: 'unsaved', reason: 'quota' })
    expect(loadResume()).toEqual(sampleDocument().resume)
    expect(loadConstraints()).toBeNull()
  })
})
