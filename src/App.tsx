import { useEffect, useRef, useState } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
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

function hasSavedResume() {
  return Boolean(localStorage.getItem('presume:resume'))
}

export default function App() {
  const [route, setRoute] = useState(getCurrentRoute)
  const isLandingRoute = route === '/presume/' || route === '/presume'
  const openEditor = () => {
    window.history.pushState({}, '', '/presume/editor/')
    setRoute(getCurrentRoute())
  }
  const openLanding = () => {
    window.history.pushState({}, '', '/presume/')
    setRoute(getCurrentRoute())
  }

  useEffect(() => {
    const handlePopState = () => setRoute(getCurrentRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isLandingRoute) {
    return <LandingPage hasSavedResume={hasSavedResume()} onOpenEditor={openEditor} />
  }

  return <EditorApp onOpenLanding={openLanding} />
}

function EditorApp({ onOpenLanding }: { onOpenLanding: () => void }) {
  const { resume, setResume, constraints, setConstraints } = useResume()
  const pageRef = useRef<HTMLDivElement>(null)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const [fitPanelOpen, setFitPanelOpen] = useState(false)
  const reviewPanelRef = useRef<HTMLElement>(null)
  const reviewRailActionRef = useRef<HTMLElement>(null)
  const previousReviewPanelOpen = useRef(reviewPanelOpen)
  const { warnings, globalScale, isReady: isScaleReady } = useResizeEngine(resume, constraints, pageRef)
  const review = useResumeReview({ resume, globalScale, isScaleReady })
  const reviewAnnotations =
    'result' in review.state && review.state.result
      ? review.state.result.annotations
      : []
  const bulletWarningCount = warnings.bullets.length
  const hasGlobalOverflowWarning = warnings.globalOverflow
  const reviewPanelId = 'resume-review-panel'
  const requestReview = () => {
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
    <div className="app">
      <AppHeader onOpenLanding={onOpenLanding} />
      <main
        className="workspace"
        data-review-layout="elastic"
        data-review-open={reviewPanelOpen}
        data-fit-layout="edge-drawer"
      >
        <FitConstraintsPanel
          constraints={constraints}
          onChange={setConstraints}
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
              resume={resume}
              globalScale={globalScale}
              pdfReady={isScaleReady}
              onImport={setResume}
              onReset={() => setResume(DEFAULT_RESUME)}
            />
          </div>
          <div className="resume-stage">
            <div className="resume-canvas-scroll" aria-label="Fixed-width resume canvas">
              <div className="resume-canvas">
                <ResumeViewport pageRef={pageRef}>
                  <ResumePage
                    ref={pageRef}
                    resume={resume}
                    onResumeChange={setResume}
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
