import { forwardRef } from 'react'
import type { Resume } from '../types'
import { ResumeHeader } from './ResumeHeader'
import { Section } from './Section'
import type { Warnings } from '../useResizeEngine'
import type { ReviewAnnotation } from '../reviewTypes'
import { getReviewAnnotationTargets } from './ReviewAnnotations'
import { addSection, removeSection, updateSection } from '../resumeOperations'

interface ResumePageProps {
  resume: Resume
  onResumeChange: (resume: Resume) => void
  warnings: Warnings
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
        <div className="controls-row" style={{ marginTop: 8 }}>
          <button className="add-btn" onClick={() => onResumeChange(addSection(resume))}>
            + section
          </button>
        </div>
      </div>
    )
  }
)

ResumePage.displayName = 'ResumePage'
