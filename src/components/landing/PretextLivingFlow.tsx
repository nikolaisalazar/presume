import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  layoutLivingFlow,
  type LivingFlowPoint,
} from './pretextLivingFlowLayout'

const INITIAL_PASSAGE =
  'Text usually has to appear on a page before the browser can tell an application how much space it occupies. Pretext calculates multiline text layout in JavaScript, using the browser font engine without repeatedly measuring the rendered paragraph. It can predict line breaks and text height, then route a continuous passage through changing geometry. Move the title through the passage to see each line find the available space again. In Presume, the same foundation helps make changing content measurable.'

const FONT = '18px Geist'
const LINE_HEIGHT = 30
const STAGE_PADDING = 28
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

export function PretextLivingFlow() {
  const stageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLButtonElement>(null)
  const frameRef = useRef<number | null>(null)
  const pendingPointRef = useRef<Point | null>(null)
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const placedRef = useRef(false)
  const [stageSize, setStageSize] = useState<Size>({ width: 0, height: 0 })
  const [titleSize, setTitleSize] = useState<Size>({ width: 280, height: 74 })
  const [titlePoint, setTitlePoint] = useState<Point>({ x: 360, y: 64 })
  const [passage, setPassage] = useState(INITIAL_PASSAGE)
  const [editing, setEditing] = useState(false)
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
      setStageSize(nextStage)
      setTitleSize(nextTitle)
      setTitlePoint(current => {
        if (!placedRef.current && nextStage.width > 0) {
          placedRef.current = true
          return clampPoint(
            { x: nextStage.width * 0.52, y: 64 },
            nextStage,
            nextTitle
          )
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
  }, [])

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

  const schedulePoint = (point: Point) => {
    pendingPointRef.current = clampPoint(point, stageSize, titleSize)
    if (frameRef.current !== null) return

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      if (pendingPointRef.current) setTitlePoint(pendingPointRef.current)
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
    setTitlePoint(current =>
      clampPoint(
        { x: current.x + delta.x, y: current.y + delta.y },
        stageSize,
        titleSize
      )
    )
  }

  const layoutAvailable = projectedLines !== null

  return (
    <section
      className="pretext-living-flow"
      aria-labelledby="pretext-living-flow-title"
    >
      <header className="pretext-living-flow__header">
        <p className="landing-kicker">A working example</p>
        <a href="https://github.com/chenglou/pretext">
          Explore Pretext<span aria-hidden="true"> ↗</span>
        </a>
      </header>

      <div ref={stageRef} className="pretext-living-flow__stage">
        {editing ? (
          <textarea
            aria-label="Pretext demonstration passage"
            autoFocus
            value={passage}
            onChange={event => setPassage(event.target.value)}
          />
        ) : (
          <>
            <p
              className={
                layoutAvailable
                  ? 'sr-only'
                  : 'pretext-living-flow__fallback'
              }
            >
              {passage}
            </p>
            {projectedLines ? (
              <div aria-hidden="true">
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

        <h2
          aria-label="Text responds to its surroundings."
          id="pretext-living-flow-title"
        >
          <button
            ref={titleRef}
            className="pretext-living-flow__title"
            type="button"
            aria-label="Movable headline. Drag it or use the arrow keys."
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
        </h2>

        <button
          className="pretext-living-flow__edit"
          type="button"
          onClick={() => setEditing(current => !current)}
        >
          {editing ? 'View flow' : 'Edit passage'}
        </button>
      </div>
    </section>
  )
}
