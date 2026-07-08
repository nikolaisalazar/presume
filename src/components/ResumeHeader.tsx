import { EditableText } from './EditableText'
import type { Resume } from '../types'
import {
  addContactItem,
  removeContactItem,
  updateContactItem,
  updateResumeName,
} from '../resumeOperations'

interface ResumeHeaderProps {
  resume: Resume
  onResumeChange: (resume: Resume) => void
}

export function ResumeHeader({ resume, onResumeChange }: ResumeHeaderProps) {
  return (
    <header className="resume-header" role="presentation">
      <EditableText
        value={resume.name}
        onChange={name => onResumeChange(updateResumeName(resume, name))}
        className="resume-name"
        placeholder="Your Name"
      />
      <div className="resume-header-contact-row">
        <ul className="resume-contact">
          {resume.contact.map((item, i) => (
            <li key={i} className="resume-contact-item">
              <EditableText
                value={item}
                onChange={v => onResumeChange(updateContactItem(resume, i, v))}
                placeholder="contact"
              />
              <button
                className="editor-control editor-control--remove remove-btn"
                onClick={() => onResumeChange(removeContactItem(resume, i))}
                aria-label={`Remove contact item${item ? `: ${item}` : ''}`}
                data-editor-only="true"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          className="editor-control editor-control--add add-btn"
          onClick={() => onResumeChange(addContactItem(resume))}
          aria-label="Add contact item"
          data-editor-only="true"
        >
          Add contact
        </button>
      </div>
    </header>
  )
}
