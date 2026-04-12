import { EditableText } from './EditableText'
import { Entry } from './Entry'
import type { ResumeSection, ResumeEntry } from '../types'

type Warnings = Map<string, boolean>

interface SectionProps {
  section: ResumeSection
  sectionIdx: number
  warnings: Warnings
  onChange: (section: ResumeSection) => void
  onRemove: () => void
}

export function Section({
  section,
  sectionIdx,
  warnings,
  onChange,
  onRemove,
}: SectionProps) {
  const updateEntry = (entryIdx: number, entry: ResumeEntry) => {
    const entries = [...section.entries]
    entries[entryIdx] = entry
    onChange({ ...section, entries })
  }

  const addEntry = () => {
    const newEntry: ResumeEntry = {
      title: 'Job Title',
      subtitle: 'Company',
      location: 'City, ST',
      dateRange: 'Jan 2020 – Present',
      bullets: [],
    }
    onChange({ ...section, entries: [...section.entries, newEntry] })
  }

  const removeEntry = (entryIdx: number) => {
    onChange({ ...section, entries: section.entries.filter((_, i) => i !== entryIdx) })
  }

  return (
    <section className="resume-section">
      <div className="resume-section-header-row">
        <EditableText
          value={section.title}
          onChange={v => onChange({ ...section, title: v })}
          className="resume-section-title"
          placeholder="SECTION"
        />
        <button className="remove-btn" onClick={onRemove} aria-label="Remove section">
          − section
        </button>
      </div>
      {section.entries.map((entry, eIdx) => (
        <Entry
          key={eIdx}
          entry={entry}
          sectionIdx={sectionIdx}
          entryIdx={eIdx}
          warnings={warnings}
          onChange={e => updateEntry(eIdx, e)}
          onRemove={() => removeEntry(eIdx)}
        />
      ))}
      <div className="controls-row">
        <button className="add-btn" onClick={addEntry}>
          + entry
        </button>
      </div>
    </section>
  )
}
