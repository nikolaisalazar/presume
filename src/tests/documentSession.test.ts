import { describe, expect, it, vi } from 'vitest'
import { createDocumentSession } from '../documentSession'
import { sampleDocument } from '../storage'
import { clampOffset } from '../documentSelection'
import type { FieldPath } from '../documentCommands'

const name: FieldPath = { kind: 'name' }
const make = (now?: () => number) => createDocumentSession({ initial: { data: sampleDocument(), status: 'sample' }, write: () => ({ status: 'saved' }), now })
const edit = (session: ReturnType<typeof make>, text: string) => {
  const token = session.beginFieldEdit(name)!
  session.editField(token, text)
  session.finishFieldEdit(token)
}

describe('document history and synchronous session', () => {
  it('groups only consecutive same-field operations less than 750ms apart', () => {
    let time = 0
    const session = make(() => time)
    const token = session.beginFieldEdit(name)!
    session.editField(token, 'A'); time = 749; session.editField(token, 'AB')
    time = 1499; session.editField(token, 'ABC')
    session.editField(token, 'AB', 'delete-backward')
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe('ABC')
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe('AB')
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe(sampleDocument().resume.name)
  })
  it('closes groups on selection, blur, another field, paste and commands', () => {
    const session = make()
    let token = session.beginFieldEdit(name)!
    session.editField(token, 'A')
    session.relocateSelection(token)
    session.editField(token, 'BA')
    session.editField(token, 'pasteBA', 'paste')
    session.finishFieldEdit(token)
    token = session.beginFieldEdit({ kind: 'contact', index: 0 })!
    session.editField(token, 'Contact')
    session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 })
    session.undo(); expect(session.getSnapshot().data.constraints.maxPages).toBe(1)
    session.undo(); expect(session.getSnapshot().data.resume.contact[0]).toBe(sampleDocument().resume.contact[0])
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe('BA')
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe('A')
  })
  it('increments revisions on effective changes, preserves redo on no-ops, and invalidates redo on new actions', () => {
    const session = make()
    edit(session, 'A'); edit(session, 'B'); session.undo()
    const revision = session.getSnapshot().documentRevision
    edit(session, 'A')
    session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'contact', index: -1 }, epoch: session.getSnapshot().reconciliationEpoch })
    expect(session.getSnapshot().documentRevision).toBe(revision)
    expect(session.getSnapshot().canRedo).toBe(true)
    edit(session, 'C')
    expect(session.getSnapshot().canRedo).toBe(false)
    expect(Number(session.getSnapshot().documentRevision)).toBeGreaterThan(Number(revision))
  })
  it('keeps at most 100 undoable groups', () => {
    const session = make()
    for (let i = 0; i < 110; i++) edit(session, `Name ${i}`)
    for (let i = 0; i < 100; i++) expect(session.undo()).toBe(true)
    expect(session.getSnapshot().data.resume.name).toBe('Name 9')
    expect(session.undo()).toBe(false)
    for (let i = 0; i < 100; i++) expect(session.redo()).toBe(true)
    expect(session.getSnapshot().data.resume.name).toBe('Name 109')
  })
  it('rejects stale edit tokens and structural epochs after indexes shift', () => {
    const session = make()
    const token = session.beginFieldEdit({ kind: 'contact', index: 0 })!
    session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'contact', index: 0 }, epoch: 0 })
    const after = session.getSnapshot().data
    expect(session.editField(token, 'Old blur')).toBe(false)
    expect(session.dispatch({ type: 'structure', operation: 'remove', path: { kind: 'contact', index: 0 }, epoch: 0 })).toBe(false)
    expect(session.getSnapshot().data).toBe(after)
    session.undo()
    expect(session.getSnapshot().focus).toEqual({ field: { kind: 'contact', index: 0 } })
    expect(session.getSnapshot().data).toEqual(sampleDocument())
  })
  it('rejects non-integer paths and applies nested commands against current data', () => {
    const session = make()
    expect(session.beginFieldEdit({ kind: 'section', section: 0.5 })).toBeUndefined()
    session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'bullet', section: 1, entry: 0 }, epoch: 0 })
    const epoch = session.getSnapshot().reconciliationEpoch
    const token = session.beginFieldEdit({ kind: 'entry', section: 1, entry: 0, field: 'title' })!
    session.editField(token, 'Current title')
    session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'bullet', section: 1, entry: 0 }, epoch })
    expect(session.getSnapshot().data.resume.sections[1].entries[0].title).toBe('Current title')
  })
  it('restores complete documents atomically and legacy text with current constraints; reset is undoable', () => {
    const session = make()
    session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 })
    const before = session.getSnapshot().data
    session.restore({ kind: 'legacy', resume: { name: 'Legacy', contact: [], sections: [] } }, session.getSnapshot().documentRevision)
    expect(session.getSnapshot().data.constraints.maxPages).toBe(2)
    session.resetTemplate(session.getSnapshot().documentRevision)
    expect(session.getSnapshot().data).toEqual(sampleDocument())
    session.undo(); expect(session.getSnapshot().data.resume.name).toBe('Legacy')
    session.undo(); expect(session.getSnapshot().data).toEqual(before)
    expect(session.restore({ kind: 'complete', data: sampleDocument() }, '0')).toBe(false)
  })
  it('flushes unreported focused text before commands and returns a stable immutable snapshot', () => {
    const session = make()
    let text = sampleDocument().resume.name
    session.beginFieldEdit(name, undefined, () => ({ text, composing: false }))
    text = 'Pending DOM'
    const prepared = session.prepareSnapshot()
    expect(prepared.status).toBe('ready')
    if (prepared.status !== 'ready') throw new Error('Expected ready')
    expect(prepared.data.resume.name).toBe('Pending DOM')
    session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 })
    expect(prepared.data.constraints.maxPages).toBe(1)
  })
  it('blocks snapshot/replacement while composing and commits the completed composition as one group', () => {
    const session = make()
    const token = session.beginFieldEdit(name)!
    session.setComposing(token, true)
    session.editField(token, 'draft')
    expect(session.prepareSnapshot()).toEqual({ status: 'composing' })
    expect(session.resetTemplate('0')).toBe(false)
    session.setComposing(token, false)
    session.editField(token, '完成', 'composition')
    session.undo(); expect(session.getSnapshot().data).toEqual(sampleDocument())
  })
  it('acknowledges only successful complete transitional writes and preserves draft/history on failure', () => {
    const write = vi.fn().mockReturnValue({ status: 'unsaved', reason: 'quota' })
    const session = createDocumentSession({ initial: { data: sampleDocument(), status: 'saved' }, write })
    edit(session, 'Unsaved')
    expect(session.getSnapshot().saveState).toEqual({ status: 'unsaved', reason: 'quota' })
    expect(session.getLastPersistedData()).toEqual(sampleDocument())
    expect(session.getSnapshot().canUndo).toBe(true)
    write.mockReturnValue({ status: 'saved' })
    session.retrySave()
    expect(session.getLastPersistedData()?.resume.name).toBe('Unsaved')
    session.undo(); expect(write).toHaveBeenLastCalledWith(sampleDocument())
  })
  it('does not write the sample or unreadable data on startup and cannot save after disposal', () => {
    const write = vi.fn().mockReturnValue({ status: 'saved' })
    const session = createDocumentSession({ initial: { data: sampleDocument(), status: 'recovery', reason: 'invalid' }, write })
    edit(session, 'In memory')
    expect(write).not.toHaveBeenCalled()
    session.dispose()
    edit(session, 'late')
    session.retrySave()
    expect(write).not.toHaveBeenCalled()
    expect(session.getSnapshot().data.resume.name).toBe('In memory')
  })
  it('clamps selection offsets without splitting UTF-16 surrogate pairs', () => {
    expect(clampOffset('A😀B', 2)).toBe(1)
    expect(clampOffset('A😀B', 99)).toBe(4)
    expect(clampOffset('A😀B', -2)).toBe(0)
  })
})

it('preserves structural sharing with a large resume and bounds its snapshot history', () => {
  const base = sampleDocument()
  const data = { ...base, resume: { ...base.resume, sections: Array.from({ length: 12 }, (_, i) => ({
    title: `Section ${i}`, entries: Array.from({ length: 10 }, (_, j) => ({
      title: `Entry ${j}`, subtitle: 'Organization', location: 'City', dateRange: '2020–2026',
      bullets: Array.from({ length: 10 }, () => 'A realistic description of work and its measurable result. '.repeat(3)),
    })),
  })) } }
  const session = createDocumentSession({ initial: { data, status: 'sample' }, write: () => ({ status: 'saved' }) })
  const original = session.prepareSnapshot()
  const started = performance.now()
  for (let i = 0; i < 110; i++) edit(session, `Large document ${i}`)
  if (original.status !== 'ready') throw new Error('Expected prepared snapshot')
  expect(session.getSnapshot().data.resume.sections).toBe(original.data.resume.sections)
  expect(Object.isFrozen(original.data.resume.sections[0].entries[0].bullets)).toBe(true)
  let undos = 0
  while (session.undo()) undos++
  expect(undos).toBe(100)
  console.info(`T2-2 large document: ${JSON.stringify(data).length} bytes, 1200 bullets, 110 changes + 100 undos in ${(performance.now() - started).toFixed(1)}ms`)
})

it('undoing an addition focuses its surviving parent action', () => {
  const session = make()
  session.dispatch({ type: 'structure', operation: 'add', path: { kind: 'section' }, epoch: 0 })
  expect(session.getSnapshot().focus).toEqual({ field: { kind: 'section', section: sampleDocument().resume.sections.length } })
  session.undo()
  expect(session.getSnapshot().focus).toEqual({ action: 'add-section' })
})

it('starts a separate group when the pre-input selection differs, but keeps ordinary typing grouped', () => {
  const session = make()
  const caret = (position: number) => ({ start: position, end: position, direction: 'forward' as const })
  const token = session.beginFieldEdit(name, caret(0))!
  session.checkSelection(token, caret(0))
  session.editField(token, 'A', 'typing', caret(1))
  session.checkSelection(token, caret(1))
  session.editField(token, 'AB', 'typing', caret(2))
  session.checkSelection(token, { start: 0, end: 2, direction: 'forward' })
  session.editField(token, 'Replacement', 'typing', caret(11))
  session.undo(); expect(session.getSnapshot().data.resume.name).toBe('AB')
  session.undo(); expect(session.getSnapshot().data).toEqual(sampleDocument())
})

it('groups a repeated constraint gesture until release and keeps the next gesture separate', () => {
  const session = make()
  session.beginConstraintGesture('maxPages')
  for (let i = 0; i < 3; i++) session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 })
  session.endConstraintGesture()
  session.dispatch({ type: 'constraint', key: 'minFontSize', delta: 1 })
  session.undo(); expect(session.getSnapshot().data.constraints.maxPages).toBe(4)
  session.undo(); expect(session.getSnapshot().data.constraints).toEqual(sampleDocument().constraints)
  session.redo(); expect(session.getSnapshot().data.constraints.maxPages).toBe(4)
})
