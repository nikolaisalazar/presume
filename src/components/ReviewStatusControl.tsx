import type { ResumeReviewState } from '../useResumeReview'

interface ReviewStatusControlProps {
  state: ResumeReviewState
  panelOpen: boolean
  panelId?: string
  onTogglePanel: () => void
  onRequestReview: () => void
}

export function shouldShowReviewPanel(
  state: ResumeReviewState,
  panelOpen: boolean
): boolean {
  return state.status !== 'unconfigured' && panelOpen
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

export function ReviewStatusControl({
  state,
  panelOpen,
  panelId,
  onTogglePanel,
  onRequestReview,
}: ReviewStatusControlProps) {
  if (state.status === 'unconfigured') return null

  if (state.status === 'idle') {
    return (
      <button className="review-status-control" onClick={onRequestReview}>
        Review resume
      </button>
    )
  }

  const panelVisible = shouldShowReviewPanel(state, panelOpen)
  const canToggle = canToggleReviewPanel(state)

  return (
    <button
      className="review-status-control"
      onClick={canToggle ? onTogglePanel : undefined}
      disabled={!canToggle}
      aria-expanded={canToggle ? panelVisible : undefined}
      aria-controls={canToggle && panelId ? panelId : undefined}
      title={getReviewStatusDescription(state)}
    >
      {getReviewStatusLabel(state)}
    </button>
  )
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
      return 'Reviewing...'
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
