import type { ReviewAdjustment, ReviewCategory } from '../reviewTypes'
import type { ResumeReviewState } from '../useResumeReview'

interface ReviewPanelProps {
  state: ResumeReviewState
  onRequestReview: () => void
}

export function ReviewPanel({ state, onRequestReview }: ReviewPanelProps) {
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
    <aside className="review-panel" aria-label="Resume review">
      <div className="review-panel__header">
        <div>
          <h2>Review</h2>
          <span className="review-panel__advisory">Advisory only</span>
        </div>
        <button
          className="toolbar-btn review-panel__action"
          onClick={onRequestReview}
          disabled={actionDisabled}
        >
          {isLoading ? 'Reviewing...' : 'Review resume'}
        </button>
      </div>

      {state.status === 'unconfigured' ? (
        <ReviewEmptyState
          title="Review service not configured"
          message="Set VITE_REVIEW_API_URL to enable advisory resume review."
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
          message="The configured review service is not ready to review resumes."
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
        <ReviewStatus message="Review is stale" tone="stale" />
      ) : null}

      {state.status === 'error' ? (
        <ReviewStatus message={state.error.message} tone="error" />
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
        <span className="review-score__value">
          {result.totalScore} / {result.maxScore}
        </span>
        <span className="review-score__tier">{formatTier(result.tier)}</span>
      </div>

      <ReviewCategories categories={result.categories} />
      <ReviewList title="Strengths" items={result.strengths} />
      <ReviewList title="Improvements" items={result.improvements} />
      <ReviewAdjustments title="Bonuses" adjustments={result.bonuses} />
      <ReviewAdjustments title="Deductions" adjustments={result.deductions} />
      <ReviewList
        title="Findings"
        items={result.annotations.map(annotation => annotation.message)}
      />
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
          <ReviewList title="Evidence" items={category.evidence} compact />
          <ReviewList title="Suggestions" items={category.suggestions} compact />
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
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'neutral' | 'stale' | 'error'
}) {
  return <p className={`review-status review-status--${tone}`}>{message}</p>
}

function formatTier(tier: string): string {
  return tier
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
