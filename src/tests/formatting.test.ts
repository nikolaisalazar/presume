import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONSTRAINTS } from '../constraints'
import {
  computeResumeFit,
  hasBulletWarning,
  type ResumeFitMeasurements,
} from '../formatting'
import type { Resume } from '../types'

function makeResume(bulletsBySection: string[][]): Resume {
  return {
    name: 'Test',
    contact: [],
    sections: bulletsBySection.map((bullets, sectionIndex) => ({
      title: `Section ${sectionIndex}`,
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

describe('computeResumeFit', () => {
  it('returns the largest fitting global scale', () => {
    const measurements: ResumeFitMeasurements = {
      measureBulletLines: () => 1,
      measurePageHeight: scale => (scale <= 1.25 ? 1056 : 1200),
    }

    const result = computeResumeFit(
      makeResume([['short']]),
      DEFAULT_CONSTRAINTS,
      measurements
    )

    expect(result.globalScale).toBeGreaterThanOrEqual(1.249)
    expect(result.globalScale).toBeLessThanOrEqual(1.25)
    expect(result.warnings).toEqual({ globalOverflow: false, bullets: [] })
  })

  it('limits global scale when a satisfiable bullet crosses its line threshold', () => {
    const result = computeResumeFit(
      makeResume([['candidate-limited']]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines: (text, scale) => {
          if (text !== 'candidate-limited') return 1
          return scale <= 1.3 ? 1 : 2
        },
        measurePageHeight: () => 1056,
      }
    )

    expect(result.globalScale).toBeGreaterThanOrEqual(1.299)
    expect(result.globalScale).toBeLessThanOrEqual(1.3)
    expect(result.warnings).toEqual({ globalOverflow: false, bullets: [] })
    expect(hasBulletWarning(result.warnings, 0, 0, 0)).toBe(false)
  })

  it('keeps the minimum scale and identifies an impossible bullet structurally', () => {
    const constraints = {
      ...DEFAULT_CONSTRAINTS,
      maxLinesPerBullet: 2,
      minFontSize: 7,
    }
    const measurements: ResumeFitMeasurements = {
      measureBulletLines: text => (text === 'impossible' ? 3 : 1),
      measurePageHeight: () => 1056,
    }

    const result = computeResumeFit(
      makeResume([['impossible', 'fine']]),
      constraints,
      measurements
    )

    expect(result.globalScale).toBe(0.7)
    expect(result.warnings).toEqual({
      globalOverflow: false,
      bullets: [{ sectionIndex: 0, entryIndex: 0, bulletIndex: 0 }],
    })
    expect(hasBulletWarning(result.warnings, 0, 0, 0)).toBe(true)
    expect(hasBulletWarning(result.warnings, 0, 0, 1)).toBe(false)
  })

  it('warns when the page overflows at minimum scale', () => {
    const result = computeResumeFit(
      makeResume([['short']]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines: () => 1,
        measurePageHeight: () => 1056.6,
      }
    )

    expect(result.globalScale).toBe(DEFAULT_CONSTRAINTS.minFontSize / 10)
    expect(result.warnings).toEqual({ globalOverflow: true, bullets: [] })
  })

  it('does not measure empty bullets', () => {
    const measureBulletLines = vi.fn(() => 99)

    const result = computeResumeFit(
      makeResume([['', '']]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines,
        measurePageHeight: () => 1056,
      }
    )

    expect(measureBulletLines).not.toHaveBeenCalled()
    expect(result.globalScale).toBeGreaterThanOrEqual(1.999)
    expect(result.globalScale).toBeLessThanOrEqual(2)
    expect(result.warnings).toEqual({ globalOverflow: false, bullets: [] })
  })

  it('reports ordered warning locations across multiple sections and entries', () => {
    const resume = makeResume([['first']])
    resume.sections[0].entries.push({
      title: '',
      subtitle: '',
      location: '',
      dateRange: '',
      bullets: ['second impossible', 'fine'],
    })
    resume.sections.push({
      title: 'Section 1',
      entries: [
        {
          title: '',
          subtitle: '',
          location: '',
          dateRange: '',
          bullets: ['third impossible'],
        },
      ],
    })

    const result = computeResumeFit(resume, DEFAULT_CONSTRAINTS, {
      measureBulletLines: text => (text.includes('impossible') ? 2 : 1),
      measurePageHeight: () => 1056,
    })

    expect(result.warnings.bullets).toEqual([
      { sectionIndex: 0, entryIndex: 1, bulletIndex: 0 },
      { sectionIndex: 1, entryIndex: 0, bulletIndex: 0 },
    ])
  })

  it('accepts exactly 0.5px of page-height tolerance', () => {
    const result = computeResumeFit(
      makeResume([]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines: () => 1,
        measurePageHeight: () => 1056.5,
      }
    )

    expect(result.warnings.globalOverflow).toBe(false)
    expect(result.globalScale).toBeGreaterThanOrEqual(1.999)
  })

  it('rejects page overflow beyond the 0.5px tolerance', () => {
    const result = computeResumeFit(
      makeResume([]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines: () => 1,
        measurePageHeight: () => 1056.5001,
      }
    )

    expect(result.warnings.globalOverflow).toBe(true)
    expect(result.globalScale).toBe(DEFAULT_CONSTRAINTS.minFontSize / 10)
  })

  it('never grows beyond the maximum scale of 2.0', () => {
    const observedScales: number[] = []
    const result = computeResumeFit(
      makeResume([['short']]),
      DEFAULT_CONSTRAINTS,
      {
        measureBulletLines: (_text, scale) => {
          observedScales.push(scale)
          return 1
        },
        measurePageHeight: scale => {
          observedScales.push(scale)
          return 1
        },
      }
    )

    expect(result.globalScale).toBeGreaterThanOrEqual(1.999)
    expect(result.globalScale).toBeLessThanOrEqual(2)
    expect(Math.max(...observedScales)).toBeLessThanOrEqual(2)
  })

  it('preserves its resume and constraints input objects', () => {
    const resume = makeResume([['short']])
    const constraints = { ...DEFAULT_CONSTRAINTS }
    const resumeSnapshot = structuredClone(resume)
    const constraintsSnapshot = structuredClone(constraints)

    computeResumeFit(resume, constraints, {
      measureBulletLines: () => 1,
      measurePageHeight: () => 1056,
    })

    expect(resume).toEqual(resumeSnapshot)
    expect(constraints).toEqual(constraintsSnapshot)
  })
})
