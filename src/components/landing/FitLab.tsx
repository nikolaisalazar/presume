import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  FIT_LAB_TARGET_LINES,
  FIT_LAB_WIDTHS,
  measurePreparedFitLab,
  prepareFitLabText,
  type FitLabMeasurement,
  type FitLabWidth,
} from './fitLabMeasurement'

const INITIAL_TEXT =
  'A precise tool should make invisible constraints visible before they become surprises.'

type MeasurementState =
  | { status: 'waiting' }
  | { status: 'unavailable' }
  | { status: 'ready'; measurement: FitLabMeasurement }

function isFitLabWidth(value: string | undefined): value is `${FitLabWidth}` {
  return value !== undefined && FIT_LAB_WIDTHS.includes(Number(value) as FitLabWidth)
}

export function FitLab() {
  const [text, setText] = useState(INITIAL_TEXT)
  const [width, setWidth] = useState<FitLabWidth>(240)
  const [renderedWidth, setRenderedWidth] = useState<number>(width)
  const [fontsReady, setFontsReady] = useState(false)
  const constrainedTextRef = useRef<HTMLSpanElement>(null)

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
    const constrainedText = constrainedTextRef.current
    if (!constrainedText) return

    const syncRenderedWidth = () => {
      const nextWidth = Math.round(constrainedText.getBoundingClientRect().width)
      if (nextWidth > 0) {
        setRenderedWidth(currentWidth => (
          currentWidth === nextWidth ? currentWidth : nextWidth
        ))
      }
    }

    syncRenderedWidth()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(syncRenderedWidth)
    observer.observe(constrainedText)

    return () => observer.disconnect()
  }, [width])

  const preparation = useMemo(() => {
    if (!fontsReady) return null

    try {
      return prepareFitLabText(text)
    } catch {
      return 'unavailable' as const
    }
  }, [fontsReady, text])

  const measurementState = useMemo<MeasurementState>(() => {
    if (preparation === null) return { status: 'waiting' }
    if (preparation === 'unavailable') return { status: 'unavailable' }

    try {
      return {
        status: 'ready',
        measurement: measurePreparedFitLab(preparation, renderedWidth),
      }
    } catch {
      return { status: 'unavailable' }
    }
  }, [preparation, renderedWidth])

  const measurement =
    measurementState.status === 'ready' ? measurementState.measurement : null
  let statusLabel = 'Preparing measurement'
  if (measurementState.status === 'unavailable') {
    statusLabel = 'Measurement unavailable'
  } else if (measurementState.status === 'ready') {
    statusLabel =
      measurementState.measurement.status === 'within'
        ? 'Within constraint'
        : 'Over constraint'
  }
  const liveSummary = measurement
    ? `${statusLabel}. ${measurement.lineCount} ${measurement.lineCount === 1 ? 'line' : 'lines'}, ${measurement.maxLineWidth} pixel widest line, ${renderedWidth} pixel rendered width.`
    : measurementState.status === 'unavailable'
      ? 'Fit Lab measurement unavailable.'
      : 'Fit Lab is preparing measurement.'

  return (
    <section
      className="landing-fit-lab"
      aria-labelledby="pretext-fit-lab-title"
      data-slot="fit-lab"
    >
      <header className="landing-fit-lab__header">
        <p className="landing-kicker">Live measurement</p>
        <h2 id="pretext-fit-lab-title">Pretext Fit Lab</h2>
        <p>
          Change the text or its constraint. Presume measures the resulting line
          geometry without asking the document to guess.
        </p>
      </header>

      <div className="landing-fit-lab__workspace">
        <div className="landing-fit-lab__input">
          <label htmlFor="fit-lab-text">Text to measure</label>
          <Textarea
            id="fit-lab-text"
            value={text}
            onChange={event => setText(event.target.value)}
            rows={5}
          />

          <div className="landing-fit-lab__width-control">
            <span>Measurement width</span>
            <ToggleGroup
              className="landing-fit-lab__width-options"
              aria-label="Measurement width"
              value={[String(width)]}
              onValueChange={values => {
                const nextWidth = values[0]
                if (isFitLabWidth(nextWidth)) {
                  const selectedWidth = Number(nextWidth) as FitLabWidth
                  setWidth(selectedWidth)
                  setRenderedWidth(selectedWidth)
                }
              }}
              variant="outline"
              size="sm"
              spacing={0}
            >
              {FIT_LAB_WIDTHS.map(option => (
                <ToggleGroupItem key={option} value={String(option)}>
                  {option}px
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="landing-fit-lab__measurement">
          <div
            className="landing-fit-lab__constraint"
            style={{ '--fit-lab-width': `${width}px` } as CSSProperties}
          >
            <span
              ref={constrainedTextRef}
              data-slot="fit-lab-constrained-text"
            >
              {text}
            </span>
          </div>
          <p
            className="landing-fit-lab__status"
            data-status={measurement?.status ?? measurementState.status}
          >
            {statusLabel}
          </p>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {liveSummary}
          </span>
          <dl className="landing-fit-lab__metrics">
            <div>
              <dt>Rendered width</dt>
              <dd>{renderedWidth}px</dd>
            </div>
            <div>
              <dt>Measured</dt>
              <dd>{measurement ? `${measurement.lineCount} ${measurement.lineCount === 1 ? 'line' : 'lines'}` : '—'}</dd>
            </div>
            <div>
              <dt>Widest line</dt>
              <dd>{measurement ? `${measurement.maxLineWidth}px` : '—'}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{FIT_LAB_TARGET_LINES} line target</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
