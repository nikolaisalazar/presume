import { useRef } from 'react'
import { useResume } from './useResume'
import { useResizeEngine } from './useResizeEngine'
import { DEFAULT_RESUME } from './defaultResume'
import { SettingsPanel } from './components/SettingsPanel'
import { Toolbar } from './components/Toolbar'
import { ResumePage } from './components/ResumePage'
import './styles/app.css'
import './styles/resume.css'

export default function App() {
  const { resume, setResume, constraints, setConstraints } = useResume()
  const pageRef = useRef<HTMLDivElement>(null)
  const warnings = useResizeEngine(resume, constraints, pageRef)

  return (
    <div className="app">
      <SettingsPanel constraints={constraints} onChange={setConstraints} />
      <Toolbar
        resume={resume}
        pageRef={pageRef}
        onImport={setResume}
        onReset={() => setResume(DEFAULT_RESUME)}
      />
      <ResumePage
        ref={pageRef}
        resume={resume}
        onResumeChange={setResume}
        warnings={warnings}
      />
    </div>
  )
}
