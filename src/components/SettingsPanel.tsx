import { useState } from 'react'
import type { Constraints } from '../types'
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

  const update = (key: keyof Constraints, value: number) => {
    onChange({ ...constraints, [key]: value })
  }

  const step = (key: keyof Constraints, delta: number, min: number, max: number) => {
    update(key, Math.min(max, Math.max(min, constraints[key] + delta)))
  }

  return (
    <Collapsible className="settings-panel" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-[13px] font-bold">Fit constraints</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {constraints.maxPages} page · {constraints.maxLinesPerBullet} line/bullet · {constraints.minFontSize}px min
          <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent
        keepMounted
        className="h-[var(--collapsible-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-[180ms] ease-out data-[closed]:h-0 data-[closed]:opacity-0 motion-reduce:transition-none"
      >
        <div className="border-t border-border bg-muted/30 px-4 py-2">
          <ConstraintStepper
            label="Page limit"
            value={constraints.maxPages}
            help="Number of resume pages"
            onDecrease={() => step('maxPages', -1, 1, 10)}
            onIncrease={() => step('maxPages', 1, 1, 10)}
            decreaseLabel="Decrease max pages"
            increaseLabel="Increase max pages"
            decreaseDisabled={constraints.maxPages <= 1}
            increaseDisabled={constraints.maxPages >= 10}
          />
          <ConstraintStepper
            label="Lines per bullet"
            value={constraints.maxLinesPerBullet}
            help="Maximum wrapped lines"
            onDecrease={() => step('maxLinesPerBullet', -1, 1, 10)}
            onIncrease={() => step('maxLinesPerBullet', 1, 1, 10)}
            decreaseLabel="Decrease max lines per bullet"
            increaseLabel="Increase max lines per bullet"
            decreaseDisabled={constraints.maxLinesPerBullet <= 1}
            increaseDisabled={constraints.maxLinesPerBullet >= 10}
          />
          <ConstraintStepper
            label="Minimum font size (px)"
            value={constraints.minFontSize}
            help="Do not shrink below"
            onDecrease={() => step('minFontSize', -1, 4, 16)}
            onIncrease={() => step('minFontSize', 1, 4, 16)}
            decreaseLabel="Decrease minimum font size"
            increaseLabel="Increase minimum font size"
            decreaseDisabled={constraints.minFontSize <= 4}
            increaseDisabled={constraints.minFontSize >= 16}
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
      <div className="flex shrink-0" aria-label={label}>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-l-[3px] border border-border bg-background text-sm font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 min-[561px]:h-9 min-[561px]:w-9"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          aria-label={decreaseLabel}
        >
          −
        </button>
        <span className="flex h-11 w-11 items-center justify-center border border-l-0 border-border bg-background text-xs min-[561px]:h-9 min-[561px]:w-9" aria-live="polite">
          <strong>{value}</strong>
        </span>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-r-[3px] border border-l-0 border-border bg-background text-sm font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 min-[561px]:h-9 min-[561px]:w-9"
          onClick={onIncrease}
          disabled={increaseDisabled}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
    </div>
  )
}
