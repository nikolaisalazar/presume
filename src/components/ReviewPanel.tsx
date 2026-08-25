import type {
  ReviewAdjustment,
  ReviewAnnotation,
  ReviewAnnotationSeverity,
  ReviewResult,
} from '../reviewTypes'
import type { ResumeReviewState } from '../useResumeReview'
import { Info, PanelRightClose, RotateCcw } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import {
  ReviewCategorySelector,
  selectLargestDeficitCategory,
} from './ReviewCategorySelector'
import { Button } from './ui/button'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface ReviewPanelProps {
  id?: string
  state: ResumeReviewState
  onRequestReview: () => void
  pdfReady?: boolean
  onClose?: () => void
  hidden?: boolean
  onFocusAnnotation?: (annotation: ReviewAnnotation) => void
}

export const ReviewPanel = forwardRef<HTMLElement, ReviewPanelProps>(function ReviewPanel(
  {
    id,
    state,
    onRequestReview,
    pdfReady = true,
    onClose,
    hidden,
    onFocusAnnotation,
  },
  ref
) {
  const result = 'result' in state ? state.result : undefined
  const resultIsStale =
    'resultIsStale' in state ? Boolean(state.resultIsStale) : false
  const isLoading = state.status === 'loading'
  const actionDisabled =
    !pdfReady ||
    state.status === 'unconfigured' ||
    state.status === 'checking' ||
    state.status === 'disabled' ||
    state.status === 'config_error' ||
    isLoading

  return (
    <aside
      ref={ref}
      id={id}
      className="review-panel"
      aria-label="Resume review"
      tabIndex={-1}
      hidden={hidden}
    >
      <Card
        variant="reviewPanel"
        className="review-panel__shell overflow-visible"
      >
        <CardHeader className="review-panel__header border-b">
          <CardTitle className="review-panel__title"><h2>Review</h2></CardTitle>
          <CardDescription className="review-panel__description">Advisory evaluation</CardDescription>
          <CardAction className="review-panel__actions flex flex-wrap justify-end gap-2">
            <Button
              size="editor"
              className="gap-1.5"
              onClick={onRequestReview}
              disabled={actionDisabled}
            >
              {result && !isLoading ? <RotateCcw aria-hidden="true" data-icon="inline-start" /> : null}
              {isLoading ? 'Reviewing' : result ? 'Review again' : 'Review resume'}
            </Button>
            {onClose ? (
              <Button
                variant="ghost"
                size="editor"
                onClick={onClose}
                aria-label="Collapse review"
                aria-controls={id}
                aria-expanded="true"
                className="review-panel__collapse gap-1.5"
              >
                <PanelRightClose aria-hidden="true" data-icon="inline-start" />
                Collapse
              </Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="review-panel__content flex flex-col gap-4">
          {renderReviewStateAlert(state, result, resultIsStale)}
          {result ? (
            <ReviewResultDetails
              state={state}
              onFocusAnnotation={onFocusAnnotation}
            />
          ) : null}
        </CardContent>
      </Card>
    </aside>
  )
})

type StagedReviewSection = 'summary' | 'annotations'

function ReviewResultDetails({
  state,
  onFocusAnnotation,
}: {
  state: ResumeReviewState
  onFocusAnnotation?: (annotation: ReviewAnnotation) => void
}) {
  const result = 'result' in state ? state.result : undefined
  if (!result) return null
  const defaultCategoryKey = selectLargestDeficitCategory(result.categories)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(defaultCategoryKey)
  const [stagedSection, setStagedSection] = useState<StagedReviewSection>('summary')
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(
    result.annotations[0]?.id ?? null
  )

  useEffect(() => {
    setSelectedCategoryKey(selectLargestDeficitCategory(result.categories))
    setStagedSection('summary')
    setSelectedAnnotationId(result.annotations[0]?.id ?? null)
  }, [result.id])

  useEffect(() => {
    setSelectedCategoryKey(selectedKey =>
      selectedKey && result.categories.some(category => category.key === selectedKey)
        ? selectedKey
        : selectLargestDeficitCategory(result.categories)
    )
  }, [result.categories])

  useEffect(() => {
    setSelectedAnnotationId(selectedId =>
      selectedId && result.annotations.some(annotation => annotation.id === selectedId)
        ? selectedId
        : result.annotations[0]?.id ?? null
    )
  }, [result.annotations])

  const categorySelector = (
    <ReviewCategorySelector
      categories={result.categories}
      selectedKey={selectedCategoryKey}
      onSelect={setSelectedCategoryKey}
      excludedSuggestions={result.improvements}
    />
  )

  return (
    <div className="review-report review-report--staged review-report--information">
      <ReviewStageNavigation
        value={stagedSection}
        onValueChange={setStagedSection}
      />
      <div className="review-stage-content" data-review-stage={stagedSection}>
        {stagedSection === 'summary' ? (
          <div className="review-stage-panel" data-review-stage="summary">
            <ReviewScore result={result} />
            {categorySelector}
            <ReviewAdjustmentLedger
              bonuses={result.bonuses}
              deductions={result.deductions}
            />
            <ReviewScoreDisclosures
              improvements={result.improvements}
              strengths={result.strengths}
            />
          </div>
        ) : null}
        {stagedSection === 'annotations' ? (
          <ReviewAnnotationExplorer
            annotations={result.annotations}
            selectedId={selectedAnnotationId}
            onSelect={annotation => {
              setSelectedAnnotationId(annotation.id)
              onFocusAnnotation?.(annotation)
            }}
          />
        ) : null}
      </div>
      {hasNoDetailedFindings(result) ? (
        <p className="review-empty-result">No detailed findings returned.</p>
      ) : null}
    </div>
  )
}

function ReviewStageNavigation({
  value,
  onValueChange,
}: {
  value: StagedReviewSection
  onValueChange: (value: StagedReviewSection) => void
}) {
  return (
    <ToggleGroup
      aria-label="Review report section"
      value={[value]}
      onValueChange={values => {
        const nextValue = values[0] as StagedReviewSection | undefined
        if (nextValue) onValueChange(nextValue)
      }}
      variant="outline"
      spacing={1}
      orientation="horizontal"
      className="review-stage-navigation"
    >
      {(['summary', 'annotations'] as StagedReviewSection[]).map(section => (
        <ToggleGroupItem key={section} value={section} aria-label={formatStageLabel(section)}>
          <span>{formatStageLabel(section)}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function formatStageLabel(section: StagedReviewSection) {
  const labels: Record<StagedReviewSection, string> = {
    summary: 'Score',
    annotations: 'Feedback',
  }
  return labels[section]
}

function ReviewAnnotationExplorer({
  annotations,
  selectedId,
  onSelect,
}: {
  annotations: ReviewAnnotation[]
  selectedId: string | null
  onSelect: (annotation: ReviewAnnotation) => void
}) {
  if (annotations.length === 0) {
    return (
      <section
        className="review-annotations"
        aria-labelledby="review-annotations-heading"
      >
        <h3 id="review-annotations-heading" className="sr-only">Review feedback</h3>
        <p className="review-category-detail__empty">No feedback returned.</p>
      </section>
    )
  }

  const selected = annotations.find(annotation => annotation.id === selectedId) ?? annotations[0]

  return (
    <section
      className="review-annotations review-annotation-explorer"
      aria-labelledby="review-annotations-heading"
      data-information-first="true"
    >
      <h3 id="review-annotations-heading" className="sr-only">Review feedback</h3>
      <div className="review-annotation-explorer__list">
        {annotations.map(annotation => (
          <Button
            key={annotation.id}
            type="button"
            variant="reviewCategory"
            className="review-annotation-explorer__item"
            aria-label={`${formatSeverity(annotation.severity)}: ${formatAnnotationMessage(annotation)}; ${formatAnnotationTarget(annotation)}`}
            aria-pressed={annotation.id === selected.id}
            onClick={() => onSelect(annotation)}
          >
            <span className="review-annotation-explorer__message">
              {formatAnnotationMessage(annotation)}
            </span>
            <Badge variant={getSeverityBadgeVariant(annotation.severity)}>
              {formatSeverity(annotation.severity)}
            </Badge>
          </Button>
        ))}
      </div>
    </section>
  )
}

function ReviewScore({ result }: { result: { totalScore: number; maxScore: number; tier: string } }) {
  const formattedTier = formatTier(result.tier)
  const advisoryTooltipId = useId()

  return (
    <section className="review-overall" aria-labelledby="review-overall-heading">
      <div className="review-overall__primary">
        <h3 id="review-overall-heading" className="sr-only">Overall score</h3>
        <span
          className="review-overall__score"
          data-review-tier={result.tier}
          aria-label={`${result.totalScore} out of ${result.maxScore}, ${formattedTier}`}
        >
          {result.totalScore} / {result.maxScore}
        </span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="review-overall__info"
                aria-label="About this advisory score"
                aria-describedby={advisoryTooltipId}
              />
            }
          >
            <Info aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent
            id={advisoryTooltipId}
            role="tooltip"
            side="bottom"
            align="end"
          >
            Advisory score, not an ATS guarantee.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </section>
  )
}

function totalAdjustmentPoints(adjustments: ReviewAdjustment[]): number {
  return adjustments.reduce((total, adjustment) => total + adjustment.points, 0)
}

function formatSignedPoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return `−${-points}`
  return '0'
}

function ReviewAdjustmentLedger({ bonuses, deductions }: {
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
}) {
  if (bonuses.length === 0 && deductions.length === 0) return null
  const hasBonuses = bonuses.length > 0
  const hasDeductions = deductions.length > 0

  return (
    <section className="review-adjustments" aria-labelledby="review-adjustments-heading">
      <h3 id="review-adjustments-heading" className="review-section-heading">
        Score adjustments
      </h3>
      <div className="review-adjustments__summary">
        {hasBonuses ? (
          <div className="review-adjustments__side">
            <span className="review-adjustments__side-heading">
              <span>Bonus</span>
              {' '}
              <strong>{formatSignedPoints(totalAdjustmentPoints(bonuses))}</strong>
            </span>
          </div>
        ) : null}
        {hasBonuses && hasDeductions ? (
          <Separator orientation="vertical" className="review-adjustments__separator" />
        ) : null}
        {hasDeductions ? (
          <div className="review-adjustments__side review-adjustments__side--deduction">
            <span className="review-adjustments__side-heading">
              <span>Deductions</span>
              {' '}
              <strong>{formatSignedPoints(totalAdjustmentPoints(deductions))}</strong>
            </span>
          </div>
        ) : null}
      </div>
      <ReviewAdjustmentDetails bonuses={bonuses} deductions={deductions} />
    </section>
  )
}

function ReviewDisclosure({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  const contentRef = useDisclosureReveal(open)
  if (items.length === 0) return null
  return (
    <Collapsible className="review-disclosure" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="review-disclosure__trigger">
        <span>{title}</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent ref={contentRef}>
        <ul className="review-disclosure__list">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ReviewScoreDisclosures({
  improvements,
  strengths,
}: {
  improvements: string[]
  strengths: string[]
}) {
  if (improvements.length === 0 && strengths.length === 0) return null

  return (
    <section className="review-score-disclosures" aria-label="Additional review findings">
      <ReviewDisclosure
        title={`Overall recommendations (${improvements.length})`}
        items={improvements}
      />
      <ReviewDisclosure
        title={`What already works (${strengths.length})`}
        items={strengths}
      />
    </section>
  )
}

function ReviewAdjustmentDetails({ bonuses, deductions }: {
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
}) {
  const [open, setOpen] = useState(false)
  const contentRef = useDisclosureReveal(open)
  const adjustments = [...bonuses, ...deductions]
  if (adjustments.length === 0) return null
  return (
    <Collapsible className="review-disclosure review-adjustment-details" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="review-disclosure__trigger">
        <span>Adjustment details</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent ref={contentRef}>
        <ul className="review-adjustment-details__list">
          {adjustments.map((adjustment, index) => (
            <li key={`${adjustment.label}-${index}`}>
              <div>
                <span>{adjustment.label}</span>{' '}
                <span>({formatSignedPoints(adjustment.points)})</span>
              </div>
              {adjustment.evidence ? <p>{adjustment.evidence}</p> : null}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function useDisclosureReveal(open: boolean) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    contentRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' })
  }, [open])

  return contentRef
}

function ReviewStateAlert({
  title,
  message,
  detail,
  variant = 'default',
}: {
  title?: string
  message: string
  detail?: string
  variant?: 'default' | 'reviewWarning' | 'destructive'
}) {
  return (
    <Alert variant={variant}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>
        <p>{message}</p>
        {detail ? <p>{detail}</p> : null}
      </AlertDescription>
    </Alert>
  )
}

function renderReviewStateAlert(
  state: ResumeReviewState,
  result: ReviewResult | undefined,
  resultIsStale: boolean
) {
  switch (state.status) {
    case 'unconfigured': return <ReviewStateAlert title="Review service not configured" message="Set VITE_REVIEW_API_URL and start the review service to enable advisory resume review." variant="reviewWarning" />
    case 'checking': return <ReviewStateAlert title="Checking review service" message="Review availability is being checked." />
    case 'disabled': return <ReviewStateAlert title="Review service unavailable" message="The configured service is reachable, but review is disabled. Check provider setup and Hiring Agent readiness." variant="reviewWarning" />
    case 'config_error': return <ReviewStateAlert title="Review service unavailable" message={state.error.message} variant="destructive" />
    case 'idle': return <ReviewStateAlert title="Ready for review" message="Run a review to see score, evidence, and annotations." />
    case 'loading': return <ReviewStateAlert message="Review request is in progress." />
    case 'stale': return <ReviewStateAlert title="Review is stale" message="Previous results are still shown. Re-run review after editing." variant="reviewWarning" />
    case 'error': return (
      <>
        <ReviewStateAlert title="Review request failed" message={state.error.message} detail={result && !resultIsStale ? 'Previous results remain visible below.' : undefined} variant="destructive" />
        {result && resultIsStale ? <ReviewStateAlert title="Review is stale" message="Previous results are still shown. Re-run review after editing." variant="reviewWarning" /> : null}
      </>
    )
    case 'success': return resultIsStale ? <ReviewStateAlert title="Review is stale" message="Previous results are still shown. Re-run review after editing." variant="reviewWarning" /> : null
  }
}

function formatTier(tier: string): string {
  return tier
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatSeverity(severity: ReviewAnnotationSeverity): string {
  if (severity === 'warning') return 'Needs attention'
  if (severity === 'strong') return 'Strength'
  return 'Context'
}

function formatAnnotationMessage(annotation: ReviewAnnotation): string {
  const severityPrefix = {
    warning: /^needs attention:\s*/i,
    strong: /^(?:strong|strength):\s*/i,
    info: /^context:\s*/i,
  }[annotation.severity]
  const message = annotation.message.replace(severityPrefix, '').trim()

  if (!message) return annotation.message

  return message.charAt(0).toUpperCase() + message.slice(1)
}

function getSeverityBadgeVariant(
  severity: ReviewAnnotationSeverity
): 'reviewWarning' | 'reviewInfo' | 'reviewStrong' {
  if (severity === 'warning') return 'reviewWarning'
  if (severity === 'strong') return 'reviewStrong'
  return 'reviewInfo'
}

function formatAnnotationTarget(annotation: ReviewAnnotation): string {
  if (!annotation.sectionTitle) {
    return 'Target not matched inline'
  }

  const parts = [annotation.sectionTitle, annotation.entryTitle].filter(
    Boolean
  )

  return parts.join(' / ')
}

function hasNoDetailedFindings(result: {
  categories: { length: number }
  strengths: string[]
  improvements: string[]
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
  annotations: ReviewAnnotation[]
}): boolean {
  return (
    result.categories.length === 0 &&
    result.strengths.length === 0 &&
    result.improvements.length === 0 &&
    result.bonuses.length === 0 &&
    result.deductions.length === 0 &&
    result.annotations.length === 0
  )
}
