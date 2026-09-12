import { EditableText } from './EditableText'
import { Bullet } from './Bullet'
import type { ResumeEntry } from '../types'
import { hasBulletWarning, type FormattingWarnings } from '../formatting'
import {
  ReviewAnnotations,
  getReviewAnnotationsForTarget,
  getReviewSeverityClass,
  type ReviewAnnotationTargets,
} from './ReviewAnnotations'
import { useSessionController } from '../useDocumentSession'

interface EntryProps {
  entry: ResumeEntry
  sectionIdx: number
  entryIdx: number
  warnings: FormattingWarnings
  reviewAnnotationTargets?: ReviewAnnotationTargets
}

export function Entry({
  entry,
  sectionIdx,
  entryIdx,
  warnings,
  reviewAnnotationTargets,
}: EntryProps) {
  const session = useSessionController()
  const epoch = session.getSnapshot().reconciliationEpoch
  const reviewAnnotations = getReviewAnnotationsForTarget(
    reviewAnnotationTargets,
    `entry-${sectionIdx}-${entryIdx}`
  )

  return (
    <div className={`resume-entry ${getReviewSeverityClass(reviewAnnotations)}`}>
      <div className="entry-header-row">
        <EditableText
          value={entry.title}
          field={{ kind: 'entry', section: sectionIdx, entry: entryIdx, field: 'title' }}
          className="entry-title"
          placeholder="Job Title / Degree"
        />
        <ReviewAnnotations annotations={reviewAnnotations} />
        <EditableText
          value={entry.dateRange}
          field={{ kind: 'entry', section: sectionIdx, entry: entryIdx, field: 'dateRange' }}
          className="entry-date"
          placeholder="Jan 2020 – Present"
        />
      </div>
      <div className="entry-subtitle-row">
        <EditableText
          value={entry.subtitle}
          field={{ kind: 'entry', section: sectionIdx, entry: entryIdx, field: 'subtitle' }}
          className="entry-subtitle"
          placeholder="Company / Institution"
        />
        <EditableText
          value={entry.location}
          field={{ kind: 'entry', section: sectionIdx, entry: entryIdx, field: 'location' }}
          className="entry-location"
          placeholder="City, ST"
        />
      </div>
      <ul className="bullet-list">
        {entry.bullets.map((bullet, bIdx) => (
          <Bullet
            key={bIdx}
            text={bullet}
            warning={hasBulletWarning(warnings, sectionIdx, entryIdx, bIdx)}
            reviewAnnotations={getReviewAnnotationsForTarget(
              reviewAnnotationTargets,
              `bullet-${sectionIdx}-${entryIdx}-${bIdx}`
            )}
            field={{ kind: 'bullet', section: sectionIdx, entry: entryIdx, index: bIdx }}
            onDelete={() => session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'bullet', section: sectionIdx, entry: entryIdx, index: bIdx }, epoch })}
          />
        ))}
      </ul>
      <div className="entry-actions editor-rail" data-editor-only="true">
        <button
          className="editor-control editor-control--add add-btn"
          data-document-action={`add-bullet-${sectionIdx}-${entryIdx}`}
          onClick={() => session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'bullet', section: sectionIdx, entry: entryIdx }, epoch })}
          aria-label={`Add bullet to ${entry.title || 'entry'}`}
          data-editor-only="true"
        >
          Add bullet
        </button>
        <button
          className="editor-control editor-control--remove remove-btn"
          onClick={() => session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'entry', section: sectionIdx, entry: entryIdx }, epoch })}
          aria-label={`Remove entry: ${entry.title || 'Untitled entry'}`}
          data-editor-only="true"
        >
          ×
        </button>
      </div>
    </div>
  )
}
