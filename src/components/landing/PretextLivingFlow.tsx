import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  layoutLivingFlow,
  type LivingFlowPoint,
} from './pretextLivingFlowLayout'

const INITIAL_PASSAGE =
  'Changing a sentence changes where every line ends, but browsers usually reveal those measurements only after the text appears. Pretext calculates multiline layout in JavaScript using the browser’s own font engine. It predicts line breaks and text height, then routes one continuous passage through changing geometry. Move the title through this passage to see each line find the available space again.'

const FONT = '18px Geist'
const LINE_HEIGHT = 30
const STAGE_PADDING = 8
const OBJECT_GAP = 4

const STAIR_HULL: readonly LivingFlowPoint[] = [
  { x: 0, y: 0 },
  { x: 0.91, y: 0 },
  { x: 0.91, y: 0.5 },
  { x: 1, y: 0.5 },
  { x: 1, y: 1 },
  { x: 0.09, y: 1 },
  { x: 0.09, y: 0.5 },
  { x: 0, y: 0.5 },
]

type Size = Readonly<{ width: number; height: number }>
type Point = Readonly<{ x: number; y: number }>
type ReservedStage = Readonly<{ key: string; height: number }>

function clampPoint(point: Point, stage: Size, object: Size): Point {
  if (stage.width === 0 || stage.height === 0) return point

  return {
    x: Math.max(
      STAGE_PADDING,
      Math.min(stage.width - STAGE_PADDING - object.width, point.x)
    ),
    y: Math.max(
      STAGE_PADDING,
      Math.min(stage.height - STAGE_PADDING - object.height, point.y)
    ),
  }
}

function getDefaultPoint(stage: Size, object: Size): Point {
  return clampPoint(
    {
      x: stage.width >= 560 ? stage.width * 0.52 : stage.width * 0.16,
      y: stage.width >= 560 ? 64 : Math.max(160, stage.height * 0.46),
    },
    stage,
    object
  )
}

export interface PretextLivingFlowProps {
  actionsEnd?: ReactNode
}

export function PretextLivingFlow({ actionsEnd }: PretextLivingFlowProps = {}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLButtonElement>(null)
  const lineLayerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const pendingPointRef = useRef<Point | null>(null)
  const visualPointRef = useRef<Point>({ x: 360, y: 64 })
  const lastAcceptedPointerRef = useRef<
    | Readonly<{
        point: Point
        lines: Exclude<ReturnType<typeof layoutLivingFlow>, null>
      }>
    | undefined
  >()
  const dragRef = useRef<
    | Readonly<{
        pointerId: number
        stageLeft: number
        stageTop: number
        offsetX: number
        offsetY: number
      }>
    | undefined
  >()
  const placedRef = useRef(false)
  const movedRef = useRef(false)
  const acceptedLayoutRef = useRef<
    | Readonly<{
        point: Point
        stage: Size
        object: Size
        lines: ReturnType<typeof layoutLivingFlow>
      }>
    | undefined
  >()
  const [stageSize, setStageSize] = useState<Size>({ width: 0, height: 0 })
  const [titleSize, setTitleSize] = useState<Size>({ width: 208, height: 68 })
  const [titlePoint, setTitlePoint] = useState<Point>({ x: 360, y: 64 })
  const [fontsReady, setFontsReady] = useState(false)
  const [reservedStage, setReservedStage] =
    useState<ReservedStage | null>(null)

  useEffect(() => {
    let active = true
    const ready = document.fonts?.ready ?? Promise.resolve()

    void ready.finally(() => {
      if (active) setFontsReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    const title = titleRef.current
    if (!stage || !title) return

    const sync = () => {
      const nextStage = {
        width: stage.clientWidth,
        height: stage.clientHeight,
      }
      const nextTitle = {
        width: title.getBoundingClientRect().width,
        height: title.getBoundingClientRect().height,
      }
      const nextDefault = getDefaultPoint(nextStage, nextTitle)

      const activeDrag = dragRef.current
      if (activeDrag) {
        dragRef.current = undefined
        pendingPointRef.current = null
        lastAcceptedPointerRef.current = undefined
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }
        if (
          typeof title.hasPointerCapture === 'function' &&
          title.hasPointerCapture(activeDrag.pointerId) &&
          typeof title.releasePointerCapture === 'function'
        ) {
          title.releasePointerCapture(activeDrag.pointerId)
        }
      }

      setStageSize(nextStage)
      setTitleSize(nextTitle)
      acceptedLayoutRef.current = undefined
      const nextPoint =
        !placedRef.current || !movedRef.current
          ? nextDefault
          : clampPoint(visualPointRef.current, nextStage, nextTitle)

      placedRef.current = true
      visualPointRef.current = nextPoint
      title.style.transform = `translate3d(${nextPoint.x}px, ${nextPoint.y}px, 0)`
      setTitlePoint(nextPoint)
    }

    sync()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(sync)
    observer.observe(stage)
    observer.observe(title)
    return () => observer.disconnect()
  }, [fontsReady])

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    []
  )

  useLayoutEffect(() => {
    const title = titleRef.current
    if (!title) return

    const point = visualPointRef.current
    title.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
  }, [titlePoint])

  const paintProjectedLines = (
    lines: Exclude<ReturnType<typeof layoutLivingFlow>, null>
  ) => {
    const layer = lineLayerRef.current
    if (!layer) return

    lines.forEach((line, index) => {
      const existing = layer.children.item(index)
      const node =
        existing instanceof HTMLSpanElement
          ? existing
          : document.createElement('span')
      if (!existing) {
        node.className = 'pretext-living-flow__line'
        layer.append(node)
      }
      if (node.textContent !== line.text) node.textContent = line.text
      node.style.transform = `translate(${line.x}px, ${line.y}px)`
    })

    while (layer.children.length > lines.length) {
      layer.lastElementChild?.remove()
    }

    const lastLine = lines[lines.length - 1]
    layer.style.height = lastLine
      ? `${lastLine.y + LINE_HEIGHT + STAGE_PADDING}px`
      : '0px'
  }

  const layoutAtPoint = (point: Point) => {
    if (!fontsReady || stageSize.width === 0) return null

    return layoutLivingFlow({
      text: INITIAL_PASSAGE,
      font: FONT,
      lineHeight: LINE_HEIGHT,
      stage: stageSize,
      padding: STAGE_PADDING,
      gap: OBJECT_GAP,
      obstacle: {
        ...point,
        ...titleSize,
        hull: STAIR_HULL,
      },
    })
  }

  const projectedLines = useMemo(() => {
    const accepted = acceptedLayoutRef.current
    if (
      accepted &&
      accepted.point.x === titlePoint.x &&
      accepted.point.y === titlePoint.y &&
      accepted.stage.width === stageSize.width &&
      accepted.stage.height === stageSize.height &&
      accepted.object.width === titleSize.width &&
      accepted.object.height === titleSize.height
    ) {
      return accepted.lines
    }

    return layoutAtPoint(titlePoint)
    // layoutAtPoint is intentionally scoped to the current measured render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsReady, stageSize, titlePoint, titleSize])

  const reservationKey = `${stageSize.width}:${titleSize.width}:${titleSize.height}`

  useLayoutEffect(() => {
    if (!projectedLines) return

    const lastLine = projectedLines[projectedLines.length - 1]
    const projectedHeight = lastLine
      ? lastLine.y + LINE_HEIGHT + STAGE_PADDING
      : 0
    const height = projectedHeight + LINE_HEIGHT

    setReservedStage(current =>
      current?.key === reservationKey ? current : { key: reservationKey, height }
    )
  }, [projectedLines, reservationKey])

  useLayoutEffect(() => {
    if (projectedLines) {
      paintProjectedLines(projectedLines)
      return
    }

    const layer = lineLayerRef.current
    if (!layer) return
    layer.replaceChildren()
    layer.style.height = '0px'
  }, [projectedLines])

  const validatedLayout = (point: Point) => {
    return layoutAtPoint(point)
  }

  const cacheAcceptedLayout = (
    point: Point,
    lines: ReturnType<typeof layoutLivingFlow>
  ) => {
    acceptedLayoutRef.current = {
      point,
      stage: stageSize,
      object: titleSize,
      lines,
    }
  }

  const markMoved = () => {
    movedRef.current = true
  }

  const paintPoint = (point: Point) => {
    visualPointRef.current = point
    if (titleRef.current) {
      titleRef.current.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`
    }
  }

  const commitPoint = (
    point: Point,
    candidateLines: Exclude<ReturnType<typeof layoutLivingFlow>, null>
  ) => {
    cacheAcceptedLayout(point, candidateLines)
    markMoved()
    setTitlePoint(point)
  }

  const schedulePoint = (point: Point) => {
    pendingPointRef.current = clampPoint(point, stageSize, titleSize)
    if (frameRef.current !== null) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const candidate = pendingPointRef.current
      pendingPointRef.current = null
      if (!candidate) return

      const candidateLines = validatedLayout(candidate)
      if (!candidateLines) return

      markMoved()
      paintPoint(candidate)
      paintProjectedLines(candidateLines)
      lastAcceptedPointerRef.current = {
        point: candidate,
        lines: candidateLines,
      }
    })
  }

  const finishPointerMovement = () => {
    const candidate = pendingPointRef.current ?? visualPointRef.current
    pendingPointRef.current = null
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    const candidateLines = validatedLayout(candidate)
    const accepted = candidateLines
      ? { point: candidate, lines: candidateLines }
      : lastAcceptedPointerRef.current

    if (accepted) {
      paintPoint(accepted.point)
      paintProjectedLines(accepted.lines)
      commitPoint(accepted.point, accepted.lines)
    } else {
      paintPoint(titlePoint)
      if (projectedLines) paintProjectedLines(projectedLines)
    }
    lastAcceptedPointerRef.current = undefined
  }

  useEffect(() => {
    const stage = stageRef.current
    const title = titleRef.current
    if (!stage || !title) return

    const beginDrag = (event: PointerEvent) => {
      if (
        event.isPrimary === false ||
        event.button !== 0 ||
        dragRef.current
      ) {
        return
      }

      event.preventDefault()
      const stageRect = stage.getBoundingClientRect()
      const titleRect = title.getBoundingClientRect()
      dragRef.current = {
        pointerId: event.pointerId,
        stageLeft: stageRect.left,
        stageTop: stageRect.top,
        offsetX: event.clientX - titleRect.left,
        offsetY: event.clientY - titleRect.top,
      }
      lastAcceptedPointerRef.current = undefined
      title.setPointerCapture(event.pointerId)
    }

    const continueDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return

      event.preventDefault()
      schedulePoint({
        x: event.clientX - drag.stageLeft - drag.offsetX,
        y: event.clientY - drag.stageTop - drag.offsetY,
      })
    }

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return

      event.preventDefault()
      dragRef.current = undefined
      finishPointerMovement()
      if (
        typeof title.hasPointerCapture === 'function' &&
        title.hasPointerCapture(event.pointerId) &&
        typeof title.releasePointerCapture === 'function'
      ) {
        title.releasePointerCapture(event.pointerId)
      }
    }

    title.addEventListener('pointerdown', beginDrag)
    window.addEventListener('pointermove', continueDrag, { passive: false })
    window.addEventListener('pointerup', endDrag, { passive: false })
    window.addEventListener('pointercancel', endDrag, { passive: false })

    return () => {
      title.removeEventListener('pointerdown', beginDrag)
      window.removeEventListener('pointermove', continueDrag)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  })

  const moveByKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const step = event.shiftKey ? 24 : 8
    const movement: Partial<Record<string, Point>> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const delta = movement[event.key]
    if (!delta) return

    event.preventDefault()
    const current = visualPointRef.current
    const candidate = clampPoint(
      { x: current.x + delta.x, y: current.y + delta.y },
      stageSize,
      titleSize
    )
    const candidateLines = validatedLayout(candidate)
    if (!candidateLines) return

    cacheAcceptedLayout(candidate, candidateLines)
    paintPoint(candidate)
    paintProjectedLines(candidateLines)
    markMoved()
    setTitlePoint(candidate)
  }

  const layoutAvailable = projectedLines !== null
  const interactionUnavailable =
    fontsReady && stageSize.width > 0 && projectedLines === null

  return (
    <div className="pretext-living-flow">
      <div
        ref={stageRef}
        className="pretext-living-flow__stage"
        style={
          reservedStage?.key === reservationKey
            ? { height: reservedStage.height }
            : undefined
        }
      >
        <p
          className={
            layoutAvailable
              ? 'landing-origins__passage sr-only'
              : 'landing-origins__passage pretext-living-flow__fallback'
          }
        >
          {INITIAL_PASSAGE}
        </p>
        <div ref={lineLayerRef} aria-hidden="true" />

        {!interactionUnavailable ? (
          <button
            ref={titleRef}
            className="pretext-living-flow__title"
            type="button"
            aria-label='Move “Text responds to its surroundings” by dragging or using the arrow keys.'
            data-position={`${Math.round(titlePoint.x)},${Math.round(titlePoint.y)}`}
            style={{
              transform: `translate3d(${titlePoint.x}px, ${titlePoint.y}px, 0)`,
            }}
            onKeyDown={moveByKeyboard}
          >
            <span className="pretext-living-flow__title-shape" aria-hidden="true">
              <svg viewBox="0 0 226 74">
                <polygon points="2,2 202,2 202,37 224,37 224,72 26,72 26,37 2,37" />
              </svg>
              <span className="pretext-living-flow__title-line pretext-living-flow__title-line--top">
                Text responds to
              </span>
              <span className="pretext-living-flow__title-line pretext-living-flow__title-line--bottom">
                its surroundings.
              </span>
            </span>
          </button>
        ) : null}
      </div>

      {actionsEnd ? (
        <div className="pretext-living-flow__actions">{actionsEnd}</div>
      ) : null}
    </div>
  )
}
