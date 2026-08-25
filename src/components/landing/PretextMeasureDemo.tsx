import {
  layoutWithLines,
  measureLineStats,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const SENTENCE = 'Text changes shape as the space around it changes.'
const FONT = '540 28px Geist'
const LINE_HEIGHT = 31.92
const INITIAL_WIDTH = 340
const MIN_WIDTH = 116
const STAGE_PADDING = 28
const HALF_GRIP = 22
const BRIDGE = 'Presume uses those measured lines to keep each bullet within its limit.'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function PretextMeasureDemo() {
  const stageRef = useRef<HTMLDivElement>(null)
  const activePointerRef = useRef<number | null>(null)
  const widthRef = useRef(INITIAL_WIDTH)
  const [prepared, setPrepared] = useState<PreparedTextWithSegments | null>(null)
  const [measurementFailed, setMeasurementFailed] = useState(false)
  const [availableWidth, setAvailableWidth] = useState(INITIAL_WIDTH)
  const [maximumWidth, setMaximumWidth] = useState(INITIAL_WIDTH)
  const [dragging, setDragging] = useState(false)

  const getBounds = useCallback(() => {
    const stageWidth = stageRef.current?.clientWidth ?? 0
    return {
      min: MIN_WIDTH,
      max: stageWidth > 0
        ? Math.max(MIN_WIDTH, Math.floor(stageWidth - STAGE_PADDING - HALF_GRIP))
        : INITIAL_WIDTH,
    }
  }, [])

  const updateWidth = useCallback((nextWidth: number) => {
    const { min, max } = getBounds()
    const bounded = Math.round(clamp(nextWidth, min, max))
    widthRef.current = bounded
    setMaximumWidth(max)
    setAvailableWidth(bounded)
  }, [getBounds])

  useEffect(() => {
    let cancelled = false

    const prepare = async () => {
      const fonts = document.fonts
      if (fonts?.load) await fonts.load(FONT, SENTENCE)
      else if (fonts?.ready) await fonts.ready
      if (!cancelled) setPrepared(prepareWithSegments(SENTENCE, FONT))
    }

    prepare().catch(error => {
      console.error('Unable to initialize the Pretext landing measurement.', error)
      if (!cancelled) setMeasurementFailed(true)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const resize = () => updateWidth(widthRef.current)
    resize()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [updateWidth])

  const measurement = useMemo(() => {
    if (!prepared) return null
    const stats = measureLineStats(prepared, availableWidth)
    const layout = layoutWithLines(prepared, availableWidth, LINE_HEIGHT)
    return { ...stats, lines: layout.lines }
  }, [availableWidth, prepared])

  const widthFromPointer = (clientX: number) => {
    const stageLeft = stageRef.current?.getBoundingClientRect().left ?? 0
    return clientX - stageLeft - STAGE_PADDING
  }

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    activePointerRef.current = null
    setDragging(false)
    try { event.currentTarget.releasePointerCapture(event.pointerId) } catch { /* capture may already be released */ }
  }

  const lineCount = measurement?.lineCount
  const edge = STAGE_PADDING + availableWidth
  const measurementReady = measurement !== null

  return (
    <figure
      className="landing-evidence-plate landing-pretext"
      aria-labelledby="pretext-measures-label"
      aria-busy={!measurementReady && !measurementFailed}
      data-measurement-state={measurementFailed ? 'unavailable' : measurementReady ? 'ready' : 'loading'}
    >
      <div className="landing-pretext__instrument">
        <p className="landing-pretext__label" id="pretext-measures-label">Pretext measures</p>
        <div className="landing-pretext__readouts">
          <span>Available width <strong data-pretext-width>{measurementFailed ? '—' : `${availableWidth}px`}</strong></span>
          <span>Line count <strong data-pretext-lines>{measurementFailed ? 'Unavailable' : lineCount ?? '—'}</strong></span>
        </div>
        <div className="landing-pretext__stage" ref={stageRef} data-pretext-stage>
          <div className="landing-pretext__available" style={{ width: edge }} aria-hidden="true" />
          <p className="landing-pretext__text" style={{ width: availableWidth }}>
            {measurement
              ? measurement.lines.map((line, index) => <span key={`${index}-${line.text}`}>{line.text}</span>)
              : <span>{SENTENCE}</span>}
          </p>
          {measurementFailed ? (
            <p className="landing-pretext__fallback" role="status">Live measurement unavailable.</p>
          ) : (
            <div
              className={`landing-pretext__boundary${dragging ? ' is-dragging' : ''}`}
              style={{ left: edge }}
              role="slider"
              tabIndex={measurementReady ? 0 : -1}
              aria-disabled={!measurementReady}
              aria-label="Available text width"
              aria-valuemin={MIN_WIDTH}
              aria-valuemax={maximumWidth}
              aria-valuenow={availableWidth}
              aria-valuetext={measurementReady ? `${availableWidth} pixels available width, ${lineCount} lines` : `${availableWidth} pixels available width, measurement loading`}
              onPointerDown={event => {
                if (!measurementReady || (event.button !== undefined && event.button !== 0)) return
                if (activePointerRef.current !== null && activePointerRef.current !== event.pointerId) return
                activePointerRef.current = event.pointerId
                setDragging(true)
                event.currentTarget.focus({ preventScroll: true })
                try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* unit environments may not implement capture */ }
                updateWidth(widthFromPointer(event.clientX))
                event.preventDefault()
              }}
              onPointerMove={event => {
                if (activePointerRef.current === event.pointerId) updateWidth(widthFromPointer(event.clientX))
              }}
              onPointerUp={stopDragging}
              onPointerCancel={stopDragging}
              onLostPointerCapture={event => {
                if (activePointerRef.current !== event.pointerId) return
                activePointerRef.current = null
                setDragging(false)
              }}
              onKeyDown={event => {
                if (!measurementReady) return
                const { min, max } = getBounds()
                const step = event.shiftKey ? 16 : 4
                let next = availableWidth
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= step
                else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += step
                else if (event.key === 'Home') next = min
                else if (event.key === 'End') next = max
                else return
                event.preventDefault()
                updateWidth(next)
              }}
            >
              <span className="landing-pretext__grip" aria-hidden="true">↔</span>
            </div>
          )}
        </div>
        <figcaption className="landing-pretext__caption">
          <p><strong data-pretext-widest>{measurementFailed ? 'Measurement unavailable.' : measurement ? `Widest line ${Math.round(measurement.maxLineWidth)}px.` : 'Measuring lines.'}</strong> {BRIDGE}</p>
          <a href="https://chenglou.me/pretext/" target="_blank" rel="noreferrer">Explore Pretext’s live demos ↗</a>
        </figcaption>
      </div>
    </figure>
  )
}
