import type {
  ReviewAdjustment,
  ReviewAnnotation,
  ReviewAnnotationSeverity,
} from '../reviewTypes'
import type { ResumeReviewState } from '../useResumeReview'
import { useEffect, useState } from 'react'
import {
  ReviewCategorySelector,
  selectLargestDeficitCategory,
} from './ReviewCategorySelector'
import { Button } from './ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'

interface ReviewPanelProps {
  id?: string
  state: ResumeReviewState
  onRequestReview: () => void
  onClose?: () => void
}

export function ReviewPanel({ id, state, onRequestReview, onClose }: ReviewPanelProps) {
  const result = 'result' in state ? state.result : undefined
  const resultIsStale =
    'resultIsStale' in state ? state.resultIsStale : false
  const isLoading = state.status === 'loading'
  const actionDisabled =
    state.status === 'unconfigured' ||
    state.status === 'checking' ||
    state.status === 'disabled' ||
    state.status === 'config_error' ||
    isLoading

  return (
    <aside id={id} className="review-panel" aria-label="Resume review">
      <div className="review-panel__header">
        <div>
          <h2>Review</h2>
          <span className="review-panel__advisory">Advisory only</span>
        </div>
        <div className="review-panel__actions">
          <Button
            className="review-panel__action"
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
              aria-label="Close review panel"
            >
              Close
            </Button>
          ) : null}
        </div>
      </div>

      {state.status === 'unconfigured' ? (
        <ReviewEmptyState
          title="Review service not configured"
          message="Set VITE_REVIEW_API_URL and start the review service to enable advisory resume review."
        />
      ) : null}

      {state.status === 'checking' ? (
        <ReviewEmptyState
          title="Checking review service"
          message="Review availability is being checked."
        />
      ) : null}

      {state.status === 'disabled' ? (
        <ReviewEmptyState
          title="Review service unavailable"
          message="The configured service is reachable, but review is disabled. Check provider setup and Hiring Agent readiness."
        />
      ) : null}

      {state.status === 'config_error' ? (
        <ReviewEmptyState
          title="Review service unavailable"
          message={state.error.message}
        />
      ) : null}

      {state.status === 'idle' ? (
        <ReviewEmptyState
          title="Ready for review"
          message="Run a review to see score, evidence, and annotations."
        />
      ) : null}

      {state.status === 'loading' ? (
        <ReviewStatus message="Review request is in progress." />
      ) : null}

      {state.status === 'stale' || resultIsStale ? (
        <ReviewStatus
          title="Review is stale"
          message="Previous results are still shown. Re-run review after editing."
          tone="stale"
        />
      ) : null}

      {state.status === 'error' ? (
        <ReviewStatus
          title="Review request failed"
          message={state.error.message}
          detail={
            result
              ? resultIsStale
                ? 'Previous stale results remain visible below.'
                : 'Previous results remain visible below.'
              : undefined
          }
          tone="error"
        />
      ) : null}

      {result ? <ReviewResultDetails state={state} /> : null}
    </aside>
  )
}

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
    <div className="review-result flex flex-col gap-3">
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
    <div className="review-score">
      <div>
        <span className="review-score__value">{result.totalScore} / {result.maxScore}</span>
        <p className="review-score__note">Advisory score, not an ATS guarantee.</p>
      </div>
      <span className="review-score__tier">{formatTier(result.tier)}</span>
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
    <section className={compact ? 'review-section review-section--compact' : 'review-section'}>
      <h3>{title}</h3>
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

function ReviewAdjustmentLedger({ bonuses, deductions }: {
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
}) {
  if (bonuses.length === 0 && deductions.length === 0) return null
  const bonus = totalAdjustmentPoints(bonuses)
  const deduction = Math.abs(totalAdjustmentPoints(deductions))

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-border py-2 text-xs">
      <span>Bonus <strong className="text-primary">+{bonus}</strong></span>
      {' '}<span aria-hidden="true">·</span>{' '}
      <span>Deductions <strong className="text-destructive">−{deduction}</strong></span>
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
              <span>({adjustment.points > 0 ? '+' : ''}{adjustment.points})</span>
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
    <section className="review-section review-annotation-legend">
      <h3>Annotation legend</h3>
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
    <section className="review-section review-findings">
      <ReviewAnnotationLegend annotations={annotations} />
      <h3>Findings</h3>
      <ul>
        {annotations.map(annotation => (
          <li key={annotation.id} className="review-finding">
            <div className="review-finding__header">
              <span className={`review-finding__severity review-finding__severity--${annotation.severity}`}>
                {formatSeverity(annotation.severity)}
              </span>
              <span className="review-finding__target">
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

function ReviewEmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="review-empty">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  )
}

function ReviewStatus({
  title,
  message,
  detail,
  tone = 'neutral',
}: {
  title?: string
  message: string
  detail?: string
  tone?: 'neutral' | 'stale' | 'error'
}) {
  return (
    <div className={`review-status review-status--${tone}`}>
      {title ? <h3>{title}</h3> : null}
      <p>{message}</p>
      {detail ? <p>{detail}</p> : null}
    </div>
  )
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
