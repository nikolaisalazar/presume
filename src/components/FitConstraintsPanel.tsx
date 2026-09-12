import type { Constraints } from '../types'
import { FormattingWarningSummary } from './FormattingWarningSummary'
import { SettingsPanel } from './SettingsPanel'

interface FitConstraintsPanelProps {
  constraints: Constraints
  onStep: (key: import('../constraints').ConstraintKey, delta: number) => void
  onGestureStart: (key: import('../constraints').ConstraintKey) => void
  onGestureEnd: () => void
  bulletWarningCount: number
  hasGlobalOverflow: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FitConstraintsPanel({
  constraints,
  onStep,
  onGestureStart,
  onGestureEnd,
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
        onStep={onStep}
        onGestureStart={onGestureStart}
        onGestureEnd={onGestureEnd}
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
