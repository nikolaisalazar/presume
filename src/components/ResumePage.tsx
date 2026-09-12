import { Fragment, forwardRef, useLayoutEffect, useRef } from 'react'
import { fieldKey } from '../documentCommands'
import { restoreSelection } from '../documentSelection'
import type { Resume } from '../types'
import { ResumeHeader } from './ResumeHeader'
import { Section } from './Section'
import type { FormattingWarnings } from '../formatting'
import type { ReviewAnnotation } from '../reviewTypes'
import { getReviewAnnotationTargets } from './ReviewAnnotations'
import { useSessionController, useSessionSnapshot } from '../useDocumentSession'

interface ResumePageProps {
  resume: Resume
  warnings: FormattingWarnings
  reviewAnnotations?: ReviewAnnotation[]
}

export const ResumePage = forwardRef<HTMLDivElement, ResumePageProps>(
  ({ resume, warnings, reviewAnnotations = [] }, ref) => {
    const session = useSessionController()
    const { reconciliationEpoch: epoch, focus } = useSessionSnapshot(session)
    const root = useRef<HTMLDivElement | null>(null)
    useLayoutEffect(() => {
      if (!focus || !root.current) return
      const target = 'field' in focus
        ? Array.from(root.current.querySelectorAll<HTMLElement>('[data-document-field]')).find(element => element.dataset.documentField === fieldKey(focus.field))
        : Array.from(root.current.querySelectorAll<HTMLElement>('[data-document-action]')).find(element => element.dataset.documentAction === focus.action)
      target?.focus({ preventScroll: true })
      if (target && 'field' in focus) restoreSelection(target, focus.selection)
      if (target) {
        const rect = target.getBoundingClientRect()
        if (rect.top < 0 || rect.bottom > window.innerHeight) target.scrollIntoView?.({ block: 'nearest' })
      }
    }, [epoch, focus])
    const reviewAnnotationTargets = getReviewAnnotationTargets(
      resume,
      reviewAnnotations
    )

    return (
      <div ref={element => {
        root.current = element
        if (typeof ref === 'function') ref(element)
        else if (ref) ref.current = element
      }} className="resume-page">
        <Fragment key={epoch}>
        <ResumeHeader resume={resume} />
        {resume.sections.map((section, sIdx) => (
          <Section
            key={sIdx}
            section={section}
            sectionIdx={sIdx}
            warnings={warnings}
            reviewAnnotationTargets={reviewAnnotationTargets}
          />
        ))}
        <div className="document-actions-row" data-editor-only="true">
          <button
            className="editor-control editor-control--add add-btn"
            data-document-action="add-section"
            onClick={() => session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'section' }, epoch })}
            aria-label="Add section"
            data-editor-only="true"
          >
            Add section
          </button>
        </div>
        </Fragment>
      </div>
    )
  }
)

ResumePage.displayName = 'ResumePage'
