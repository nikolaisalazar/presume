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
import { Badge } from './components/ui/badge'
import { useResumeReview } from './useResumeReview'
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
  const reviewPanelRef = useRef<HTMLElement>(null)
  const reviewRailActionRef = useRef<HTMLElement>(null)
  const previousReviewPanelOpen = useRef(reviewPanelOpen)
  const warnings = useResizeEngine(resume, constraints, pageRef)
  const review = useResumeReview({ resume, pageRef })
  const reviewAnnotations =
    'result' in review.state && review.state.result
      ? review.state.result.annotations
      : []
  const activeWarningKeys = Array.from(warnings.entries())
    .filter(([, active]) => active)
    .map(([key]) => key)
  const bulletWarningCount = activeWarningKeys.filter(key => key.startsWith('bullet-')).length
  const hasGlobalOverflowWarning = activeWarningKeys.includes('global-overflow')
  const reviewPanelId = 'resume-review-panel'
  const requestReview = () => {
    void review.requestReview()
  }
  const openReviewPanel = () => setReviewPanelOpen(true)
  const closeReviewPanel = () => setReviewPanelOpen(false)

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
      <header className="app-header">
        <a
          className="app-header__brand app-header__brand-link"
          href="/presume/"
          aria-label="Presume home"
          onClick={event => {
            event.preventDefault()
            onOpenLanding()
          }}
        >
          <span className="app-header__brand-mark" aria-hidden="true">P</span>
          <div>
            <h1>Presume</h1>
            <p>Edit the final resume directly. Presume keeps it fitting.</p>
          </div>
        </a>
        <div className="app-header__meta" aria-label="Editor status">
          <Badge variant="secondary" size="status">Saved locally</Badge>
        </div>
      </header>
      <main className="workspace">
        <FitConstraintsPanel
          constraints={constraints}
          onChange={setConstraints}
          bulletWarningCount={bulletWarningCount}
          hasGlobalOverflow={hasGlobalOverflowWarning}
        />
        <section className="editor-panel" aria-label="Resume editor">
          <div
            className="document-actions-surface overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-panel)]"
            data-slot="document-actions"
          >
            <Toolbar
              resume={resume}
              pageRef={pageRef}
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
            actionRef={reviewRailActionRef}
            hidden={reviewPanelOpen}
          />
          <ReviewPanel
            ref={reviewPanelRef}
            id={reviewPanelId}
            state={review.state}
            onRequestReview={requestReview}
            onClose={closeReviewPanel}
            hidden={!reviewPanelOpen}
          />
        </section>
      </main>
    </div>
  )
}
