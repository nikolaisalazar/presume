import type { ResumeReviewState } from '../useResumeReview'

interface ReviewStatusControlProps {
  state: ResumeReviewState
  panelOpen: boolean
  onTogglePanel: () => void
  onRequestReview: () => void
}

export function shouldShowReviewPanel(
  state: ResumeReviewState,
  panelOpen: boolean
): boolean {
  if (state.status === 'unconfigured') return false
  if (panelOpen) return true
  if (state.status === 'loading') return true
  if (state.status === 'success') return true
  if (state.status === 'stale') return true
  if (state.status === 'error' && 'result' in state && state.result) return true
  return false
}

export function ReviewStatusControl({
  state,
  panelOpen,
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
  const disabled =
    state.status === 'checking' ||
    state.status === 'disabled' ||
    state.status === 'config_error' ||
    (state.status === 'loading' && !panelVisible)

  return (
    <button
      className="review-status-control"
      onClick={onTogglePanel}
      disabled={disabled && !panelVisible}
      aria-expanded={panelVisible}
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
      return 'Review unavailable'
    case 'config_error':
      return 'Review unavailable'
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
