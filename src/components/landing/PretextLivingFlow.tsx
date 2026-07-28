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
const MAX_PASSAGE_LENGTH = 800

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
  const frameRef = useRef<number | null>(null)
  const pendingPointRef = useRef<Point | null>(null)
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const placedRef = useRef(false)
  const movedRef = useRef(false)
  const defaultPointRef = useRef<Point>({ x: 360, y: 64 })
  const [stageSize, setStageSize] = useState<Size>({ width: 0, height: 0 })
  const [titleSize, setTitleSize] = useState<Size>({ width: 280, height: 74 })
  const [titlePoint, setTitlePoint] = useState<Point>({ x: 360, y: 64 })
  const [passage, setPassage] = useState(INITIAL_PASSAGE)
  const [editing, setEditing] = useState(false)
  const [hasMoved, setHasMoved] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)

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

      defaultPointRef.current = nextDefault
      setStageSize(nextStage)
      setTitleSize(nextTitle)
      setTitlePoint(current => {
        if (!placedRef.current || !movedRef.current) {
          placedRef.current = true
          return nextDefault
        }
        return clampPoint(current, nextStage, nextTitle)
      })
    }

    sync()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(sync)
    observer.observe(stage)
    observer.observe(title)
    return () => observer.disconnect()
  }, [editing, fontsReady])

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    },
    []
  )

  const projectedLines = useMemo(() => {
    if (!fontsReady || stageSize.width === 0) return null

    return layoutLivingFlow({
      text: passage,
      font: FONT,
      lineHeight: LINE_HEIGHT,
      stage: stageSize,
      padding: STAGE_PADDING,
      gap: OBJECT_GAP,
      obstacle: {
        ...titlePoint,
        ...titleSize,
        hull: STAIR_HULL,
      },
    })
  }, [fontsReady, passage, stageSize, titlePoint, titleSize])

  const markMoved = () => {
    movedRef.current = true
    setHasMoved(true)
  }

  const schedulePoint = (point: Point) => {
    pendingPointRef.current = clampPoint(point, stageSize, titleSize)
    if (frameRef.current !== null) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      if (pendingPointRef.current) {
        markMoved()
        setTitlePoint(pendingPointRef.current)
      }
    })
  }

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
    markMoved()
    setTitlePoint(current =>
      clampPoint(
        { x: current.x + delta.x, y: current.y + delta.y },
        stageSize,
        titleSize
      )
    )
  }

  const resetPosition = () => {
    movedRef.current = false
    setHasMoved(false)
    setTitlePoint(defaultPointRef.current)
  }

  const layoutAvailable = projectedLines !== null
  const interactionUnavailable =
    fontsReady && stageSize.width > 0 && projectedLines === null
  const projectedHeight = projectedLines?.length
    ? projectedLines[projectedLines.length - 1].y + LINE_HEIGHT + STAGE_PADDING
    : 0

  return (
    <div className="pretext-living-flow">
      <div
        ref={stageRef}
        className="pretext-living-flow__stage"
        style={{ minHeight: editing ? projectedHeight : undefined }}
      >
        {editing ? (
          <textarea
            aria-label="Pretext demonstration passage"
            autoFocus
            maxLength={MAX_PASSAGE_LENGTH}
            value={passage}
            onChange={event => setPassage(event.target.value)}
          />
        ) : (
          <>
            <p
              className={
                layoutAvailable
                  ? 'landing-origins__passage sr-only'
                  : 'landing-origins__passage pretext-living-flow__fallback'
              }
            >
              {passage}
            </p>
            {projectedLines ? (
              <div aria-hidden="true" style={{ height: projectedHeight }}>
                {projectedLines.map((line, index) => (
                  <span
                    className="pretext-living-flow__line"
                    key={`${index}-${line.text}`}
                    style={{
                      transform: `translate(${line.x}px, ${line.y}px)`,
                    }}
                  >
                    {line.text}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        )}

        {!interactionUnavailable && !editing ? (
          <button
            ref={titleRef}
            className="pretext-living-flow__title"
            type="button"
            aria-label='Move “Text responds to its surroundings” by dragging or using the arrow keys.'
            data-position={`${Math.round(titlePoint.x)},${Math.round(titlePoint.y)}`}
            style={{
              transform: `translate3d(${titlePoint.x}px, ${titlePoint.y}px, 0)`,
            }}
            onPointerDown={event => {
              const rect = event.currentTarget.getBoundingClientRect()
              dragOffsetRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={event => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                return
              }
              const stageRect = stageRef.current?.getBoundingClientRect()
              if (!stageRect) return
              schedulePoint({
                x: event.clientX - stageRect.left - dragOffsetRef.current.x,
                y: event.clientY - stageRect.top - dragOffsetRef.current.y,
              })
            }}
            onKeyDown={moveByKeyboard}
          >
            <span className="pretext-living-flow__title-shape" aria-hidden="true">
              <svg viewBox="0 0 280 74">
                <polygon points="2,2 254,2 254,37 278,37 278,72 26,72 26,37 2,37" />
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

      <div className="pretext-living-flow__actions">
        <span className="pretext-living-flow__local-actions">
          <button
            className="pretext-living-flow__edit"
            type="button"
            onClick={() => setEditing(current => !current)}
          >
            {editing ? 'View flow' : 'Edit passage'}
          </button>
          {hasMoved ? (
            <button
              className="pretext-living-flow__reset"
              type="button"
              onClick={resetPosition}
            >
              Reset position
            </button>
          ) : null}
        </span>
        {actionsEnd}
      </div>
    </div>
  )
}
