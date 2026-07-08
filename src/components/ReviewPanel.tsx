import type {
  ReviewAdjustment,
  ReviewAnnotation,
  ReviewAnnotationSeverity,
  ReviewCategory,
} from '../reviewTypes'
import type { ResumeReviewState } from '../useResumeReview'

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
          <button
            className="toolbar-btn review-panel__action"
            onClick={onRequestReview}
            disabled={actionDisabled}
          >
            {isLoading ? 'Reviewing...' : 'Review resume'}
          </button>
          {onClose ? (
            <button
              className="toolbar-btn review-panel__close"
              onClick={onClose}
              aria-label="Close review panel"
            >
              Close
            </button>
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

  return (
    <div className="review-result">
      <div className="review-score">
        <div>
          <span className="review-score__value">
            {result.totalScore} / {result.maxScore}
          </span>
          <p className="review-score__note">Advisory score, not an ATS guarantee.</p>
        </div>
        <span className="review-score__tier">{formatTier(result.tier)}</span>
      </div>

      <ReviewCategories categories={result.categories} />
      <ReviewList title="Strengths" items={result.strengths} />
      <ReviewList title="Improvements" items={result.improvements} />
      <ReviewAdjustments title="Bonuses" adjustments={result.bonuses} />
      <ReviewAdjustments title="Deductions" adjustments={result.deductions} />
      <ReviewAnnotationLegend annotations={result.annotations} />
      <ReviewFindings annotations={result.annotations} />
      {hasNoDetailedFindings(result) ? (
        <p className="review-empty-detail">No detailed findings returned.</p>
      ) : null}
    </div>
  )
}

function ReviewCategories({ categories }: { categories: ReviewCategory[] }) {
  if (categories.length === 0) return null

  return (
    <section className="review-section">
      <h3>Categories</h3>
      {categories.map(category => (
        <article key={category.key} className="review-category">
          <div className="review-category__header">
            <span>{category.label}</span>
            <span>
              {category.score} / {category.maxScore}
            </span>
          </div>
          <div className="review-category__body">
            <ReviewList title="Evidence" items={category.evidence} compact />
            <ReviewList title="Suggestions" items={category.suggestions} compact />
          </div>
        </article>
      ))}
    </section>
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

function ReviewAdjustments({
  title,
  adjustments,
}: {
  title: string
  adjustments: ReviewAdjustment[]
}) {
  if (adjustments.length === 0) return null

  return (
    <section className="review-section">
      <h3>{title}</h3>
      <ul>
        {adjustments.map((adjustment, index) => (
          <li key={`${adjustment.label}-${index}`}>
            <span>{adjustment.label}</span>
            <span className="review-adjustment-points">
              {adjustment.points > 0 ? '+' : ''}
              {adjustment.points}
            </span>
            {adjustment.evidence ? <p>{adjustment.evidence}</p> : null}
          </li>
        ))}
      </ul>
    </section>
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
  categories: ReviewCategory[]
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
