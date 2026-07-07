import { EditableText } from './EditableText'
import type { Resume } from '../types'
import {
  addContactItem,
  removeContactItem,
  updateContactItem,
  updateResumeName,
} from '../resumeOperations'

interface ResumeHeaderProps {
  name: Resume['name']
  contact: Resume['contact']
  resume: Resume
  onResumeChange: (resume: Resume) => void
}

export function ResumeHeader({
  resume,
  onResumeChange,
}: ResumeHeaderProps) {

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
                className="remove-btn"
                onClick={() => onResumeChange(removeContactItem(resume, i))}
                aria-label="Remove contact item"
              >
                −
              </button>
            </li>
          ))}
        </ul>
        <button className="add-btn" onClick={() => onResumeChange(addContactItem(resume))}>
          + contact
        </button>
      </div>
    </header>
  )
}
