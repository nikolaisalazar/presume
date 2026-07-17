import type { Constraints } from '../types'
import { FormattingWarningSummary } from './FormattingWarningSummary'
import { SettingsPanel } from './SettingsPanel'

interface FitConstraintsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
  bulletWarningCount: number
  hasGlobalOverflow: boolean
}

export function FitConstraintsPanel({
  constraints,
  onChange,
  bulletWarningCount,
  hasGlobalOverflow,
}: FitConstraintsPanelProps) {
  return (
    <aside
      className="fit-region min-w-0 overflow-hidden rounded-[var(--radius-structural)] border border-border bg-background shadow-[var(--shadow-panel)]"
      aria-label="Fit constraints and formatting"
      data-slot="fit-region"
    >
      <SettingsPanel constraints={constraints} onChange={onChange} />
      <FormattingWarningSummary
        bulletWarningCount={bulletWarningCount}
        hasGlobalOverflow={hasGlobalOverflow}
        constraints={constraints}
      />
    </aside>
  )
}
