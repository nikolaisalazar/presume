import type { Constraints } from '../types'

interface FormattingWarningSummaryProps {
  warningCount: number
  constraints: Constraints
}

export function FormattingWarningSummary({
  warningCount,
  constraints,
}: FormattingWarningSummaryProps) {
  if (warningCount === 0) return null

  const bulletLabel = warningCount === 1 ? 'bullet exceeds' : 'bullets exceed'
  const lineLabel =
    constraints.maxLinesPerBullet === 1
      ? '1 line per bullet'
      : `${constraints.maxLinesPerBullet} lines per bullet`

  return (
    <div className="formatting-warning-summary" role="status" aria-live="polite">
      <strong>Cannot fit under current constraints</strong>
      <p>
        {warningCount} {bulletLabel} {lineLabel} even at the{' '}
        {constraints.minFontSize}px minimum. Shorten it or loosen constraints.
      </p>
    </div>
  )
}
