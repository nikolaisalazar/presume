import type { Constraints } from '../types'
import { FormattingWarningSummary } from './FormattingWarningSummary'
import { SettingsPanel } from './SettingsPanel'

interface FitConstraintsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
  bulletWarningCount: number
  hasGlobalOverflow: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FitConstraintsPanel({
  constraints,
  onChange,
  bulletWarningCount,
  hasGlobalOverflow,
  open,
  onOpenChange,
}: FitConstraintsPanelProps) {
  return (
    <aside
      className="fit-region min-w-0 overflow-visible rounded-[var(--radius-structural)] border border-border bg-surface shadow-[var(--shadow-structural)]"
      aria-label="Fit constraints and formatting"
      data-slot="fit-region"
    >
      <SettingsPanel
        constraints={constraints}
        onChange={onChange}
        open={open}
        onOpenChange={onOpenChange}
      />
      <FormattingWarningSummary
        bulletWarningCount={bulletWarningCount}
        hasGlobalOverflow={hasGlobalOverflow}
        constraints={constraints}
      />
    </aside>
  )
}
