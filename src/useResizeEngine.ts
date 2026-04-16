import { useEffect, useRef, useState } from 'react'
import { prepareWithSegments, measureLineStats } from '@chenglou/pretext'
import type { Constraints, Resume } from './types'

// ── Constants ──────────────────────────────────────────────────────
// COLUMN_WIDTH = page width (816) - left margin (48) - right margin (48) - bullet indent (16)
// If --page-margin-x or --bullet-indent change in resume.css, update this constant too.
const PAGE_HEIGHT_PX = 1056
const COLUMN_WIDTH = 704
const DEFAULT_BULLET_SIZE = 10  // px, must match --font-size-bullet in resume.css
const RESUME_FONT = 'EB Garamond'
const MAX_SCALE = 2.0            // maximum --global-scale when scaling up to fill the page

// ── Public types ───────────────────────────────────────────────────
export type Warnings = Map<string, boolean>

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
 * Writes --global-scale to document.documentElement and returns a Warnings map
 * keyed by "bullet-{s}-{e}-{b}" (bullet overflows even at minScale) or
 * "global-overflow" (page overflows even at minScale).
 */
export function useResizeEngine(
  resume: Resume,
  constraints: Constraints,
  pageRef: React.RefObject<HTMLElement | null>
): Warnings {
  const [warnings, setWarnings] = useState<Warnings>(new Map())
  const prevBulletTexts = useRef<string[]>([])
  const prevHeight = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      // Wait for fonts to load so Pretext measurements are accurate.
      await document.fonts.ready
      if (cancelled) return

      const { maxPages, maxLinesPerBullet, minFontSize } = constraints
      const pageHeightLimit = maxPages * PAGE_HEIGHT_PX
      const root = document.documentElement

      // ── Collect bullet texts ────────────────────────────────────
      const bulletTexts: string[] = []
      resume.sections.forEach(section =>
        section.entries.forEach(entry =>
          entry.bullets.forEach(bullet => bulletTexts.push(bullet))
        )
      )

      // ── Fast path ───────────────────────────────────────────────
      // Skip full measurement when bullets haven't changed AND we're well
      // within the page limit. Always clears warnings to avoid stale state.
      const bulletTextsUnchanged =
        bulletTexts.length === prevBulletTexts.current.length &&
        bulletTexts.every((t, i) => t === prevBulletTexts.current[i])
      const wellWithinLimit = prevHeight.current < pageHeightLimit * 0.95

      if (bulletTextsUnchanged && wellWithinLimit) {
        setWarnings(new Map())
        return
      }

      prevBulletTexts.current = bulletTexts
      const newWarnings = new Map<string, boolean>()

      if (!pageRef.current) return

      // minScale ensures no font renders below minFontSize when global-scale is applied.
      // The smallest base size in the resume is DEFAULT_BULLET_SIZE (contact and bullets),
      // so minScale = minFontSize / DEFAULT_BULLET_SIZE.
      const minScale = minFontSize / DEFAULT_BULLET_SIZE

      // ── Check if all bullets fit at a given scale ────────────────
      // Uses Pretext for off-layout measurement — no DOM reflow needed.
      const allBulletsFitAtScale = (scale: number): boolean => {
        for (const section of resume.sections) {
          for (const entry of section.entries) {
            for (const bulletText of entry.bullets) {
              if (!bulletText) continue
              const font = `${DEFAULT_BULLET_SIZE * scale}px '${RESUME_FONT}'`
              const prepared = prepareWithSegments(bulletText, font)
              const { lineCount } = measureLineStats(prepared, COLUMN_WIDTH)
              if (lineCount > maxLinesPerBullet) return false
            }
          }
        }
        return true
      }

      // ── Combined fitness check at a given scale ──────────────────
      // Sets --global-scale as a side effect (required for DOM height measurement),
      // then returns true only if both the page height and all bullet line counts fit.
      const fitsAtScale = (scale: number): boolean => {
        root.style.setProperty('--global-scale', `${scale}`)
        const height = pageRef.current!.getBoundingClientRect().height
        if (height > pageHeightLimit) return false
        return allBulletsFitAtScale(scale)
      }

      // ── Find the largest scale where everything fits ─────────────
      // Binary search across [minScale, MAX_SCALE].
      // fitsAtScale returns 1 (pass) or 2 (fail); maxLines=1 finds the largest
      // value that passes, which is the standard binarySearchFontSize contract.
      const finalScale = binarySearchFontSize(
        scale => (fitsAtScale(scale) ? 1 : 2),
        minScale,
        MAX_SCALE,
        1,
        0.001,
        30
      )

      root.style.setProperty('--global-scale', `${finalScale}`)

      if (cancelled) return

      // ── Emit warnings for things that overflow even at minScale ──
      // Set --global-scale to minScale for the DOM height check, then restore.
      root.style.setProperty('--global-scale', `${minScale}`)
      const heightAtMinScale = pageRef.current.getBoundingClientRect().height
      if (heightAtMinScale > pageHeightLimit) {
        newWarnings.set('global-overflow', true)
      }
      resume.sections.forEach((section, sIdx) => {
        section.entries.forEach((entry, eIdx) => {
          entry.bullets.forEach((bulletText, bIdx) => {
            if (!bulletText) return
            const font = `${DEFAULT_BULLET_SIZE * minScale}px '${RESUME_FONT}'`
            const prepared = prepareWithSegments(bulletText, font)
            const { lineCount } = measureLineStats(prepared, COLUMN_WIDTH)
            if (lineCount > maxLinesPerBullet) {
              newWarnings.set(`bullet-${sIdx}-${eIdx}-${bIdx}`, true)
            }
          })
        })
      })
      // Restore finalScale after the minScale diagnostic pass.
      root.style.setProperty('--global-scale', `${finalScale}`)

      // Update prevHeight so the fast path has an accurate baseline next run.
      prevHeight.current = pageRef.current.getBoundingClientRect().height

      if (!cancelled) {
        setWarnings(newWarnings)
      }
    }

    run().catch(console.error)
    return () => { cancelled = true }
    // pageRef is a stable object ref — intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, constraints])

  return warnings
}
