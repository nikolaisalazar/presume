import { useEffect, useMemo, useState } from 'react'
import { prepareWithSegments, measureLineStats } from '@chenglou/pretext'
import type { Constraints, Resume } from './types'
import { RESUME_DOCUMENT } from './resumeDocumentTokens'

// ── Constants ──────────────────────────────────────────────────────
const PAGE_HEIGHT_PX = RESUME_DOCUMENT.pageHeightPx
const COLUMN_WIDTH =
  RESUME_DOCUMENT.pageWidthPx -
  RESUME_DOCUMENT.pageMarginXPx * 2 -
  RESUME_DOCUMENT.bulletIndentPx
const DEFAULT_BULLET_SIZE = RESUME_DOCUMENT.fontSizeBulletPx
const RESUME_FONT = RESUME_DOCUMENT.fontFamily
const MAX_SCALE = 2.0            // maximum --global-scale when scaling up to fill the page

// ── Public types ───────────────────────────────────────────────────
export type Warnings = Map<string, boolean>
export type ResizeEngineResult = {
  warnings: Warnings
  globalScale: number
  isReady: boolean
}

type ResizeMeasurement = {
  key: string
  warnings: Warnings
  globalScale: number
}

// ── Pure helpers (exported for testing) ───────────────────────────

/**
 * Returns the set of bullet keys ("bullet-{s}-{e}-{b}") whose text overflows
 * maxLinesPerBullet when measured by the provided measureLines callback.
 *
 * These are "impossible" bullets — ones that can't be made to fit by shrinking
 * the global scale any further. They should be warned about, and their presence
 * keeps the document at the minimum global scale instead of allowing other
 * content to scale back up independently.
 *
 * @param resume           - the full resume data
 * @param measureLines     - returns line count for a bullet text
 * @param maxLinesPerBullet - the line-count limit
 */
export function getImpossibleBulletKeys(
  resume: Resume,
  measureLines: (text: string) => number,
  maxLinesPerBullet: number
): Set<string> {
  const keys = new Set<string>()
  resume.sections.forEach((section, sIdx) => {
    section.entries.forEach((entry, eIdx) => {
      entry.bullets.forEach((text, bIdx) => {
        if (!text) return
        if (measureLines(text) > maxLinesPerBullet) {
          keys.add(`bullet-${sIdx}-${eIdx}-${bIdx}`)
        }
      })
    })
  })
  return keys
}

/**
 * Returns true if every bullet that is NOT in impossibleKeys fits within
 * maxLinesPerBullet at the given scale, according to measureLines.
 *
 * Impossible bullets are skipped so they cannot drag the global scale down
 * beyond what is already the minimum.
 *
 * @param resume            - the full resume data
 * @param scale             - the candidate global scale to test
 * @param impossibleKeys    - set of bullet keys to skip (already warned elsewhere)
 * @param maxLinesPerBullet - the line-count limit
 * @param measureLines      - returns line count for a bullet text at the given scale
 */
export function checkBulletsFitAtScale(
  resume: Resume,
  scale: number,
  impossibleKeys: Set<string>,
  maxLinesPerBullet: number,
  measureLines: (text: string, scale: number) => number
): boolean {
  for (let sIdx = 0; sIdx < resume.sections.length; sIdx++) {
    const section = resume.sections[sIdx]
    for (let eIdx = 0; eIdx < section.entries.length; eIdx++) {
      const entry = section.entries[eIdx]
      for (let bIdx = 0; bIdx < entry.bullets.length; bIdx++) {
        const text = entry.bullets[bIdx]
        if (!text) continue
        if (impossibleKeys.has(`bullet-${sIdx}-${eIdx}-${bIdx}`)) continue
        if (measureLines(text, scale) > maxLinesPerBullet) return false
      }
    }
  }
  return true
}

// ── Pure helpers (exported for testing) ───────────────────────────

/**
 * Binary search for the highest value in [lo, hi] where
 * measureLines(value) <= maxLines.
 *
 * `low` always tracks the last value that satisfied the constraint.
 * Returns `low` — the largest value that fits — or `lo` if nothing fits.
 *
 * Used for both font-size searches and global-scale searches.
 *
 * @param measureLines  - callback returning a score for a given value
 * @param lo            - minimum value (lower bound, inclusive)
 * @param hi            - starting maximum value (upper bound, inclusive)
 * @param maxLines      - constraint: score must be <= this
 * @param precision     - stop when high - low < precision
 * @param maxIterations - safety cap on iterations
 */
export function binarySearchFontSize(
  measureLines: (fontSize: number) => number,
  lo: number,
  hi: number,
  maxLines: number,
  precision: number,
  maxIterations: number
): number {
  let low = lo
  let high = hi

  for (let i = 0; i < maxIterations; i++) {
    if (high - low < precision) break
    const mid = (low + high) / 2
    const lineCount = measureLines(mid)
    if (lineCount <= maxLines) {
      low = mid   // mid fits — can try higher
    } else {
      high = mid  // mid overflows — try lower
    }
  }

  return low
}

export function chooseFinalGlobalScale({
  minScale,
  maxScale,
  impossibleKeys,
  fitsAtScale,
}: {
  minScale: number
  maxScale: number
  impossibleKeys: Set<string>
  fitsAtScale: (scale: number) => boolean
}): number {
  if (impossibleKeys.size > 0) {
    return minScale
  }

  return binarySearchFontSize(
    scale => (fitsAtScale(scale) ? 1 : 2),
    minScale,
    maxScale,
    1,
    0.001,
    30
  )
}

const PAGE_HEIGHT_TOLERANCE_PX = 0.5
const RESUME_MEASUREMENT_LAYOUT_SCALE = '100'
const RESUME_MEASUREMENT_PRESENTATION_SCALE = '0.01'

export function fitsWithinPageHeight(
  measuredHeight: number,
  pageHeightLimit: number
): boolean {
  return measuredHeight <= pageHeightLimit + PAGE_HEIGHT_TOLERANCE_PX
}

export function withResumeMeasurementScale<T>(
  root: HTMLElement,
  measure: () => T
): T {
  const layoutProperty = '--resume-layout-scale'
  const presentationProperty = '--resume-presentation-scale'
  const previousLayout = root.style.getPropertyValue(layoutProperty)
  const previousPresentation = root.style.getPropertyValue(presentationProperty)

  root.style.setProperty(layoutProperty, RESUME_MEASUREMENT_LAYOUT_SCALE)
  root.style.setProperty(
    presentationProperty,
    RESUME_MEASUREMENT_PRESENTATION_SCALE
  )

  try {
    return measure()
  } finally {
    if (previousLayout) {
      root.style.setProperty(layoutProperty, previousLayout)
    } else {
      root.style.removeProperty(layoutProperty)
    }

    if (previousPresentation) {
      root.style.setProperty(presentationProperty, previousPresentation)
    } else {
      root.style.removeProperty(presentationProperty)
    }
  }
}

// ── Hook ───────────────────────────────────────────────────────────

/**
 * Runs the Pretext-based resize engine after every resume/constraints change.
 *
 * Rather than sizing each bullet independently, this engine finds the single
 * largest --global-scale at which ALL bullets fit within maxLinesPerBullet AND
 * the page stays within the height limit. All font sizes in the resume are
 * defined relative to --global-scale, so every element grows and shrinks
 * together, preserving the typographic hierarchy.
 *
 * Writes --global-scale to document.documentElement and returns both the
 * selected scale and a Warnings map keyed by "bullet-{s}-{e}-{b}" (bullet
 * overflows even at minScale) or "global-overflow" (page overflows even at
 * minScale).
 */
export function useResizeEngine(
  resume: Resume,
  constraints: Constraints,
  pageRef: React.RefObject<HTMLElement | null>
): ResizeEngineResult {
  const measurementKey = useMemo(
    () => JSON.stringify([resume, constraints]),
    [resume, constraints]
  )
  const [measurement, setMeasurement] = useState<ResizeMeasurement | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // Wait for fonts to load so Pretext measurements are accurate.
      await document.fonts.ready
      if (cancelled) return

      const { maxPages, maxLinesPerBullet, minFontSize } = constraints
      const pageHeightLimit = maxPages * PAGE_HEIGHT_PX
      const root = document.documentElement

      const newWarnings = new Map<string, boolean>()

      if (!pageRef.current) return

      // minScale ensures no font renders below minFontSize when global-scale is applied.
      // The smallest base size in the resume is DEFAULT_BULLET_SIZE (contact and bullets),
      // so minScale = minFontSize / DEFAULT_BULLET_SIZE.
      const minScale = minFontSize / DEFAULT_BULLET_SIZE

      // ── Build a Pretext line-count measurer for a given scale ────
      const measureBulletLines = (text: string, scale: number): number => {
        const font = `${DEFAULT_BULLET_SIZE * scale}px '${RESUME_FONT}'`
        const prepared = prepareWithSegments(text, font)
        const { lineCount } = measureLineStats(prepared, COLUMN_WIDTH)
        return lineCount
      }

      // ── Pre-compute impossible bullets at minScale ───────────────
      // A bullet is "impossible" if it still overflows maxLinesPerBullet even at
      // minScale (the smallest the engine will ever go). Such bullets are warned
      // about and keep the global scale at minScale, preserving a consistent
      // document-wide size while respecting the configured minimum font-size floor.
      const impossibleKeys = getImpossibleBulletKeys(
        resume,
        text => measureBulletLines(text, minScale),
        maxLinesPerBullet
      )

      // ── Combined fitness check at a given scale ──────────────────
      // Sets --global-scale as a side effect (required for DOM height measurement),
      // then returns true only if both the page height fits and all satisfiable
      // bullets (those not in impossibleKeys) fit within maxLinesPerBullet.
      const fitsAtScale = (scale: number): boolean => {
        root.style.setProperty('--global-scale', `${scale}`)
        const height = pageRef.current!.getBoundingClientRect().height
        if (!fitsWithinPageHeight(height, pageHeightLimit)) return false
        return checkBulletsFitAtScale(resume, scale, impossibleKeys, maxLinesPerBullet, measureBulletLines)
      }

      // ── Find the largest scale where everything fits ─────────────
      // Binary search across [minScale, MAX_SCALE] when all bullets are
      // satisfiable. If any bullet is impossible at minScale, keep the whole
      // resume at minScale so the line-limit failure is represented at the
      // smallest allowed global font size instead of scaling other content up.
      const { finalScale, heightAtMinScale } =
        withResumeMeasurementScale(root, () => {
          const finalScale = chooseFinalGlobalScale({
            minScale,
            maxScale: MAX_SCALE,
            impossibleKeys,
            fitsAtScale,
          })

          root.style.setProperty('--global-scale', `${minScale}`)
          const heightAtMinScale = pageRef.current!.getBoundingClientRect().height

          root.style.setProperty('--global-scale', `${finalScale}`)
          return { finalScale, heightAtMinScale }
        })

      // The measurement scope restores the live resume presentation variables.
      // Reapply the selected document scale to that live presentation.
      root.style.setProperty('--global-scale', `${finalScale}`)

      if (cancelled) return

      // ── Emit warnings for things that overflow even at minScale ──
      // impossibleKeys was already computed at minScale above — reuse it
      // to avoid re-measuring.
      if (!fitsWithinPageHeight(heightAtMinScale, pageHeightLimit)) {
        newWarnings.set('global-overflow', true)
      }
      impossibleKeys.forEach(key => newWarnings.set(key, true))

      if (!cancelled) {
        setMeasurement({
          key: measurementKey,
          warnings: newWarnings,
          globalScale: finalScale,
        })
      }
    }

    run().catch(console.error)
    return () => { cancelled = true }
    // pageRef is a stable object ref — intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, constraints, measurementKey])

  return {
    warnings: measurement?.warnings ?? new Map(),
    globalScale: measurement?.globalScale ?? 1,
    isReady: measurement?.key === measurementKey,
  }
}
