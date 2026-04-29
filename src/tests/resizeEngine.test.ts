import { describe, it, expect } from 'vitest'
import { binarySearchFontSize, getImpossibleBulletKeys, checkBulletsFitAtScale } from '../useResizeEngine'
import type { Resume } from '../types'

// ── Helpers ────────────────────────────────────────────────────────

/** Minimal resume factory for tests. */
function makeResume(bulletsBySection: string[][]): Resume {
  return {
    name: 'Test',
    contact: [],
    sections: bulletsBySection.map((bullets, sIdx) => ({
      title: `Section ${sIdx}`,
      entries: [
        {
          title: '',
          subtitle: '',
          location: '',
          dateRange: '',
          bullets,
        },
      ],
    })),
  }
}

// ── binarySearchFontSize ───────────────────────────────────────────

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

// ── getImpossibleBulletKeys ────────────────────────────────────────

describe('getImpossibleBulletKeys', () => {
  it('returns an empty set when all bullets fit', () => {
    const resume = makeResume([['short bullet', 'another short one']])
    // Pretend everything measures as 1 line.
    const keys = getImpossibleBulletKeys(resume, () => 1, 2)
    expect(keys.size).toBe(0)
  })

  it('returns keys for bullets that overflow', () => {
    // Section 0, entry 0: bullet 0 fits (1 line), bullet 1 overflows (3 lines)
    const resume = makeResume([['fits', 'overflows']])
    const measureLines = (text: string) => (text === 'overflows' ? 3 : 1)
    const keys = getImpossibleBulletKeys(resume, measureLines, 2)
    expect(keys.size).toBe(1)
    expect(keys.has('bullet-0-0-1')).toBe(true)
  })

  it('identifies impossible bullets across multiple sections', () => {
    const resume = makeResume([
      ['fine'],            // section 0
      ['also fine', 'too long'],  // section 1
    ])
    const measureLines = (text: string) => (text === 'too long' ? 5 : 1)
    const keys = getImpossibleBulletKeys(resume, measureLines, 2)
    expect(keys.size).toBe(1)
    expect(keys.has('bullet-1-0-1')).toBe(true)
  })

  it('ignores empty bullet strings', () => {
    const resume = makeResume([['', 'real bullet']])
    // measureLines should never be called with an empty string
    const keys = getImpossibleBulletKeys(resume, () => 99, 1)
    // Only 'real bullet' is non-empty, so only it is flagged
    expect(keys.has('bullet-0-0-0')).toBe(false)
    expect(keys.has('bullet-0-0-1')).toBe(true)
  })
})

// ── checkBulletsFitAtScale ─────────────────────────────────────────

describe('checkBulletsFitAtScale', () => {
  it('returns true when all bullets fit', () => {
    const resume = makeResume([['a', 'b']])
    const result = checkBulletsFitAtScale(resume, 1.0, new Set(), 2, () => 1)
    expect(result).toBe(true)
  })

  it('returns false when a satisfiable bullet overflows', () => {
    const resume = makeResume([['too long']])
    // 3 lines > maxLinesPerBullet=2
    const result = checkBulletsFitAtScale(resume, 1.0, new Set(), 2, () => 3)
    expect(result).toBe(false)
  })

  it('skips impossible bullets so they cannot force a false result', () => {
    const resume = makeResume([['impossible', 'fine']])
    const impossibleKeys = new Set(['bullet-0-0-0'])
    // 'impossible' always measures as 5 lines, 'fine' measures as 1 line
    const measureLines = (text: string, _scale: number) =>
      text === 'impossible' ? 5 : 1
    const result = checkBulletsFitAtScale(resume, 1.0, impossibleKeys, 2, measureLines)
    // 'impossible' is skipped; 'fine' fits → should return true
    expect(result).toBe(true)
  })

  it('still returns false when a satisfiable (non-impossible) bullet overflows', () => {
    const resume = makeResume([['impossible', 'also overflows']])
    const impossibleKeys = new Set(['bullet-0-0-0'])
    // 'also overflows' is NOT in impossibleKeys but still measures 3 lines
    const measureLines = (_text: string, _scale: number) => 3
    const result = checkBulletsFitAtScale(resume, 1.0, impossibleKeys, 2, measureLines)
    expect(result).toBe(false)
  })
})

// ── Regression: impossible bullet must not collapse global scale ───

describe('regression: impossible bullet does not force scale to minScale', () => {
  /**
   * Simulates the scale-search logic used in useResizeEngine without touching
   * the DOM. We inject:
   *  - a measureLines mock that knows which bullets are impossible
   *  - a fake page-height check that always passes (page fits at all scales)
   *
   * We then verify that the chosen finalScale is above minScale even though
   * one bullet can never fit within maxLinesPerBullet.
   */
  it('chooses a scale above minScale when an impossible bullet exists but the page fits', () => {
    const MIN_SCALE = 0.7
    const MAX_SCALE = 2.0
    const MAX_LINES = 2

    // One impossible bullet (always 3 lines at any scale), one normal bullet
    // (fits at 1 line when scale >= 1.0, overflows at 2 lines when scale < 1.0).
    const resume = makeResume([['impossible', 'normal']])

    const measureLines = (text: string, scale: number): number => {
      if (text === 'impossible') return 3        // always overflows
      return scale >= 1.0 ? 1 : 2               // 'normal': fits at scale>=1, overflows below
    }

    // Pre-compute impossible keys at minScale (mirrors what the hook does).
    const impossibleKeys = getImpossibleBulletKeys(
      resume,
      text => measureLines(text, MIN_SCALE),
      MAX_LINES
    )

    // 'impossible' should be the only impossible bullet.
    expect(impossibleKeys.has('bullet-0-0-0')).toBe(true)
    expect(impossibleKeys.has('bullet-0-0-1')).toBe(false)

    // fitsAtScale: page always fits; only check satisfiable bullets.
    const fitsAtScale = (scale: number): boolean =>
      checkBulletsFitAtScale(resume, scale, impossibleKeys, MAX_LINES, measureLines)

    // Run the same binary search the hook uses.
    const finalScale = binarySearchFontSize(
      scale => (fitsAtScale(scale) ? 1 : 2),
      MIN_SCALE,
      MAX_SCALE,
      1,
      0.001,
      30
    )

    // The chosen scale should be well above minScale.
    // 'normal' fits at scale>=1.0, so the search should converge near 1.0.
    expect(finalScale).toBeGreaterThan(MIN_SCALE + 0.1)
    expect(finalScale).toBeGreaterThanOrEqual(1.0 - 0.01)
  })

  it('still produces a warning for the impossible bullet', () => {
    const MIN_SCALE = 0.7
    const MAX_LINES = 2
    const resume = makeResume([['impossible', 'normal']])
    const measureLines = (text: string): number =>
      text === 'impossible' ? 3 : 1

    const impossibleKeys = getImpossibleBulletKeys(resume, measureLines, MAX_LINES)

    // The warning pass copies impossibleKeys into newWarnings.
    const newWarnings = new Map<string, boolean>()
    impossibleKeys.forEach(key => newWarnings.set(key, true))

    expect(newWarnings.get('bullet-0-0-0')).toBe(true)
    expect(newWarnings.has('bullet-0-0-1')).toBe(false)

    void MIN_SCALE // silence unused-variable lint
  })
})
