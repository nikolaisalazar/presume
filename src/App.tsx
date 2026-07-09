import { useEffect, useRef, useState } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import { ReviewPanel } from './components/ReviewPanel'
import { FormattingWarningSummary } from './components/FormattingWarningSummary'
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

function LandingPage({
  hasSavedResume,
  onOpenEditor,
}: {
  hasSavedResume: boolean
  onOpenEditor: () => void
}) {
  return (
    <div className="app app--landing">
      <header className="landing-nav" aria-label="Presume landing navigation">
        <a className="landing-nav__brand" href="/presume/" aria-label="Presume home">
          <span className="app-header__brand-mark" aria-hidden="true">P</span>
          <span>Presume</span>
        </a>
        <button className="toolbar-btn" onClick={onOpenEditor}>
          {hasSavedResume ? 'Continue editing' : 'Open editor'}
        </button>
      </header>

      <main className="landing-shell">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-kicker">Direct-editing resume workspace</p>
            <h1 id="landing-title">Edit your resume like the final document.</h1>
            <p className="landing-lede">
              Presume gives you a fixed resume canvas, inline editing, fit guidance, and export tools in one focused workspace.
            </p>
            <div className="landing-actions">
              <button className="toolbar-btn toolbar-btn--primary landing-primary-action" onClick={onOpenEditor}>
                {hasSavedResume ? 'Continue editing' : 'Start editing'}
              </button>
              <span className="landing-local-note">No account required · Stored locally in your browser</span>
            </div>
          </div>

          <div className="landing-preview" aria-label="Presume editor preview">
            <div className="landing-preview__chrome">
              <span>Fit constraints</span>
              <span>1 page · 1 line · 8px</span>
            </div>
            <div className="landing-preview__stage">
              <div className="landing-preview__page">
                <div className="landing-preview__line landing-preview__line--title" />
                <div className="landing-preview__line landing-preview__line--short" />
                <div className="landing-preview__rule" />
                <div className="landing-preview__line" />
                <div className="landing-preview__line" />
                <div className="landing-preview__line landing-preview__line--medium" />
                <div className="landing-preview__rule" />
                <div className="landing-preview__line" />
                <div className="landing-preview__line landing-preview__line--short" />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features" aria-label="Features">
          <article>
            <h2>Direct inline editing</h2>
            <p>Edit the resume itself instead of translating your history through a long form.</p>
          </article>
          <article>
            <h2>Fit constraints</h2>
            <p>Keep page count, bullet wrapping, and type size visible while you shape content.</p>
          </article>
          <article>
            <h2>PDF + JSON export</h2>
            <p>Export a polished PDF and keep a portable JSON backup of your resume data.</p>
          </article>
          <article>
            <h2>Optional advisory review</h2>
            <p>When configured, request a non-mutating review without changing your document.</p>
          </article>
        </section>

        <section className="landing-why" aria-labelledby="why-title">
          <div className="landing-why__intro">
            <h2 id="why-title">Why direct editing?</h2>
            <p>
              Resume editing should happen where the resume is actually read. Presume keeps layout, fit, and content decisions on the same surface.
            </p>
          </div>
          <div className="landing-why__comparison" aria-label="Direct editing comparison">
            <article>
              <h3>Form-first builders</h3>
              <ul>
                <li>Edit fields somewhere else</li>
                <li>Guess how bullets will wrap</li>
                <li>Find layout surprises at export</li>
              </ul>
            </article>
            <article className="landing-why__comparison-featured">
              <h3>Presume keeps the document live</h3>
              <ul>
                <li>Edit directly on the resume</li>
                <li>See fit constraints while writing</li>
                <li>Export from the same surface</li>
              </ul>
            </article>
          </div>
          <p className="landing-why__footer">Not a job board, account-gated builder, or resume content farm.</p>
        </section>

        <section className="landing-workflow" aria-labelledby="workflow-title">
          <div className="landing-workflow__intro">
            <p className="landing-kicker">Workflow</p>
            <h2 id="workflow-title">From draft to export without leaving the page.</h2>
          </div>
          <ol className="landing-workflow__steps">
            <li>
              <span className="landing-workflow__step-dot" aria-hidden="true" />
              <strong>Edit directly</strong>
              <span>Click into names, bullets, sections, and dates.</span>
            </li>
            <li>
              <span className="landing-workflow__step-dot" aria-hidden="true" />
              <strong>Keep it fitting</strong>
              <span>Use fit warnings and constraints as guardrails.</span>
            </li>
            <li>
              <span className="landing-workflow__step-dot" aria-hidden="true" />
              <strong>Export when ready</strong>
              <span>Save a PDF or carry your data forward as JSON.</span>
            </li>
          </ol>
        </section>

        <section className="landing-privacy" aria-label="Privacy and storage">
          <div>
            <h2>Private by default</h2>
            <p>
              Presume is built as a convenient local-first editor. Your resume is saved in browser storage,
              and JSON export gives you an explicit backup you control.
            </p>
          </div>
          <ul className="landing-privacy__list">
            <li>No account required</li>
            <li>Saved locally in your browser</li>
            <li>Optional review only when configured</li>
          </ul>
          <button className="toolbar-btn toolbar-btn--primary" onClick={onOpenEditor}>Open the editor</button>
        </section>
      </main>
    </div>
  )
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
