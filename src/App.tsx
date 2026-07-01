import { useRef } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import { ReviewPanel } from './components/ReviewPanel'
import { useResumeReview } from './useResumeReview'
import './styles/app.css'
import './styles/resume.css'

export default function App() {
  const { resume, setResume, constraints, setConstraints } = useResume()
  const pageRef = useRef<HTMLDivElement>(null)
  const warnings = useResizeEngine(resume, constraints, pageRef)
  const review = useResumeReview({ resume, pageRef })
  const reviewAnnotations =
    'result' in review.state && review.state.result
      ? review.state.result.annotations
      : []

  return (
    <div className="app">
      <SettingsPanel constraints={constraints} onChange={setConstraints} />
      <Toolbar
        resume={resume}
        pageRef={pageRef}
        onImport={setResume}
        onReset={() => setResume(DEFAULT_RESUME)}
      />
      <main className="workspace">
        <ResumePage
          ref={pageRef}
          resume={resume}
          onResumeChange={setResume}
          warnings={warnings}
          reviewAnnotations={reviewAnnotations}
        />
        <ReviewPanel
          state={review.state}
          onRequestReview={() => {
            void review.requestReview()
          }}
        />
      </main>
    </div>
  )
}
