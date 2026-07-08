import type { Constraints } from '../types'

interface FormattingWarningSummaryProps {
  bulletWarningCount: number
  hasGlobalOverflow: boolean
  constraints: Constraints
}

export function FormattingWarningSummary({
  bulletWarningCount,
  hasGlobalOverflow,
  constraints,
}: FormattingWarningSummaryProps) {
  if (bulletWarningCount === 0 && !hasGlobalOverflow) return null

  const lineLabel =
    constraints.maxLinesPerBullet === 1
      ? '1 line per bullet'
      : `${constraints.maxLinesPerBullet} lines per bullet`

  return (
    <div className="formatting-warning-summary" role="status" aria-live="polite">
      <strong>Cannot fit under current constraints</strong>
      {hasGlobalOverflow ? (
        <p>
          The resume exceeds {constraints.maxPages}{' '}
          {constraints.maxPages === 1 ? 'page' : 'pages'} even at the{' '}
          {constraints.minFontSize}px minimum. Shorten content or loosen constraints.
        </p>
      ) : null}
      {bulletWarningCount > 0 ? (
        <p>
          {bulletWarningCount}{' '}
          {bulletWarningCount === 1 ? 'bullet exceeds' : 'bullets exceed'}{' '}
          {lineLabel} even at the {constraints.minFontSize}px minimum. Shorten{' '}
          {bulletWarningCount === 1 ? 'it' : 'them'} or loosen constraints.
        </p>
      ) : null}
    </div>
  )
}
