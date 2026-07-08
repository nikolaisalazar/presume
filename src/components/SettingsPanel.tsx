import { useState } from 'react'
import type { Constraints } from '../types'

interface SettingsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
}

export function SettingsPanel({ constraints, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const bodyId = 'constraint-settings'

  const update = (key: keyof Constraints, value: number) => {
    onChange({ ...constraints, [key]: value })
  }

  const step = (key: keyof Constraints, delta: number, min: number, max: number) => {
    update(key, Math.min(max, Math.max(min, constraints[key] + delta)))
  }

  return (
    <div className="settings-panel">
      <button
        className="settings-panel__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
      >
        <span className="settings-panel__title">Fit constraints</span>
        <span className="settings-panel__summary">
          <span>{constraints.maxPages} {constraints.maxPages === 1 ? 'page' : 'pages'}</span>
          <span>
            {constraints.maxLinesPerBullet}{' '}
            {constraints.maxLinesPerBullet === 1 ? 'line per bullet' : 'lines per bullet'}
          </span>
          <span>{constraints.minFontSize}px minimum</span>
        </span>
        <span className="settings-panel__chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      <div className="settings-panel__body" id={bodyId} hidden={!open}>
        <div className="settings-panel__body-inner">
          <ConstraintStepper
            label="Page limit"
            value={constraints.maxPages}
            unit={constraints.maxPages === 1 ? 'page' : 'pages'}
            help="Resume length target"
            onDecrease={() => step('maxPages', -1, 1, 10)}
            onIncrease={() => step('maxPages', 1, 1, 10)}
            decreaseLabel="Decrease max pages"
            increaseLabel="Increase max pages"
            decreaseDisabled={constraints.maxPages <= 1}
            increaseDisabled={constraints.maxPages >= 10}
          />
          <ConstraintStepper
            label="Bullet lines"
            value={constraints.maxLinesPerBullet}
            unit={constraints.maxLinesPerBullet === 1 ? 'line' : 'lines'}
            help="Maximum wrapped lines per bullet"
            onDecrease={() => step('maxLinesPerBullet', -1, 1, 10)}
            onIncrease={() => step('maxLinesPerBullet', 1, 1, 10)}
            decreaseLabel="Decrease max lines per bullet"
            increaseLabel="Increase max lines per bullet"
            decreaseDisabled={constraints.maxLinesPerBullet <= 1}
            increaseDisabled={constraints.maxLinesPerBullet >= 10}
          />
          <ConstraintStepper
            label="Minimum type"
            value={constraints.minFontSize}
            unit="px"
            help="Do not shrink below this size"
            onDecrease={() => step('minFontSize', -1, 4, 16)}
            onIncrease={() => step('minFontSize', 1, 4, 16)}
            decreaseLabel="Decrease minimum font size"
            increaseLabel="Increase minimum font size"
            decreaseDisabled={constraints.minFontSize <= 4}
            increaseDisabled={constraints.minFontSize >= 16}
          />
        </div>
      </div>
    </div>
  )
}

interface ConstraintStepperProps {
  label: string
  value: number
  unit: string
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
  unit,
  help,
  onDecrease,
  onIncrease,
  decreaseLabel,
  increaseLabel,
  decreaseDisabled,
  increaseDisabled,
}: ConstraintStepperProps) {
  return (
    <div className="settings-control-row">
      <div className="settings-control-row__label">
        <span>{label}</span>
        <small>{help}</small>
      </div>
      <div className="settings-stepper" aria-label={label}>
        <button
          type="button"
          className="settings-stepper__button"
          onClick={onDecrease}
          disabled={decreaseDisabled}
          aria-label={decreaseLabel}
        >
          −
        </button>
        <span className="settings-stepper__value" aria-live="polite">
          <strong>{value}</strong>
          <span>{unit}</span>
        </span>
        <button
          type="button"
          className="settings-stepper__button"
          onClick={onIncrease}
          disabled={increaseDisabled}
          aria-label={increaseLabel}
        >
          +
        </button>
      </div>
      <p className="settings-control-row__note">{help}</p>
    </div>
  )
}
