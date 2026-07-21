import {
  measureLineStats,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'

export const FIT_LAB_FONT = '14px Geist'
export const FIT_LAB_TARGET_LINES = 2 as const
export const FIT_LAB_WIDTHS = [180, 240, 300] as const

export type FitLabWidth = (typeof FIT_LAB_WIDTHS)[number]

export type FitLabMeasurement = {
  lineCount: number
  maxLineWidth: number
  targetLines: typeof FIT_LAB_TARGET_LINES
  status: 'within' | 'over'
}

export function prepareFitLabText(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, FIT_LAB_FONT)
}

export function measurePreparedFitLab(
  prepared: PreparedTextWithSegments,
  width: FitLabWidth
): FitLabMeasurement {
  const { lineCount, maxLineWidth } = measureLineStats(prepared, width)

  return {
    lineCount,
    maxLineWidth: Math.round(maxLineWidth),
    targetLines: FIT_LAB_TARGET_LINES,
    status: lineCount <= FIT_LAB_TARGET_LINES ? 'within' : 'over',
  }
}
