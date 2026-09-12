import { EditableText } from './EditableText'
import { Entry } from './Entry'
import type { ResumeSection } from '../types'
import type { FormattingWarnings } from '../formatting'
import {
  ReviewAnnotations,
  getReviewAnnotationsForTarget,
  getReviewSeverityClass,
  type ReviewAnnotationTargets,
} from './ReviewAnnotations'
import { useSessionController } from '../useDocumentSession'

interface SectionProps {
  section: ResumeSection
  sectionIdx: number
  warnings: FormattingWarnings
  reviewAnnotationTargets?: ReviewAnnotationTargets
}

export function Section({
  section,
  sectionIdx,
  warnings,
  reviewAnnotationTargets,
}: SectionProps) {
  const session = useSessionController()
  const epoch = session.getSnapshot().reconciliationEpoch
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
          field={{ kind: 'section', section: sectionIdx }}
          className="resume-section-title"
          placeholder="SECTION"
        />
        <ReviewAnnotations annotations={reviewAnnotations} />
        <div className="section-actions editor-rail" data-editor-only="true">
          <button
            className="editor-control editor-control--remove remove-btn"
            onClick={() => session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'section', section: sectionIdx }, epoch })}
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
        />
      ))}
      <div className="controls-row" data-editor-only="true">
        <button
          className="editor-control editor-control--add add-btn"
          data-document-action={`add-entry-${sectionIdx}`}
          onClick={() => session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'entry', section: sectionIdx }, epoch })}
          aria-label={`Add entry to ${section.title || 'section'}`}
          data-editor-only="true"
        >
          Add entry
        </button>
      </div>
    </section>
  )
}
