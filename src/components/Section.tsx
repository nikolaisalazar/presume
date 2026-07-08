import { EditableText } from './EditableText'
import { Entry } from './Entry'
import type { ResumeSection } from '../types'
import type { Warnings } from '../useResizeEngine'
import {
  ReviewAnnotations,
  getReviewAnnotationsForTarget,
  getReviewSeverityClass,
  type ReviewAnnotationTargets,
} from './ReviewAnnotations'
import { addEntry, removeEntry, updateEntry } from '../resumeOperations'

interface SectionProps {
  section: ResumeSection
  sectionIdx: number
  warnings: Warnings
  reviewAnnotationTargets?: ReviewAnnotationTargets
  onChange: (section: ResumeSection) => void
  onRemove: () => void
}

export function Section({
  section,
  sectionIdx,
  warnings,
  reviewAnnotationTargets,
  onChange,
  onRemove,
}: SectionProps) {
  const reviewAnnotations = getReviewAnnotationsForTarget(
    reviewAnnotationTargets,
    `section-${sectionIdx}`
  )

  return (
    <section
      className={`resume-section ${getReviewSeverityClass(reviewAnnotations)}`}
    >
      <div className="resume-section-header-row">
        <EditableText
          value={section.title}
          onChange={v => onChange({ ...section, title: v })}
          className="resume-section-title"
          placeholder="SECTION"
        />
        <ReviewAnnotations annotations={reviewAnnotations} />
        <div className="section-actions editor-rail" data-editor-only="true">
          <button
            className="editor-control editor-control--remove remove-btn"
            onClick={onRemove}
            aria-label={`Remove section: ${section.title || 'Untitled section'}`}
            data-editor-only="true"
          >
            ×
          </button>
        </div>
      </div>
      {section.entries.map((entry, eIdx) => (
        <Entry
          key={eIdx}
          entry={entry}
          sectionIdx={sectionIdx}
          entryIdx={eIdx}
          warnings={warnings}
          reviewAnnotationTargets={reviewAnnotationTargets}
          onChange={entry => onChange(updateEntry(section, eIdx, entry))}
          onRemove={() => onChange(removeEntry(section, eIdx))}
        />
      ))}
      <div className="controls-row" data-editor-only="true">
        <button
          className="editor-control editor-control--add add-btn"
          onClick={() => onChange(addEntry(section))}
          aria-label={`Add entry to ${section.title || 'section'}`}
          data-editor-only="true"
        >
          Add entry
        </button>
      </div>
    </section>
  )
}
