import { useEffect, useRef } from 'react'
import { prepareWithSegments, measureLineStats } from '@chenglou/pretext'
import type { Constraints, Resume } from './types'

// ── Constants ──────────────────────────────────────────────────────
const PAGE_HEIGHT_PX = 1056
const COLUMN_WIDTH = 704  // 816 - 48 - 48 - 16
const DEFAULT_BULLET_SIZE = 10  // px, must match --font-size-bullet in CSS
const RESUME_FONT = 'EB Garamond'

// ── Public types ───────────────────────────────────────────────────
export type Warnings = Map<string, boolean>

// ── Pure helpers (exported for testing) ───────────────────────────

/**
 * Binary search for the highest font size (in [lo, hi]) where
 * measureLines(fontSize) <= maxLines.
 *
 * @param measureLines - callback that returns the line count for a given font size
 * @param lo           - minimum font size (lower bound, inclusive)
 * @param hi           - starting maximum font size (upper bound, inclusive)
 * @param maxLines     - constraint: line count must be <= this
 * @param precision    - stop when hi - lo < precision
 * @param maxIterations - safety cap on iterations
 * @returns the highest fontSize in [lo, hi] that satisfies the constraint,
 *          or lo if nothing satisfies it
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
 * Writes CSS custom properties to document.documentElement and returns
 * a Warnings map keyed by "bullet-{s}-{e}-{b}" or "global-overflow".
 */
export function useResizeEngine(
  resume: Resume,
  constraints: Constraints,
  pageRef: React.RefObject<HTMLElement | null>
): Warnings {
  const warningsRef = useRef<Warnings>(new Map())
  const prevBulletTexts = useRef<string[]>([])
  const prevHeight = useRef<number>(0)

  useEffect(() => {
    const run = async () => {
      // Wait for fonts to load so Pretext measurements are accurate.
      await document.fonts.ready

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
      const bulletTextsUnchanged =
        bulletTexts.length === prevBulletTexts.current.length &&
        bulletTexts.every((t, i) => t === prevBulletTexts.current[i])
      const wellWithinLimit = prevHeight.current < pageHeightLimit * 0.95

      if (bulletTextsUnchanged && wellWithinLimit) return

      prevBulletTexts.current = bulletTexts
      const newWarnings = new Map<string, boolean>()

      // ── Per-bullet resize ────────────────────────────────────────
      resume.sections.forEach((section, sIdx) => {
        section.entries.forEach((entry, eIdx) => {
          entry.bullets.forEach((bulletText, bIdx) => {
            const varName = `--font-size-bullet-${sIdx}-${eIdx}-${bIdx}`
            const currentSizeStr = root.style.getPropertyValue(varName)
            // Parse "9.5px" → 9.5, or fall back to default
            const currentSize = currentSizeStr
              ? parseFloat(currentSizeStr)
              : DEFAULT_BULLET_SIZE

            const measureLines = (fontSize: number) => {
              const font = `${fontSize}px '${RESUME_FONT}'`
              const prepared = prepareWithSegments(bulletText, font)
              return measureLineStats(prepared, COLUMN_WIDTH).lineCount
            }

            const lineCount = measureLines(currentSize)
            let newSize = currentSize

            if (lineCount > maxLinesPerBullet) {
              // Shrink to fit
              newSize = binarySearchFontSize(
                measureLines,
                minFontSize,
                currentSize,
                maxLinesPerBullet,
                0.5,
                20
              )
              // Verify at minFontSize
              if (measureLines(minFontSize) > maxLinesPerBullet) {
                newWarnings.set(`bullet-${sIdx}-${eIdx}-${bIdx}`, true)
                newSize = minFontSize
              }
            } else if (lineCount < maxLinesPerBullet && currentSize < DEFAULT_BULLET_SIZE) {
              // Recover toward default
              newSize = binarySearchFontSize(
                measureLines,
                currentSize,
                DEFAULT_BULLET_SIZE,
                maxLinesPerBullet,
                0.5,
                20
              )
            }

            root.style.setProperty(varName, `${newSize}px`)
          })
        })
      })

      // ── Page overflow resize ────────────────────────────────────
      if (!pageRef.current) return

      const currentHeight = pageRef.current.getBoundingClientRect().height
      prevHeight.current = currentHeight

      const currentScaleStr = root.style.getPropertyValue('--global-scale')
      const currentScale = currentScaleStr ? parseFloat(currentScaleStr) : 1.0

      if (currentHeight > pageHeightLimit) {
        // Smallest base font role is 10px (contact/bullet), so min scale keeps it at minFontSize
        const minScale = minFontSize / 10

        const measureHeightAtScale = (scale: number): number => {
          root.style.setProperty('--global-scale', `${scale}`)
          return pageRef.current!.getBoundingClientRect().height
        }

        const fitScale = binarySearchFontSize(
          scale => (measureHeightAtScale(scale) <= pageHeightLimit ? 1 : 2),
          minScale,
          currentScale,
          1,  // "fits" means lineCount-equivalent <= 1 (height fits)
          0.001,
          20
        )

        root.style.setProperty('--global-scale', `${fitScale}`)

        // Check if still overflows at minScale
        const finalHeight = pageRef.current.getBoundingClientRect().height
        if (finalHeight > pageHeightLimit) {
          newWarnings.set('global-overflow', true)
        }
      } else if (currentHeight <= pageHeightLimit && currentScale < 1.0) {
        // Try to recover scale toward 1.0
        const measureHeightAtScale = (scale: number): number => {
          root.style.setProperty('--global-scale', `${scale}`)
          return pageRef.current!.getBoundingClientRect().height
        }

        const recoveredScale = binarySearchFontSize(
          scale => (measureHeightAtScale(scale) <= pageHeightLimit ? 1 : 2),
          currentScale,
          1.0,
          1,
          0.001,
          20
        )

        root.style.setProperty('--global-scale', `${recoveredScale}`)
      }

      warningsRef.current = newWarnings
    }

    run().catch(console.error)
  }, [resume, constraints, pageRef])

  return warningsRef.current
}
