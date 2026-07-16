import { cn } from '@/lib/utils'
import type { ResumeReviewState } from '../useResumeReview'
import { Button } from './ui/button'

export type ReviewRailAction = 'request' | 'open' | 'none'
export type ReviewRailTone = 'default' | 'success' | 'warning' | 'destructive'

export interface ReviewRailPresentation {
  label: string
  detail?: string
  score?: string
  action: ReviewRailAction
  actionLabel?: 'Start' | 'View' | 'Details'
  tone: ReviewRailTone
  loading: boolean
}

export interface ReviewRailProps {
  state: ResumeReviewState
  panelId: string
  onOpenPanel: () => void
  onRequestReview: () => void
  pdfReady?: boolean
  actionRef?: React.Ref<HTMLElement>
  hidden?: boolean
}

function score(result: { totalScore: number; maxScore: number } | undefined) {
  return result ? `${result.totalScore} / ${result.maxScore}` : undefined
}

export function getReviewRailPresentation(
  state: ResumeReviewState
): ReviewRailPresentation {
  switch (state.status) {
    case 'unconfigured':
      return { label: 'Review unavailable', action: 'open', actionLabel: 'Details', tone: 'warning', loading: false }
    case 'checking':
      return { label: 'Checking review', detail: 'Checking availability', action: 'none', tone: 'default', loading: false }
    case 'disabled':
      return { label: 'Review unavailable', action: 'open', actionLabel: 'Details', tone: 'warning', loading: false }
    case 'config_error':
      return { label: 'Review unavailable', detail: 'Connection issue', action: 'open', actionLabel: 'Details', tone: 'destructive', loading: false }
    case 'idle':
      return { label: 'Review resume', detail: 'Advisory check', action: 'request', actionLabel: 'Start', tone: 'default', loading: false }
    case 'loading':
      return state.result
        ? { label: 'Updating review', detail: 'Previous result available', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'default', loading: true }
        : { label: 'Reviewing', detail: 'In progress', action: 'none', tone: 'default', loading: true }
    case 'success':
      return { label: 'Review ready', detail: 'Advisory result', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'success', loading: false }
    case 'stale':
      return { label: 'Review stale', detail: 'Resume changed', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'warning', loading: false }
    case 'error':
      return state.result
        ? { label: 'Update failed', detail: 'Previous result available', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'destructive', loading: false }
        : { label: 'Review failed', detail: 'Open for details', action: 'open', actionLabel: 'Details', tone: 'destructive', loading: false }
  }
}

export function ReviewRail({
  state,
  panelId,
  onOpenPanel,
  onRequestReview,
  pdfReady = true,
  actionRef,
  hidden,
}: ReviewRailProps) {
  const presentation = getReviewRailPresentation(state)
  const action = presentation.action === 'request' ? onRequestReview : onOpenPanel
  const accessibleAction = presentation.actionLabel === 'Start'
    ? 'Start review'
    : presentation.actionLabel === 'View'
      ? 'View review'
      : 'Review details'

  return (
    <section
      className={cn(
        'review-rail relative flex h-[52px] min-w-0 items-center gap-2 overflow-hidden rounded-lg border bg-background px-3 shadow-[var(--shadow-panel)]',
        presentation.tone === 'success' && 'border-review-success-border bg-review-success-bg text-review-success-ink',
        presentation.tone === 'warning' && 'border-warning-border bg-warning-bg text-warning-ink',
        presentation.tone === 'destructive' && 'border-destructive/40 bg-destructive/10 text-destructive'
      )}
      aria-label="Resume review"
      aria-busy={presentation.loading || undefined}
      data-slot="review-rail"
      data-tone={presentation.tone}
      hidden={hidden}
      {...(presentation.loading ? { 'data-loading': '' } : {})}
    >
      <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
        <strong className="truncate text-[13px] font-bold">{presentation.label}</strong>
        {presentation.detail ? (
          <span className="truncate text-xs font-semibold opacity-75">{presentation.detail}</span>
        ) : null}
      </div>
      {presentation.score ? (
        <strong className="min-w-[58px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums">
          {presentation.score}
        </strong>
      ) : null}
      {presentation.action !== 'none' ? (
        <Button
          ref={actionRef}
          variant="outline"
          size="editor"
          className="shrink-0"
          onClick={action}
          disabled={presentation.action === 'request' && !pdfReady}
          aria-label={accessibleAction}
          aria-controls={presentation.action === 'open' ? panelId : undefined}
          aria-expanded={presentation.action === 'open' ? false : undefined}
        >
          {presentation.actionLabel}
        </Button>
      ) : null}
      {presentation.loading ? <span className="review-rail__progress" aria-hidden="true" /> : null}
      <span className="sr-only" aria-live="polite">
        {presentation.label}{presentation.detail ? `, ${presentation.detail}` : ''}
        {presentation.score ? `, ${presentation.score}` : ''}
      </span>
    </section>
  )
}
