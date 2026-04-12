import { describe, it, expect } from 'vitest'
import { binarySearchFontSize } from '../useResizeEngine'

describe('binarySearchFontSize', () => {
  it('returns hi when measureLines always returns 1 (fits at max size)', () => {
    const result = binarySearchFontSize(
      () => 1,  // always 1 line regardless of size
      8,        // lo (minFontSize)
      10,       // hi (defaultSize)
      1,        // maxLines
      0.5,      // precision
      20        // maxIterations
    )
    // Should converge near hi since measuring always fits
    expect(result).toBeCloseTo(10, 0)
  })

  it('returns lo when measureLines always overflows', () => {
    const result = binarySearchFontSize(
      () => 5,  // always 5 lines, always overflows
      8,
      10,
      1,
      0.5,
      20
    )
    // Nothing fits, so result converges near lo
    expect(result).toBeCloseTo(8, 0)
  })

  it('finds the threshold where fits switches to overflows', () => {
    // Simulate: fits (1 line) at size <= 9, overflows (2 lines) at size > 9
    const measureLines = (fontSize: number) => (fontSize <= 9 ? 1 : 2)
    const result = binarySearchFontSize(measureLines, 8, 10, 1, 0.5, 20)
    // Should converge near 9 (the highest size that fits)
    expect(result).toBeGreaterThanOrEqual(8.5)
    expect(result).toBeLessThanOrEqual(9.5)
  })

  it('respects maxIterations', () => {
    let calls = 0
    binarySearchFontSize(
      () => { calls++; return 2 },
      8, 10, 1, 0.0001, 5  // tiny precision but only 5 iterations
    )
    expect(calls).toBeLessThanOrEqual(5)
  })
})
