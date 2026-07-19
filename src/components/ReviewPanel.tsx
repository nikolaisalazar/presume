import type {
  ReviewAdjustment,
  ReviewAnnotation,
  ReviewAnnotationSeverity,
  ReviewResult,
} from '../reviewTypes'
import type { ResumeReviewState } from '../useResumeReview'
import { forwardRef, useEffect, useState } from 'react'
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

interface ReviewPanelProps {
  id?: string
  state: ResumeReviewState
  onRequestReview: () => void
  pdfReady?: boolean
  onClose?: () => void
  hidden?: boolean
}

export const ReviewPanel = forwardRef<HTMLElement, ReviewPanelProps>(function ReviewPanel(
  { id, state, onRequestReview, pdfReady = true, onClose, hidden },
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
      <Card variant="reviewPanel" className="review-panel__shell max-h-[inherit] overflow-auto">
        <CardHeader className="review-panel__header border-b">
          <CardTitle className="review-panel__title"><h2>Review</h2></CardTitle>
          <CardDescription className="review-panel__description">Advisory evaluation</CardDescription>
          <CardAction className="review-panel__actions flex flex-wrap justify-end gap-2">
            <Button
              size="editor"
              onClick={onRequestReview}
              disabled={actionDisabled}
            >
              {isLoading ? 'Reviewing' : 'Review resume'}
            </Button>
            {onClose ? (
              <Button
                variant="outline"
                size="editor"
                onClick={onClose}
                aria-label="Collapse review"
                aria-controls={id}
                aria-expanded="true"
              >
                Collapse
              </Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="review-panel__content flex flex-col gap-4">
          {renderReviewStateAlert(state, result, resultIsStale)}
          {result ? <ReviewResultDetails state={state} /> : null}
        </CardContent>
      </Card>
    </aside>
  )
})

function ReviewResultDetails({ state }: { state: ResumeReviewState }) {
  const result = 'result' in state ? state.result : undefined
  if (!result) return null
  const defaultCategoryKey = selectLargestDeficitCategory(result.categories)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(defaultCategoryKey)

  useEffect(() => {
    setSelectedCategoryKey(selectLargestDeficitCategory(result.categories))
  }, [result.id])

  useEffect(() => {
    setSelectedCategoryKey(selectedKey =>
      selectedKey && result.categories.some(category => category.key === selectedKey)
        ? selectedKey
        : selectLargestDeficitCategory(result.categories)
    )
  }, [result.categories])

  return (
    <div className="review-report">
      <ReviewScore result={result} />
      <ReviewCategorySelector
        categories={result.categories}
        selectedKey={selectedCategoryKey}
        onSelect={setSelectedCategoryKey}
      />
      <ReviewAdjustmentLedger bonuses={result.bonuses} deductions={result.deductions} />
      <ReviewFindings
        improvements={result.improvements}
        strengths={result.strengths}
        annotations={result.annotations}
      />
      {hasNoDetailedFindings(result) ? (
        <p className="review-empty-result">
          No detailed findings returned.
        </p>
      ) : null}
    </div>
  )
}

function ReviewScore({ result }: { result: { totalScore: number; maxScore: number; tier: string } }) {
  return (
    <section className="review-overall" aria-labelledby="review-overall-heading">
      <div className="review-overall__primary">
        <h3 id="review-overall-heading" className="review-section-heading">Overall score</h3>
        <span className="review-overall__score">{result.totalScore} / {result.maxScore}</span>
      </div>
      <Badge variant="reviewTier" className="whitespace-nowrap">
        {formatTier(result.tier)}
      </Badge>
      <p>Advisory score, not an ATS guarantee.</p>
    </section>
  )
}

function ReviewList({
  title,
  items,
  compact = false,
  headingLevel = 3,
}: {
  title: string
  items: string[]
  compact?: boolean
  headingLevel?: 3 | 4
}) {
  if (items.length === 0) return null
  const Heading = headingLevel === 4 ? 'h4' : 'h3'

  return (
    <section className={compact ? 'review-list review-list--compact' : 'review-list'}>
      <Heading className="review-subsection-heading">{title}</Heading>
      <ul>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
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
          <span className="review-adjustments__side">
            <span>Bonus</span>
            {' '}
            <strong>{formatSignedPoints(totalAdjustmentPoints(bonuses))}</strong>
          </span>
        ) : null}
        {hasBonuses && hasDeductions ? (
          <Separator orientation="vertical" className="review-adjustments__separator" />
        ) : null}
        {hasDeductions ? (
          <span className="review-adjustments__side review-adjustments__side--deduction">
            <span>Deductions</span>
            {' '}
            <strong>{formatSignedPoints(totalAdjustmentPoints(deductions))}</strong>
          </span>
        ) : null}
      </div>
      <ReviewAdjustmentDetails bonuses={bonuses} deductions={deductions} />
    </section>
  )
}

function ReviewDisclosure({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <Collapsible className="review-disclosure" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="review-disclosure__trigger">
        <span>{title}</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="review-disclosure__list">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ReviewAdjustmentDetails({ bonuses, deductions }: {
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
}) {
  const [open, setOpen] = useState(false)
  const adjustments = [...bonuses, ...deductions]
  if (adjustments.length === 0) return null
  return (
    <Collapsible className="review-disclosure review-adjustment-details" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="review-disclosure__trigger">
        <span>Adjustment details</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
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

function ReviewAnnotationLegend({
  annotations,
}: {
  annotations: ReviewAnnotation[]
}) {
  if (annotations.length === 0) return null

  return (
    <div className="review-annotation-legend">
      <p>Annotation legend</p>
      <div className="review-annotation-legend__items" aria-label="Annotation legend">
        <ReviewSeverityLegendItem severity="warning" label="Needs attention" />
        <ReviewSeverityLegendItem severity="info" label="Context" />
        <ReviewSeverityLegendItem severity="strong" label="Strength" />
      </div>
    </div>
  )
}

function ReviewSeverityLegendItem({
  severity,
  label,
}: {
  severity: ReviewAnnotationSeverity
  label: string
}) {
  return (
    <span className="review-annotation-legend__item">
      <span
        className={`review-annotation-marker review-annotation--${severity}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

function ReviewFindings({
  improvements,
  strengths,
  annotations,
}: {
  improvements: string[]
  strengths: string[]
  annotations: ReviewAnnotation[]
}) {
  if (improvements.length === 0 && strengths.length === 0 && annotations.length === 0) {
    return null
  }

  return (
    <section className="review-findings" aria-labelledby="review-findings-heading">
      <h3 id="review-findings-heading" className="review-section-heading">Findings</h3>
      <ReviewList
        title="Areas for improvement"
        items={improvements}
        headingLevel={4}
      />
      <ReviewDisclosure title="Key strengths" items={strengths} />
      {annotations.length > 0 ? (
        <section className="review-annotations" aria-labelledby="review-annotations-heading">
          <h4 id="review-annotations-heading" className="review-subsection-heading">
            Annotations
          </h4>
          <ReviewAnnotationLegend annotations={annotations} />
          <ul className="review-annotations__list">
            {annotations.map(annotation => (
              <li key={annotation.id}>
                <div className="review-annotation__meta">
                  <Badge variant={getSeverityBadgeVariant(annotation.severity)}>
                    {formatSeverity(annotation.severity)}
                  </Badge>
                  <span>{formatAnnotationTarget(annotation)}</span>
                </div>
                <p>{annotation.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
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
