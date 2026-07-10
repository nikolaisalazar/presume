import type { ResumeReviewState } from '../useResumeReview'
import { Button } from './ui/button'

interface ReviewStatusControlProps {
  state: ResumeReviewState
  panelOpen: boolean
  panelDismissedKey: string | null
  panelId?: string
  onTogglePanel: () => void
  onRequestReview: () => void
}

export function shouldShowReviewPanel(
  state: ResumeReviewState,
  panelOpen: boolean,
  panelDismissedKey: string | null
): boolean {
  if (state.status === 'unconfigured') return false
  if (panelOpen) return true

  const usefulKey = getUsefulReviewPanelKey(state)
  return Boolean(usefulKey && usefulKey !== panelDismissedKey)
}

export function getUsefulReviewPanelKey(
  state: ResumeReviewState
): string | null {
  if (state.status === 'loading') {
    return `loading:${getResultKey(state.result)}`
  }

  if (state.status === 'success') {
    return `success:${getResultKey(state.result)}`
  }

  if (state.status === 'stale') {
    return `stale:${getResultKey(state.result)}`
  }

  if (state.status === 'error' && state.result) {
    return `error:${getResultKey(state.result)}:${state.error.message}`
  }

  return null
}

export function canToggleReviewPanel(state: ResumeReviewState): boolean {
  return (
    state.status === 'disabled' ||
    state.status === 'config_error' ||
    state.status === 'loading' ||
    state.status === 'success' ||
    state.status === 'stale' ||
    state.status === 'error'
  )
}

export function getReviewButtonVariant(state: ResumeReviewState) {
  switch (state.status) {
    case 'success': return 'reviewSuccess' as const
    case 'stale':
    case 'disabled': return 'reviewWarning' as const
    case 'error':
    case 'config_error': return 'reviewError' as const
    default: return 'review' as const
  }
}

export function ReviewStatusControl({
  state,
  panelOpen,
  panelDismissedKey,
  panelId,
  onTogglePanel,
  onRequestReview,
}: ReviewStatusControlProps) {
  if (state.status === 'unconfigured') return null

  if (state.status === 'idle') {
    return (
      <Button
        className="review-status-control"
        variant={getReviewButtonVariant(state)}
        size="editor"
        onClick={onRequestReview}
      >
        Review resume
      </Button>
    )
  }

  const panelVisible = shouldShowReviewPanel(
    state,
    panelOpen,
    panelDismissedKey
  )
  const canToggle = canToggleReviewPanel(state)

  return (
    <Button
      className="review-status-control"
      variant={getReviewButtonVariant(state)}
      size="editor"
      onClick={canToggle ? onTogglePanel : undefined}
      disabled={!canToggle}
      aria-expanded={canToggle ? panelVisible : undefined}
      aria-controls={canToggle && panelId ? panelId : undefined}
      title={getReviewStatusDescription(state)}
      {...(state.status === 'loading' ? { 'data-loading': '' } : {})}
    >
      {getReviewStatusLabel(state)}
    </Button>
  )
}

function getResultKey(result: { id: string; reviewedAt: string } | undefined): string {
  return result ? `${result.id}:${result.reviewedAt}` : 'none'
}

function getReviewStatusLabel(state: ResumeReviewState): string {
  switch (state.status) {
    case 'checking':
      return 'Checking review'
    case 'disabled':
      return 'Review unavailable — setup needed'
    case 'config_error':
      return 'Review unavailable — connection issue'
    case 'loading':
      return 'Reviewing'
    case 'success':
      return 'View review'
    case 'stale':
      return 'Review stale'
    case 'error':
      return 'Review failed'
    default:
      return 'Review'
  }
}

function getReviewStatusDescription(state: ResumeReviewState): string | undefined {
  if (state.status === 'disabled') {
    return 'The configured review service is reachable, but review is disabled. Open for details.'
  }

  if (state.status === 'config_error') {
    return state.error.message
  }

  return undefined
}
