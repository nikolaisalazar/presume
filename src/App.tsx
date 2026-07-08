import { useRef, useState } from 'react'
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
  shouldShowReviewPanel,
} from './components/ReviewStatusControl'
import { useResumeReview } from './useResumeReview'
import './styles/app.css'
import './styles/resume.css'

export default function App() {
  const { resume, setResume, constraints, setConstraints } = useResume()
  const pageRef = useRef<HTMLDivElement>(null)
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
  const warnings = useResizeEngine(resume, constraints, pageRef)
  const review = useResumeReview({ resume, pageRef })
  const reviewAnnotations =
    'result' in review.state && review.state.result
      ? review.state.result.annotations
      : []
  const formattingWarningCount = Array.from(warnings.values()).filter(Boolean).length
  const showReviewPanel = shouldShowReviewPanel(review.state, reviewPanelOpen)
  const requestReview = () => {
    setReviewPanelOpen(true)
    void review.requestReview()
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <h1>Presume</h1>
          <p>Edit the final resume directly. Presume keeps it fitting.</p>
        </div>
        <div className="app-header__meta" aria-label="Editor status">
          <span className="app-status-pill">Saved locally</span>
          <ReviewStatusControl
            state={review.state}
            panelOpen={reviewPanelOpen}
            onTogglePanel={() => setReviewPanelOpen(open => !open)}
            onRequestReview={requestReview}
          />
        </div>
      </header>
      <main className="workspace">
        <section className="editor-panel" aria-label="Resume editor">
          <SettingsPanel constraints={constraints} onChange={setConstraints} />
          <FormattingWarningSummary
            warningCount={formattingWarningCount}
            constraints={constraints}
          />
          <Toolbar
            resume={resume}
            pageRef={pageRef}
            onImport={setResume}
            onReset={() => setResume(DEFAULT_RESUME)}
          />
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
        </section>
        {showReviewPanel ? (
          <ReviewPanel
            state={review.state}
            onRequestReview={requestReview}
            onClose={() => setReviewPanelOpen(false)}
          />
        ) : null}
      </main>
    </div>
  )
}
