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
      <Card size="sm" variant="reviewPanel" className="max-h-[inherit] overflow-auto">
        <CardHeader className="border-b">
          <CardTitle><h2>Review</h2></CardTitle>
          <CardDescription>Advisory evaluation</CardDescription>
          <CardAction className="flex flex-wrap justify-end gap-1.5">
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
        <CardContent className="flex flex-col gap-3">
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
    <div className="flex flex-col gap-3">
      <ReviewScore result={result} />
      <ReviewCategorySelector
        categories={result.categories}
        selectedKey={selectedCategoryKey}
        onSelect={setSelectedCategoryKey}
      />
      <ReviewAdjustmentLedger bonuses={result.bonuses} deductions={result.deductions} />
      <ReviewList title="Areas for improvement" items={result.improvements} />
      <ReviewFindings annotations={result.annotations} />
      <ReviewDisclosure title="Key strengths" items={result.strengths} />
      <ReviewAdjustmentDetails bonuses={result.bonuses} deductions={result.deductions} />
      {hasNoDetailedFindings(result) ? (
        <p className="rounded-[4px] border border-dashed border-border p-2.5 text-xs text-muted-foreground">
          No detailed findings returned.
        </p>
      ) : null}
    </div>
  )
}

function ReviewScore({ result }: { result: { totalScore: number; maxScore: number; tier: string } }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-primary/35 bg-primary/5 p-2.5">
      <div>
        <span className="block text-[22px] font-bold text-primary">{result.totalScore} / {result.maxScore}</span>
        <p className="mt-1 text-[11px] leading-tight text-primary">Advisory score, not an ATS guarantee.</p>
      </div>
      <Badge variant="reviewTier" className="whitespace-nowrap">
        {formatTier(result.tier)}
      </Badge>
    </div>
  )
}

function ReviewList({
  title,
  items,
  compact = false,
}: {
  title: string
  items: string[]
  compact?: boolean
}) {
  if (items.length === 0) return null

  return (
    <section className={compact ? 'flex flex-col gap-1' : 'flex flex-col gap-1.5'}>
      <h3 className="text-xs font-semibold">{title}</h3>
      <ul className="flex list-disc flex-col gap-1 pl-[18px] text-[13px] leading-snug text-muted-foreground">
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
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-border py-2 text-xs">
      {hasBonuses ? (
        <span>Bonus <strong className="text-primary">{formatSignedPoints(totalAdjustmentPoints(bonuses))}</strong></span>
      ) : null}
      {hasBonuses && hasDeductions ? (
        <Separator orientation="vertical" />
      ) : null}
      {hasDeductions ? (
        <span>Deductions <strong className="text-destructive">{formatSignedPoints(totalAdjustmentPoints(deductions))}</strong></span>
      ) : null}
    </div>
  )
}

function ReviewDisclosure({ title, items }: { title: string; items: string[] }) {
  const [open, setOpen] = useState(false)
  if (items.length === 0) return null
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold">
        <span>{title}</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent><ReviewList title={title} items={items} /></CollapsibleContent>
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-semibold">
        <span>Adjustment details</span><span>{open ? 'Hide' : 'Show'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-xs">
          {adjustments.map((adjustment, index) => (
            <li key={`${adjustment.label}-${index}`}>
              <span>{adjustment.label}</span>{' '}
              <span>({formatSignedPoints(adjustment.points)})</span>
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
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold">Annotation legend</h3>
      <div className="review-annotation-legend__items" aria-label="Annotation legend">
        <ReviewSeverityLegendItem severity="warning" label="Needs attention" />
        <ReviewSeverityLegendItem severity="info" label="Context" />
        <ReviewSeverityLegendItem severity="strong" label="Strength" />
      </div>
    </section>
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
  annotations,
}: {
  annotations: ReviewAnnotation[]
}) {
  if (annotations.length === 0) return null

  return (
    <section className="flex flex-col gap-1.5">
      <ReviewAnnotationLegend annotations={annotations} />
      <h3 className="text-xs font-semibold">Findings</h3>
      <ul className="flex list-none flex-col gap-2 p-0 text-[13px] leading-snug text-muted-foreground">
        {annotations.map(annotation => (
          <li key={annotation.id} className="rounded-md border bg-card p-2">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge variant={getSeverityBadgeVariant(annotation.severity)}>
                {formatSeverity(annotation.severity)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatAnnotationTarget(annotation)}
              </span>
            </div>
            <p>{annotation.message}</p>
          </li>
        ))}
      </ul>
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
