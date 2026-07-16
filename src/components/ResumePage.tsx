import { forwardRef } from 'react'
import type { Resume } from '../types'
import { ResumeHeader } from './ResumeHeader'
import { Section } from './Section'
import type { FormattingWarnings } from '../formatting'
import type { ReviewAnnotation } from '../reviewTypes'
import { getReviewAnnotationTargets } from './ReviewAnnotations'
import { addSection, removeSection, updateSection } from '../resumeOperations'

interface ResumePageProps {
  resume: Resume
  onResumeChange: (resume: Resume) => void
  warnings: FormattingWarnings
  reviewAnnotations?: ReviewAnnotation[]
}

export const ResumePage = forwardRef<HTMLDivElement, ResumePageProps>(
  ({ resume, onResumeChange, warnings, reviewAnnotations = [] }, ref) => {
    const reviewAnnotationTargets = getReviewAnnotationTargets(
      resume,
      reviewAnnotations
    )

    return (
      <div ref={ref} className="resume-page">
        <ResumeHeader
          resume={resume}
          onResumeChange={onResumeChange}
        />
        {resume.sections.map((section, sIdx) => (
          <Section
            key={sIdx}
            section={section}
            sectionIdx={sIdx}
            warnings={warnings}
            reviewAnnotationTargets={reviewAnnotationTargets}
            onChange={section => onResumeChange(updateSection(resume, sIdx, section))}
            onRemove={() => onResumeChange(removeSection(resume, sIdx))}
          />
        ))}
        <div className="document-actions-row" data-editor-only="true">
          <button
            className="editor-control editor-control--add add-btn"
            onClick={() => onResumeChange(addSection(resume))}
            aria-label="Add section"
            data-editor-only="true"
          >
            Add section
          </button>
        </div>
      </div>
    )
  }
)

ResumePage.displayName = 'ResumePage'
