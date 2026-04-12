import { forwardRef } from 'react'
import type { Resume, ResumeSection } from '../types'
import { ResumeHeader } from './ResumeHeader'
import { Section } from './Section'
import type { Warnings } from '../useResizeEngine'

interface ResumePageProps {
  resume: Resume
  onResumeChange: (resume: Resume) => void
  warnings: Warnings
}

export const ResumePage = forwardRef<HTMLDivElement, ResumePageProps>(
  ({ resume, onResumeChange, warnings }, ref) => {
    const updateSection = (sectionIdx: number, section: ResumeSection) => {
      const sections = [...resume.sections]
      sections[sectionIdx] = section
      onResumeChange({ ...resume, sections })
    }

    const addSection = () => {
      onResumeChange({
        ...resume,
        sections: [
          ...resume.sections,
          { title: 'New Section', entries: [] },
        ],
      })
    }

    const removeSection = (sectionIdx: number) => {
      onResumeChange({
        ...resume,
        sections: resume.sections.filter((_, i) => i !== sectionIdx),
      })
    }

    return (
      <div ref={ref} className="resume-page">
        <ResumeHeader
          name={resume.name}
          contact={resume.contact}
          onNameChange={name => onResumeChange({ ...resume, name })}
          onContactChange={contact => onResumeChange({ ...resume, contact })}
        />
        {resume.sections.map((section, sIdx) => (
          <Section
            key={sIdx}
            section={section}
            sectionIdx={sIdx}
            warnings={warnings}
            onChange={s => updateSection(sIdx, s)}
            onRemove={() => removeSection(sIdx)}
          />
        ))}
        <div className="controls-row" style={{ marginTop: 8 }}>
          <button className="add-btn" onClick={addSection}>
            + section
          </button>
        </div>
      </div>
    )
  }
)

ResumePage.displayName = 'ResumePage'
