import { useState } from 'react'
import type { Constraints } from '../types'

interface SettingsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
}

export function SettingsPanel({ constraints, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  const update = (key: keyof Constraints, value: number) => {
    onChange({ ...constraints, [key]: value })
  }

  return (
    <div className="settings-panel">
      <button
        className="settings-panel__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>⚙ Constraints</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="settings-panel__body">
          <div className="settings-field">
            <label htmlFor="max-pages">Max pages</label>
            <input
              id="max-pages"
              type="number"
              min={1}
              max={10}
              value={constraints.maxPages}
              onChange={e => update('maxPages', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="max-lines">Max lines per bullet</label>
            <input
              id="max-lines"
              type="number"
              min={1}
              max={10}
              value={constraints.maxLinesPerBullet}
              onChange={e =>
                update('maxLinesPerBullet', Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
          <div className="settings-field">
            <label htmlFor="min-font">Min font size (px)</label>
            <input
              id="min-font"
              type="number"
              min={4}
              max={16}
              value={constraints.minFontSize}
              onChange={e =>
                update('minFontSize', Math.max(4, parseInt(e.target.value) || 8))
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
