import { describe, expect, it } from 'vitest'
import { validateReviewResult } from '../reviewTypes'

const validReviewResult = {
  id: 'review_123',
  reviewedAt: '2026-06-29T12:00:00Z',
  totalScore: 72,
  maxScore: 100,
  tier: 'competitive',
  categories: [
    {
      key: 'open_source',
      label: 'Open Source',
      score: 18,
      maxScore: 25,
      evidence: ['Maintains a public project.'],
      suggestions: ['Link to the most relevant repository.'],
    },
  ],
  strengths: ['Clear technical ownership.'],
  improvements: ['Quantify production impact.'],
  bonuses: [
    {
      label: 'Strong project depth',
      points: 3,
      evidence: 'Project includes tests and deployment notes.',
    },
  ],
  deductions: [
    {
      label: 'Missing metrics',
      points: -2,
    },
  ],
  annotations: [
    {
      id: 'annotation_1',
      categoryKey: 'technical_skills',
      sectionTitle: 'Projects',
      entryTitle: 'Presume',
      bulletText: 'Built a resume editor.',
      message: 'This evidence supports the technical skills score.',
      severity: 'strong',
    },
  ],
}

describe('validateReviewResult', () => {
  it('accepts a fully valid review result', () => {
    expect(validateReviewResult(validReviewResult)).toEqual(validReviewResult)
  })

  it('rejects missing required fields', () => {
    const { id: _id, ...missingId } = validReviewResult

    expect(validateReviewResult(missingId)).toBeNull()
  })

  it('rejects invalid enum values', () => {
    expect(
      validateReviewResult({ ...validReviewResult, tier: 'excellent' })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        categories: [{ ...validReviewResult.categories[0], key: 'education' }],
      })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        annotations: [
          { ...validReviewResult.annotations[0], severity: 'critical' },
        ],
      })
    ).toBeNull()
  })

  it('rejects non-string arrays for strengths and improvements', () => {
    expect(
      validateReviewResult({ ...validReviewResult, strengths: ['ok', 1] })
    ).toBeNull()
    expect(
      validateReviewResult({ ...validReviewResult, improvements: [false] })
    ).toBeNull()
  })

  it('rejects non-finite numeric values', () => {
    expect(
      validateReviewResult({ ...validReviewResult, totalScore: NaN })
    ).toBeNull()
    expect(
      validateReviewResult({ ...validReviewResult, maxScore: Infinity })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        categories: [
          { ...validReviewResult.categories[0], score: -Infinity },
        ],
      })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        categories: [{ ...validReviewResult.categories[0], maxScore: NaN }],
      })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        bonuses: [{ ...validReviewResult.bonuses[0], points: Infinity }],
      })
    ).toBeNull()
  })

  it('rejects malformed category objects', () => {
    expect(
      validateReviewResult({
        ...validReviewResult,
        categories: [
          {
            ...validReviewResult.categories[0],
            evidence: ['valid', { text: 'invalid' }],
          },
        ],
      })
    ).toBeNull()
  })

  it('rejects malformed adjustment objects', () => {
    expect(
      validateReviewResult({
        ...validReviewResult,
        bonuses: [{ ...validReviewResult.bonuses[0], points: '3' }],
      })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        deductions: [{ ...validReviewResult.deductions[0], evidence: 2 }],
      })
    ).toBeNull()
  })

  it('rejects malformed annotation objects', () => {
    expect(
      validateReviewResult({
        ...validReviewResult,
        annotations: [
          { ...validReviewResult.annotations[0], categoryKey: 'education' },
        ],
      })
    ).toBeNull()
    expect(
      validateReviewResult({
        ...validReviewResult,
        annotations: [{ ...validReviewResult.annotations[0], message: null }],
      })
    ).toBeNull()
  })

  it('strips unknown fields from normalized objects', () => {
    const result = validateReviewResult({
      ...validReviewResult,
      ignored: true,
      categories: [{ ...validReviewResult.categories[0], ignored: true }],
      bonuses: [{ ...validReviewResult.bonuses[0], ignored: true }],
      deductions: [{ ...validReviewResult.deductions[0], ignored: true }],
      annotations: [{ ...validReviewResult.annotations[0], ignored: true }],
    })

    expect(result).toEqual(validReviewResult)
  })

  it('preserves optional raw output', () => {
    const raw = { provider: 'hiring-agent', score: { total: 72 } }

    expect(validateReviewResult({ ...validReviewResult, raw })).toEqual({
      ...validReviewResult,
      raw,
    })
  })
})
