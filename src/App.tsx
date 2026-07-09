import { useEffect, useRef, useState } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import { ReviewPanel } from './components/ReviewPanel'
import { FormattingWarningSummary } from './components/FormattingWarningSummary'
import { LandingPage } from './components/LandingPage'
import {
  ReviewStatusControl,
  getUsefulReviewPanelKey,
  shouldShowReviewPanel,
} from './components/ReviewStatusControl'
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
  const [reviewPanelDismissedKey, setReviewPanelDismissedKey] = useState<string | null>(null)
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
  const showReviewPanel = shouldShowReviewPanel(
    review.state,
    reviewPanelOpen,
    reviewPanelDismissedKey
  )
  const reviewPanelId = 'resume-review-panel'
  const requestReview = () => {
    setReviewPanelDismissedKey(null)
    setReviewPanelOpen(true)
    void review.requestReview()
  }
  const toggleReviewPanel = () => {
    if (showReviewPanel) {
      setReviewPanelOpen(false)
      setReviewPanelDismissedKey(getUsefulReviewPanelKey(review.state))
      return
    }

    setReviewPanelDismissedKey(null)
    setReviewPanelOpen(true)
  }
  const closeReviewPanel = () => {
    setReviewPanelOpen(false)
    setReviewPanelDismissedKey(getUsefulReviewPanelKey(review.state))
  }

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
          <span className="app-status-pill">Saved locally</span>
          <ReviewStatusControl
            state={review.state}
            panelOpen={reviewPanelOpen}
            panelDismissedKey={reviewPanelDismissedKey}
            panelId={reviewPanelId}
            onTogglePanel={toggleReviewPanel}
            onRequestReview={requestReview}
          />
        </div>
      </header>
      <main className={`workspace ${showReviewPanel ? 'workspace--with-review' : ''}`}>
        <section className="editor-panel" aria-label="Resume editor">
          <SettingsPanel constraints={constraints} onChange={setConstraints} />
          <FormattingWarningSummary
            bulletWarningCount={bulletWarningCount}
            hasGlobalOverflow={hasGlobalOverflowWarning}
            constraints={constraints}
          />
          <Toolbar
            resume={resume}
            pageRef={pageRef}
            onImport={setResume}
            onReset={() => setResume(DEFAULT_RESUME)}
          />
          <div className="resume-stage">
            <div className="resume-stage__chrome" aria-hidden="true">
              <span>Letter · fixed canvas</span>
              <span>Direct edit</span>
            </div>
            <div className="resume-canvas-scroll" aria-label="Fixed-width resume canvas">
              <div className="resume-canvas">
                <ResumePage
                  ref={pageRef}
                  resume={resume}
                  onResumeChange={setResume}
                  warnings={warnings}
                  reviewAnnotations={reviewAnnotations}
                />
              </div>
            </div>
          </div>
        </section>
        {showReviewPanel ? (
          <ReviewPanel
            id={reviewPanelId}
            state={review.state}
            onRequestReview={requestReview}
            onClose={closeReviewPanel}
          />
        ) : null}
      </main>
    </div>
  )
}
