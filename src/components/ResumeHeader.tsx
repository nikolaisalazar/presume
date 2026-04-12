import { EditableText } from './EditableText'
import type { Resume } from '../types'

interface ResumeHeaderProps {
  name: Resume['name']
  contact: Resume['contact']
  onNameChange: (name: string) => void
  onContactChange: (contact: string[]) => void
}

export function ResumeHeader({
  name,
  contact,
  onNameChange,
  onContactChange,
}: ResumeHeaderProps) {
  const updateContact = (index: number, value: string) => {
    const updated = [...contact]
    updated[index] = value
    onContactChange(updated)
  }

  const addContact = () => {
    onContactChange([...contact, 'contact@example.com'])
  }

  const removeContact = (index: number) => {
    onContactChange(contact.filter((_, i) => i !== index))
  }

  return (
    <header className="resume-header">
      <EditableText
        value={name}
        onChange={onNameChange}
        className="resume-name"
        placeholder="Your Name"
      />
      <ul className="resume-contact">
        {contact.map((item, i) => (
          <li key={i} className="resume-contact-item">
            <EditableText
              value={item}
              onChange={v => updateContact(i, v)}
              placeholder="contact"
            />
            <button
              className="remove-btn"
              onClick={() => removeContact(i)}
              aria-label="Remove contact item"
            >
              −
            </button>
          </li>
        ))}
        <li>
          <button className="add-btn" onClick={addContact}>
            + contact
          </button>
        </li>
      </ul>
    </header>
  )
}
