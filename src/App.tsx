import { useEffect, useRef, useState } from 'react'
import { DocumentSessionContext, useDocumentSession, useSessionSnapshot } from './useDocumentSession'
import type { DocumentSession } from './documentSession'
import { DocumentRecovery, saveStatusText } from './components/DocumentRecovery'
import { useResizeEngine } from './useResizeEngine'
import { FitConstraintsPanel } from './components/FitConstraintsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import { ResumeViewport } from './components/ResumeViewport'
import { ReviewPanel } from './components/ReviewPanel'
import { ReviewRail } from './components/ReviewRail'
import { LandingPage } from './components/LandingPage'
import { AppHeader } from './components/AppHeader'
import { useResumeReview } from './useResumeReview'
import type { ReviewAnnotation } from './reviewTypes'
import './styles/globals.css'
import './styles/app.css'
import './styles/resume.css'

function getCurrentRoute() {
  return window.location.pathname
}

export default function App() {
  const { session, snapshot } = useDocumentSession()
  const [route, setRoute] = useState(getCurrentRoute)
  const pendingRoute = useRef<string | null>(null)
  const isLandingRoute = route === '/presume/' || route === '/presume'
  const openEditor = () => {
    window.history.pushState({}, '', '/presume/editor/')
    setRoute(getCurrentRoute())
  }
  const openLanding = () => {
    if (!session.finishActiveEdit()) { alert('Finish composing text before leaving the editor.'); return }
    window.history.pushState({}, '', '/presume/')
    setRoute(getCurrentRoute())
  }

  useEffect(() => {
    const handlePopState = () => {
      if (!session.finishActiveEdit()) {
        pendingRoute.current = getCurrentRoute()
        return
      }
      pendingRoute.current = null
      setRoute(getCurrentRoute())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [session])

  useEffect(() => {
    // Browser history can move while a field is composing. Keep its DOM mounted
    // until the platform finishes, then complete the latest requested route.
    if (!snapshot.composing && pendingRoute.current !== null && session.finishActiveEdit()) {
      const destination = pendingRoute.current
      pendingRoute.current = null
      setRoute(destination)
    }
  }, [session, snapshot.composing])

  if (isLandingRoute) {
    return <LandingPage hasSavedResume={snapshot.canUndo || snapshot.saveState.status === 'saved'} onOpenEditor={openEditor} />
  }

  return <DocumentSessionContext.Provider value={session}><EditorApp session={session} onOpenLanding={openLanding} /></DocumentSessionContext.Provider>
}

function EditorApp({ session, onOpenLanding }: { session: DocumentSession; onOpenLanding: () => void }) {
  const snapshot = useSessionSnapshot(session)
  const { resume, constraints } = snapshot.data
  const pageRef = useRef<HTMLDivElement>(null)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [fitPanelOpen, setFitPanelOpen] = useState(false)
  const reviewPanelRef = useRef<HTMLElement>(null)
  const reviewRailActionRef = useRef<HTMLElement>(null)
  const previousReviewPanelOpen = useRef(reviewPanelOpen)
  const { warnings, globalScale, isReady: isScaleReady } = useResizeEngine(resume, constraints, pageRef)
  const review = useResumeReview({ resume, globalScale, isScaleReady, prepareSnapshot: session.prepareSnapshot })
  const reviewAnnotations =
    'result' in review.state && review.state.result
      ? review.state.result.annotations
      : []
  const bulletWarningCount = warnings.bullets.length
  const hasGlobalOverflowWarning = warnings.globalOverflow
  const reviewPanelId = 'resume-review-panel'
  const requestReview = () => {
    if (session.prepareSnapshot().status !== 'ready') { alert('Finish composing text before requesting Review.'); return }
    void review.requestReview()
  }
  const openReviewPanel = () => {
    setFitPanelOpen(false)
    setReviewPanelOpen(true)
  }
  const closeReviewPanel = () => setReviewPanelOpen(false)
  const focusReviewAnnotation = (annotation: ReviewAnnotation) => {
    const target = Array.from(
      document.querySelectorAll<HTMLElement>('[data-review-annotation-ids]')
    ).find(candidate =>
      candidate.dataset.reviewAnnotationIds?.split(' ').includes(annotation.id)
    )

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    target?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
    target?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (previousReviewPanelOpen.current === reviewPanelOpen) return

    previousReviewPanelOpen.current = reviewPanelOpen
    if (reviewPanelOpen) {
      reviewPanelRef.current?.focus()
    } else {
      reviewRailActionRef.current?.focus()
    }
  }, [reviewPanelOpen])

  return (
    <div className="app" onKeyDown={event => {
      const target = event.target as HTMLElement
      if (event.nativeEvent.isComposing || snapshot.composing || target.closest('input, textarea, select') || !target.closest('.resume-page, [role="toolbar"]')) return
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key === 'z' || (event.ctrlKey && key === 'y')) {
        event.preventDefault()
        if (key === 'y' || event.shiftKey) session.redo()
        else session.undo()
      }
    }}>
      <AppHeader onOpenLanding={onOpenLanding} saveStatus={saveStatusText(snapshot)} />
      <main
        className="workspace"
        data-review-layout="elastic"
        data-review-open={reviewPanelOpen}
        data-fit-layout="edge-drawer"
      >
        <FitConstraintsPanel
          constraints={constraints}
          onStep={(key, delta) => session.dispatch({ type: 'constraint', key, delta })}
          onGestureStart={session.beginConstraintGesture}
          onGestureEnd={session.endConstraintGesture}
          bulletWarningCount={bulletWarningCount}
          hasGlobalOverflow={hasGlobalOverflowWarning}
          open={fitPanelOpen}
          onOpenChange={setFitPanelOpen}
        />
        <section className="editor-panel" aria-label="Resume editor">
          <div
            className="document-actions-surface overflow-hidden rounded-[var(--radius-structural)] border border-border bg-surface shadow-[var(--shadow-structural)]"
            data-slot="document-actions"
          >
            <Toolbar
              session={session}
              globalScale={globalScale}
              pdfReady={isScaleReady}
            />
          </div>
          <DocumentRecovery session={session} />
          <div className="resume-stage">
            <div className="resume-canvas-scroll" aria-label="Fixed-width resume canvas">
              <div className="resume-canvas">
                <ResumeViewport pageRef={pageRef}>
                  <ResumePage
                    ref={pageRef}
                    resume={resume}
                    warnings={warnings}
                    reviewAnnotations={reviewAnnotations}
                  />
                </ResumeViewport>
              </div>
            </div>
          </div>
        </section>
        <section className="review-region" aria-label="Review workspace">
          <ReviewRail
            state={review.state}
            panelId={reviewPanelId}
            onOpenPanel={openReviewPanel}
            onRequestReview={requestReview}
            pdfReady={isScaleReady}
            actionRef={reviewRailActionRef}
            hidden={reviewPanelOpen}
          />
          <ReviewPanel
            ref={reviewPanelRef}
            id={reviewPanelId}
            state={review.state}
            onRequestReview={requestReview}
            pdfReady={isScaleReady}
            onClose={closeReviewPanel}
            hidden={!reviewPanelOpen}
            onFocusAnnotation={focusReviewAnnotation}
          />
        </section>
      </main>
    </div>
  )
}
