import type { DocumentData } from './document'
import type { Resume, ResumeEntry } from './types'
import { updateConstraint, type ConstraintKey } from './constraints'
import * as ops from './resumeOperations'

export type FieldPath =
  | { kind: 'name' }
  | { kind: 'contact'; index: number }
  | { kind: 'section'; section: number }
  | { kind: 'entry'; section: number; entry: number; field: Exclude<keyof ResumeEntry, 'bullets'> }
  | { kind: 'bullet'; section: number; entry: number; index: number }
export type StructurePath =
  | { kind: 'contact'; index?: number }
  | { kind: 'section'; section?: number }
  | { kind: 'entry'; section: number; entry?: number }
  | { kind: 'bullet'; section: number; entry: number; index?: number }
export type DocumentCommand =
  | { type: 'structure'; operation: 'add' | 'remove'; path: StructurePath; epoch: number }
  | { type: 'constraint'; key: ConstraintKey; delta: number }
export type Selection = { start: number; end: number; direction: 'forward' | 'backward' }
export type FocusAnchor = { field: FieldPath; selection?: Selection } | { action: string }
export const fieldKey = (path: FieldPath) => JSON.stringify(path)
const valid = <T>(items: T[], index: number | undefined): index is number =>
  index !== undefined && Number.isInteger(index) && index >= 0 && index < items.length

export function readField(resume: Resume, path: FieldPath): string | undefined {
  if (path.kind === 'name') return resume.name
  if (path.kind === 'contact') return valid(resume.contact, path.index) ? resume.contact[path.index] : undefined
  if (!valid(resume.sections, path.section)) return
  const section = resume.sections[path.section]
  if (path.kind === 'section') return section.title
  if (!valid(section.entries, path.entry)) return
  const entry = section.entries[path.entry]
  return path.kind === 'entry' ? entry[path.field] : valid(entry.bullets, path.index) ? entry.bullets[path.index] : undefined
}

export function writeField(data: DocumentData, path: FieldPath, text: string): DocumentData {
  const current = readField(data.resume, path)
  if (current === undefined || current === text) return data
  let resume = data.resume
  if (path.kind === 'name') resume = ops.updateResumeName(resume, text)
  else if (path.kind === 'contact') resume = ops.updateContactItem(resume, path.index, text)
  else {
    let section = resume.sections[path.section]
    if (path.kind === 'section') section = { ...section, title: text }
    else {
      const entry = section.entries[path.entry]
      section = ops.updateEntry(section, path.entry, path.kind === 'entry'
        ? { ...entry, [path.field]: text } : ops.updateBullet(entry, path.index, text))
    }
    resume = ops.updateSection(resume, path.section, section)
  }
  return { ...data, resume }
}

export function applyCommand(data: DocumentData, command: DocumentCommand): { data: DocumentData; before?: FocusAnchor; after?: FocusAnchor; label: string } {
  if (command.type === 'constraint') {
    const constraints = updateConstraint(data.constraints, command.key, data.constraints[command.key] + command.delta)
    return { data: constraints[command.key] === data.constraints[command.key] ? data : { ...data, constraints }, label: 'formatting change' }
  }
  const { path, operation } = command
  const adding = operation === 'add'
  let resume = data.resume
  let before: FocusAnchor | undefined
  let after: FocusAnchor | undefined
  const result = () => ({ data: resume === data.resume ? data : { ...data, resume }, before, after, label: `${adding ? 'add' : 'remove'} ${path.kind}` })
  if (path.kind === 'contact') {
    if (!adding && !valid(resume.contact, path.index)) return result()
    const index = adding ? resume.contact.length : path.index!
    before = adding ? { action: 'add-contact' } : { field: { kind: 'contact', index } }
    resume = adding ? ops.addContactItem(resume) : ops.removeContactItem(resume, index)
    after = resume.contact.length ? { field: { kind: 'contact', index: Math.min(index, resume.contact.length - 1) } } : { action: 'add-contact' }
  } else if (path.kind === 'section') {
    if (!adding && !valid(resume.sections, path.section)) return result()
    const section = adding ? resume.sections.length : path.section!
    before = adding ? { action: 'add-section' } : { field: { kind: 'section', section } }
    resume = adding ? ops.addSection(resume) : ops.removeSection(resume, section)
    after = resume.sections.length ? { field: { kind: 'section', section: Math.min(section, resume.sections.length - 1) } } : { action: 'add-section' }
  } else {
    if (!valid(resume.sections, path.section)) return result()
    let section = resume.sections[path.section]
    if (path.kind === 'entry') {
      if (!adding && !valid(section.entries, path.entry)) return result()
      const entry = adding ? section.entries.length : path.entry!
      before = adding ? { action: `add-entry-${path.section}` } : { field: { kind: 'entry', section: path.section, entry, field: 'title' } }
      section = adding ? ops.addEntry(section) : ops.removeEntry(section, entry)
      after = section.entries.length ? { field: { kind: 'entry', section: path.section, entry: Math.min(entry, section.entries.length - 1), field: 'title' } } : { action: `add-entry-${path.section}` }
    } else {
      if (!valid(section.entries, path.entry)) return result()
      let entry = section.entries[path.entry]
      if (!adding && !valid(entry.bullets, path.index)) return result()
      const index = adding ? entry.bullets.length : path.index!
      before = adding ? { action: `add-bullet-${path.section}-${path.entry}` } : { field: { kind: 'bullet', section: path.section, entry: path.entry, index } }
      entry = adding ? ops.addBullet(entry) : ops.removeBullet(entry, index)
      after = entry.bullets.length ? { field: { kind: 'bullet', section: path.section, entry: path.entry, index: Math.min(index, entry.bullets.length - 1) } } : { action: `add-bullet-${path.section}-${path.entry}` }
      section = ops.updateEntry(section, path.entry, entry)
    }
    resume = ops.updateSection(resume, path.section, section)
  }
  return result()
}
