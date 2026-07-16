import { measureLineStats, prepareWithSegments } from '@chenglou/pretext'
import { useEffect, useMemo, useState } from 'react'
import type { Constraints } from './constraints'
import {
  computeResumeFit,
  type FormattingWarnings,
  type ResumeFit,
} from './formatting'
import { RESUME_DOCUMENT } from './resumeDocumentTokens'
import type { Resume } from './types'

const COLUMN_WIDTH =
  RESUME_DOCUMENT.pageWidthPx -
  RESUME_DOCUMENT.pageMarginXPx * 2 -
  RESUME_DOCUMENT.bulletIndentPx
const RESUME_MEASUREMENT_LAYOUT_SCALE = '100'
const RESUME_MEASUREMENT_PRESENTATION_SCALE = '0.01'
const EMPTY_WARNINGS: FormattingWarnings = {
  globalOverflow: false,
  bullets: [],
}

export type ResizeEngineResult = {
  warnings: FormattingWarnings
  globalScale: number
  isReady: boolean
}

type ResizeMeasurement = Readonly<{ key: string }> & ResumeFit

function withResumeMeasurementScale<T>(
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
/**
 * Adapts live resume DOM and Pretext measurements to the pure formatting module.
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
      await document.fonts.ready
      if (cancelled || !pageRef.current) return

      const root = document.documentElement
      const measureBulletLines = (text: string, scale: number): number => {
        const font = `${RESUME_DOCUMENT.fontSizeBulletPx * scale}px '${RESUME_DOCUMENT.fontFamily}'`
        const prepared = prepareWithSegments(text, font)
        return measureLineStats(prepared, COLUMN_WIDTH).lineCount
      }
      const measurePageHeight = (scale: number): number => {
        root.style.setProperty('--global-scale', `${scale}`)
        return pageRef.current!.getBoundingClientRect().height
      }

      const fit = withResumeMeasurementScale(root, () =>
        computeResumeFit(resume, constraints, {
          measureBulletLines,
          measurePageHeight,
        })
      )

      root.style.setProperty('--global-scale', `${fit.globalScale}`)
      if (cancelled) return

      setMeasurement({ key: measurementKey, ...fit })
    }

    run().catch(console.error)
    return () => {
      cancelled = true
    }
    // pageRef is a stable object ref — intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, constraints, measurementKey])

  return {
    warnings: measurement?.warnings ?? EMPTY_WARNINGS,
    globalScale: measurement?.globalScale ?? 1,
    isReady: measurement?.key === measurementKey,
  }
}
