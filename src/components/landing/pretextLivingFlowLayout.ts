import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext'

export type LivingFlowPoint = Readonly<{ x: number; y: number }>

export type LivingFlowLine = Readonly<{
  x: number
  y: number
  text: string
}>

export type LivingFlowLayoutInput = Readonly<{
  text: string
  font: string
  lineHeight: number
  stage: Readonly<{ width: number; height: number }>
  padding: number
  gap: number
  obstacle: Readonly<{
    x: number
    y: number
    width: number
    height: number
    hull: readonly LivingFlowPoint[]
  }>
}>

type Interval = Readonly<{ x: number; width: number }>
type PreparedPassage = ReturnType<typeof prepareWithSegments>

let preparedCache:
  | Readonly<{ text: string; font: string; prepared: PreparedPassage }>
  | undefined

function preparePassage(text: string, font: string): PreparedPassage {
  if (preparedCache?.text === text && preparedCache.font === font) {
    return preparedCache.prepared
  }

  const prepared = prepareWithSegments(text, font)
  preparedCache = { text, font, prepared }
  return prepared
}

function polygonIntersections(
  points: readonly LivingFlowPoint[],
  y: number
): number[] {
  const intersections: number[] = []

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if ((point.y <= y && next.y > y) || (next.y <= y && point.y > y)) {
      const progress = (y - point.y) / (next.y - point.y)
      intersections.push(point.x + (next.x - point.x) * progress)
    }
  })

  return intersections.sort((a, b) => a - b)
}

function obstacleBand(
  input: LivingFlowLayoutInput,
  lineTop: number
): Readonly<{ start: number; end: number }> | null {
  const { obstacle, gap, lineHeight } = input
  const bandTop = lineTop - gap
  const bandBottom = lineTop + lineHeight + gap
  const obstacleBottom = obstacle.y + obstacle.height

  if (bandBottom <= obstacle.y || bandTop >= obstacleBottom) return null

  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY

  for (let sample = 0; sample <= 8; sample += 1) {
    const sampledY = Math.max(
      0,
      Math.min(
        1,
        (bandTop + ((bandBottom - bandTop) * sample) / 8 - obstacle.y) /
          obstacle.height
      )
    )
    const intersections = polygonIntersections(obstacle.hull, sampledY)
    if (intersections.length < 2) continue
    min = Math.min(min, intersections[0])
    max = Math.max(max, intersections[intersections.length - 1])
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) return null

  return {
    start: obstacle.x + min * obstacle.width - gap,
    end: obstacle.x + max * obstacle.width + gap,
  }
}

function availableIntervals(
  input: LivingFlowLayoutInput,
  lineTop: number
): Interval[] {
  const contentStart = input.padding
  const contentEnd = input.stage.width - input.padding
  const exclusion = obstacleBand(input, lineTop)

  if (!exclusion) {
    return [{ x: contentStart, width: contentEnd - contentStart }]
  }

  const intervals: Interval[] = []
  const leftEnd = Math.max(contentStart, exclusion.start)
  const rightStart = Math.min(contentEnd, exclusion.end)

  if (leftEnd - contentStart >= 72) {
    intervals.push({ x: contentStart, width: leftEnd - contentStart })
  }
  if (contentEnd - rightStart >= 72) {
    intervals.push({ x: rightStart, width: contentEnd - rightStart })
  }

  return intervals
}

export function layoutLivingFlow(
  input: LivingFlowLayoutInput
): LivingFlowLine[] | null {
  if (input.stage.width <= input.padding * 2) return []

  try {
    const prepared = preparePassage(input.text, input.font)
    const lines: LivingFlowLine[] = []
    let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }

    for (
      let y = input.padding;
      y + input.lineHeight <= input.stage.height - input.padding;
      y += input.lineHeight
    ) {
      const intervals = availableIntervals(input, y)

      for (const interval of intervals) {
        const line = layoutNextLine(prepared, cursor, interval.width)
        if (line === null) return lines
        lines.push({ x: interval.x, y, text: line.text })
        cursor = line.end
      }
    }

    return lines
  } catch {
    return null
  }
}
