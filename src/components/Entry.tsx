import { EditableText } from './EditableText'
import { Bullet } from './Bullet'
import type { ResumeEntry } from '../types'
import type { Warnings } from '../useResizeEngine'

interface EntryProps {
  entry: ResumeEntry
  sectionIdx: number
  entryIdx: number
  warnings: Warnings
  onChange: (entry: ResumeEntry) => void
  onRemove: () => void
}

export function Entry({
  entry,
  sectionIdx,
  entryIdx,
  warnings,
  onChange,
  onRemove,
}: EntryProps) {
  const updateBullet = (bulletIdx: number, text: string) => {
    const bullets = [...entry.bullets]
    bullets[bulletIdx] = text
    onChange({ ...entry, bullets })
  }

  const addBullet = () => {
    onChange({ ...entry, bullets: [...entry.bullets, 'New bullet point'] })
  }

  const removeBullet = (bulletIdx: number) => {
    onChange({ ...entry, bullets: entry.bullets.filter((_, i) => i !== bulletIdx) })
  }

  return (
    <div className="resume-entry">
      <div className="entry-header-row">
        <EditableText
          value={entry.title}
          onChange={v => onChange({ ...entry, title: v })}
          className="entry-title"
          placeholder="Job Title / Degree"
        />
        <EditableText
          value={entry.dateRange}
          onChange={v => onChange({ ...entry, dateRange: v })}
          className="entry-date"
          placeholder="Jan 2020 – Present"
        />
      </div>
      <div className="entry-subtitle-row">
        <EditableText
          value={entry.subtitle}
          onChange={v => onChange({ ...entry, subtitle: v })}
          className="entry-subtitle"
          placeholder="Company / Institution"
        />
        <EditableText
          value={entry.location}
          onChange={v => onChange({ ...entry, location: v })}
          className="entry-location"
          placeholder="City, ST"
        />
      </div>
      <ul className="bullet-list">
        {entry.bullets.map((bullet, bIdx) => (
          <Bullet
            key={bIdx}
            text={bullet}
            warning={warnings.get(`bullet-${sectionIdx}-${entryIdx}-${bIdx}`) ?? false}
            onChange={v => updateBullet(bIdx, v)}
            onDelete={() => removeBullet(bIdx)}
          />
        ))}
      </ul>
      <div className="controls-row">
        <button className="add-btn" onClick={addBullet}>
          + bullet
        </button>
        <button className="remove-btn" onClick={onRemove}>
          − entry
        </button>
      </div>
    </div>
  )
}
