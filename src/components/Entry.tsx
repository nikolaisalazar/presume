import { EditableText } from './EditableText'
import { Bullet } from './Bullet'
import type { ResumeEntry } from '../types'
import type { Warnings } from '../useResizeEngine'
import {
  ReviewAnnotations,
  getReviewAnnotationsForTarget,
  getReviewSeverityClass,
  type ReviewAnnotationTargets,
} from './ReviewAnnotations'
import { addBullet, removeBullet, updateBullet } from '../resumeOperations'

interface EntryProps {
  entry: ResumeEntry
  sectionIdx: number
  entryIdx: number
  warnings: Warnings
  reviewAnnotationTargets?: ReviewAnnotationTargets
  onChange: (entry: ResumeEntry) => void
  onRemove: () => void
}

export function Entry({
  entry,
  sectionIdx,
  entryIdx,
  warnings,
  reviewAnnotationTargets,
  onChange,
  onRemove,
}: EntryProps) {
  const reviewAnnotations = getReviewAnnotationsForTarget(
    reviewAnnotationTargets,
    `entry-${sectionIdx}-${entryIdx}`
  )

  return (
    <div className={`resume-entry ${getReviewSeverityClass(reviewAnnotations)}`}>
      <div className="entry-header-row">
        <EditableText
          value={entry.title}
          onChange={v => onChange({ ...entry, title: v })}
          className="entry-title"
          placeholder="Job Title / Degree"
        />
        <ReviewAnnotations annotations={reviewAnnotations} />
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
            reviewAnnotations={getReviewAnnotationsForTarget(
              reviewAnnotationTargets,
              `bullet-${sectionIdx}-${entryIdx}-${bIdx}`
            )}
            onChange={text => onChange(updateBullet(entry, bIdx, text))}
            onDelete={() => onChange(removeBullet(entry, bIdx))}
          />
        ))}
      </ul>
      <div className="entry-actions editor-rail" data-editor-only="true">
        <button
          className="editor-control editor-control--add add-btn"
          onClick={() => onChange(addBullet(entry))}
          aria-label={`Add bullet to ${entry.title || 'entry'}`}
          data-editor-only="true"
        >
          Add bullet
        </button>
        <button
          className="editor-control editor-control--remove remove-btn"
          onClick={onRemove}
          aria-label={`Remove entry: ${entry.title || 'Untitled entry'}`}
          data-editor-only="true"
        >
          ×
        </button>
      </div>
    </div>
  )
}
