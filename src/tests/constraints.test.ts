import { describe, expect, it } from 'vitest'
import {
  CONSTRAINT_LIMITS,
  DEFAULT_CONSTRAINTS,
  parseConstraints,
  updateConstraint,
} from '../constraints'

describe('formatting constraints', () => {
  it('accepts the defaults and exact inclusive bounds', () => {
    expect(parseConstraints(DEFAULT_CONSTRAINTS)).toEqual(DEFAULT_CONSTRAINTS)
    expect(parseConstraints({
      maxPages: CONSTRAINT_LIMITS.maxPages.max,
      maxLinesPerBullet: CONSTRAINT_LIMITS.maxLinesPerBullet.max,
      minFontSize: CONSTRAINT_LIMITS.minFontSize.min,
    })).toEqual({ maxPages: 10, maxLinesPerBullet: 10, minFontSize: 4 })
  })

  it.each([
    { maxPages: 0, maxLinesPerBullet: 1, minFontSize: 8 },
    { maxPages: 11, maxLinesPerBullet: 1, minFontSize: 8 },
    { maxPages: 1.5, maxLinesPerBullet: 1, minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: 0, minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: 11, minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: 1.5, minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: 1, minFontSize: 3 },
    { maxPages: 1, maxLinesPerBullet: 1, minFontSize: 17 },
    { maxPages: 1, maxLinesPerBullet: 1, minFontSize: 8.5 },
    { maxPages: Number.NaN, maxLinesPerBullet: 1, minFontSize: 8 },
    { maxPages: Number.POSITIVE_INFINITY, maxLinesPerBullet: 1, minFontSize: 8 },
  ])('rejects invalid semantic values: %o', value => {
    expect(parseConstraints(value)).toBeNull()
  })

  it.each([
    null,
    [],
    {},
    { maxPages: 1, maxLinesPerBullet: 1 },
    { maxPages: '1', maxLinesPerBullet: 1, minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: '1', minFontSize: 8 },
    { maxPages: 1, maxLinesPerBullet: 1, minFontSize: '8' },
  ])('rejects invalid structures and types: %o', value => {
    expect(parseConstraints(value)).toBeNull()
  })

  it('strips unknown fields from valid persisted data', () => {
    expect(parseConstraints({ ...DEFAULT_CONSTRAINTS, ignored: true })).toEqual(
      DEFAULT_CONSTRAINTS
    )
  })

  it('clamps user updates and preserves unrelated values', () => {
    expect(updateConstraint(DEFAULT_CONSTRAINTS, 'maxPages', 99)).toEqual({
      ...DEFAULT_CONSTRAINTS,
      maxPages: 10,
    })
    expect(updateConstraint(DEFAULT_CONSTRAINTS, 'minFontSize', -1)).toEqual({
      ...DEFAULT_CONSTRAINTS,
      minFontSize: 4,
    })
    expect(
      updateConstraint(DEFAULT_CONSTRAINTS, 'maxPages', Number.NaN)
    ).toBe(DEFAULT_CONSTRAINTS)
  })
})
