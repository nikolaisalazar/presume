import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Constraints } from '../types'
import {
  CONSTRAINT_LIMITS,
  updateConstraint,
  type ConstraintKey,
} from '../constraints'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible'

interface SettingsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
}

export function SettingsPanel({ constraints, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  const step = (key: ConstraintKey, delta: number) => {
    onChange(updateConstraint(constraints, key, constraints[key] + delta))
  }

  return (
    <Collapsible className="settings-panel" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between gap-1 px-2.5 py-3 text-left outline-none transition-colors duration-[var(--duration-standard)] ease-[var(--ease-standard)] hover:bg-surface-pressed focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-3 focus-visible:outline-ring focus-visible:ring-2 focus-visible:ring-focus-contrast motion-reduce:transition-none">
        <span className="shrink-0 text-[13px] font-bold">Fit constraints</span>
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {!open ? (
            <span className="min-w-0 truncate">
              {constraints.maxPages} page · {constraints.maxLinesPerBullet} line/bullet · {constraints.minFontSize}px min
            </span>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0 text-foreground transition-transform duration-[var(--duration-standard)] ease-[var(--ease-standard)] motion-reduce:transition-none',
              open && 'rotate-180'
            )}
            data-slot="fit-disclosure-icon"
            strokeWidth={2.25}
          />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        keepMounted
        className="h-[var(--collapsible-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-[180ms] ease-out data-[closed]:h-0 data-[closed]:opacity-0 motion-reduce:transition-none"
      >
        <div className="border-t border-border bg-surface-pressed px-4 py-2">
          <ConstraintStepper
            label="Page limit"
            value={constraints.maxPages}
            help="Number of resume pages"
            onDecrease={() => step('maxPages', -1)}
            onIncrease={() => step('maxPages', 1)}
            decreaseLabel="Decrease max pages"
            increaseLabel="Increase max pages"
            decreaseDisabled={
              constraints.maxPages <= CONSTRAINT_LIMITS.maxPages.min
            }
            increaseDisabled={
              constraints.maxPages >= CONSTRAINT_LIMITS.maxPages.max
            }
          />
          <ConstraintStepper
            label="Lines per bullet"
            value={constraints.maxLinesPerBullet}
            help="Maximum wrapped lines"
            onDecrease={() => step('maxLinesPerBullet', -1)}
            onIncrease={() => step('maxLinesPerBullet', 1)}
            decreaseLabel="Decrease max lines per bullet"
            increaseLabel="Increase max lines per bullet"
            decreaseDisabled={
              constraints.maxLinesPerBullet <=
              CONSTRAINT_LIMITS.maxLinesPerBullet.min
            }
            increaseDisabled={
              constraints.maxLinesPerBullet >=
              CONSTRAINT_LIMITS.maxLinesPerBullet.max
            }
          />
          <ConstraintStepper
            label="Minimum font size (px)"
            value={constraints.minFontSize}
            help="Do not shrink below"
            onDecrease={() => step('minFontSize', -1)}
            onIncrease={() => step('minFontSize', 1)}
            decreaseLabel="Decrease minimum font size"
            increaseLabel="Increase minimum font size"
            decreaseDisabled={
              constraints.minFontSize <= CONSTRAINT_LIMITS.minFontSize.min
            }
            increaseDisabled={
              constraints.minFontSize >= CONSTRAINT_LIMITS.minFontSize.max
            }
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface ConstraintStepperProps {
  label: string
  value: number
  help: string
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel: string
  increaseLabel: string
  decreaseDisabled: boolean
  increaseDisabled: boolean
}

function ConstraintStepper({
  label,
  value,
  help,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  decreaseDisabled,
  increaseDisabled,
}: ConstraintStepperProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
      <div className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        <small className="block text-[11px] leading-4 text-muted-foreground">{help}</small>
      </div>
      <div
        className="shrink-0 rounded-[var(--radius-control)] border border-border bg-surface-raised outline-none shadow-[var(--shadow-inset-edge)] focus-within:outline-2 focus-within:outline-solid focus-within:outline-offset-3 focus-within:outline-ring focus-within:ring-2 focus-within:ring-focus-contrast"
        aria-label={label}
        data-slot="constraint-stepper"
      >
        <div
          className="flex overflow-hidden rounded-[calc(var(--radius-control)-1px)]"
          data-slot="constraint-stepper-segments"
        >
          <button
            type="button"
            className="flex size-11 items-center justify-center border-0 bg-surface-raised text-sm font-bold outline-none transition-[background-color,color,transform] duration-[var(--duration-standard)] ease-[var(--ease-standard)] hover:bg-surface-pressed focus:z-10 focus:bg-accent focus:text-accent-foreground focus:shadow-[inset_0_0_0_2px_var(--focus-contrast)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none min-[561px]:size-9"
            onClick={onDecrease}
            disabled={decreaseDisabled}
            aria-label={decreaseLabel}
          >
            −
          </button>
          <span
            className="flex size-11 items-center justify-center border-x border-border bg-surface-pressed text-xs font-semibold tabular-nums min-[561px]:size-9"
            aria-live="polite"
            data-slot="constraint-stepper-value"
          >
            <strong>{value}</strong>
          </span>
          <button
            type="button"
            className="flex size-11 items-center justify-center border-0 bg-surface-raised text-sm font-bold outline-none transition-[background-color,color,transform] duration-[var(--duration-standard)] ease-[var(--ease-standard)] hover:bg-surface-pressed focus:z-10 focus:bg-accent focus:text-accent-foreground focus:shadow-[inset_0_0_0_2px_var(--focus-contrast)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none min-[561px]:size-9"
            onClick={onIncrease}
            disabled={increaseDisabled}
            aria-label={increaseLabel}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
