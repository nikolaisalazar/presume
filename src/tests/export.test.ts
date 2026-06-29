import { describe, expect, it } from 'vitest'
import { getPdfPageSlices } from '../export'

describe('getPdfPageSlices', () => {
  it('returns one slice for one Letter-height canvas', () => {
    expect(getPdfPageSlices(850, 1100)).toEqual([
      { sourceY: 0, sourceHeight: 1100 },
    ])
  })

  it('returns multiple slices for a multi-page canvas', () => {
    expect(getPdfPageSlices(850, 2420)).toEqual([
      { sourceY: 0, sourceHeight: 1100 },
      { sourceY: 1100, sourceHeight: 1100 },
      { sourceY: 2200, sourceHeight: 220 },
    ])
  })

  it('rejects invalid dimensions', () => {
    expect(() => getPdfPageSlices(0, 1100)).toThrow(
      'Canvas dimensions must be positive.'
    )
    expect(() => getPdfPageSlices(850, 0)).toThrow(
      'Canvas dimensions must be positive.'
    )
  })
})
