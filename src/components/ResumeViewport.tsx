import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  RESUME_DOCUMENT,
} from '../resumeDocumentTokens'

const documentStyle = {
  '--page-width': `${RESUME_DOCUMENT.pageWidthPx}px`,
  '--page-height': `${RESUME_DOCUMENT.pageHeightPx}px`,
  '--page-margin-x': `${RESUME_DOCUMENT.pageMarginXPx}px`,
  '--page-margin-y': `${RESUME_DOCUMENT.pageMarginYPx}px`,
  '--bullet-indent': `${RESUME_DOCUMENT.bulletIndentPx}px`,
  '--font-size-name': `${RESUME_DOCUMENT.fontSizeNamePx}px`,
  '--font-size-contact': `${RESUME_DOCUMENT.fontSizeContactPx}px`,
  '--font-size-section': `${RESUME_DOCUMENT.fontSizeSectionPx}px`,
  '--font-size-entry-title': `${RESUME_DOCUMENT.fontSizeEntryTitlePx}px`,
  '--font-size-entry-subtitle': `${RESUME_DOCUMENT.fontSizeEntrySubtitlePx}px`,
  '--font-size-bullet': `${RESUME_DOCUMENT.fontSizeBulletPx}px`,
} as CSSProperties

interface ResumeViewportProps {
  pageRef: RefObject<HTMLElement | null>
  children: ReactNode
}

export function ResumeViewport({ pageRef, children }: ResumeViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const page = pageRef.current
    if (!viewport || !page) return

    const syncHeight = () => {
      const canonicalHeight = Math.max(
        RESUME_DOCUMENT.pageHeightPx,
        page.getBoundingClientRect().height
      )
      viewport.style.height = `${canonicalHeight}px`
    }

    syncHeight()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(syncHeight)
    observer.observe(page)
    return () => observer.disconnect()
  }, [pageRef])

  return (
    <div ref={viewportRef} className="resume-viewport" style={documentStyle}>
      {children}
    </div>
  )
}
