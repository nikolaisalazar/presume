import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'

const LETTER_PAGE_HEIGHT = 1056

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
        LETTER_PAGE_HEIGHT,
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
    <div ref={viewportRef} className="resume-viewport">
      {children}
    </div>
  )
}
