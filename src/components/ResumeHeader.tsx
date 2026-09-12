import { EditableText } from './EditableText'
import type { Resume } from '../types'
import { useSessionController } from '../useDocumentSession'

interface ResumeHeaderProps {
  resume: Resume
}

export function ResumeHeader({ resume }: ResumeHeaderProps) {
  const session = useSessionController()
  const epoch = session.getSnapshot().reconciliationEpoch
  return (
    <header className="resume-header" role="presentation">
      <EditableText
        value={resume.name}
        field={{ kind: 'name' }}
        className="resume-name"
        placeholder="Your Name"
      />
      <div className="resume-header-contact-row">
        <ul className="resume-contact">
          {resume.contact.map((item, i) => (
            <li key={i} className="resume-contact-item">
              <EditableText
                value={item}
                field={{ kind: 'contact', index: i }}
                placeholder="contact"
              />
              <button
                className="editor-control editor-control--remove remove-btn"
                onClick={() => session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'contact', index: i }, epoch })}
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
          data-document-action="add-contact"
          onClick={() => session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'contact' }, epoch })}
          aria-label="Add contact item"
          data-editor-only="true"
        >
          Add contact
        </button>
      </div>
    </header>
  )
}
