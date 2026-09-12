import type { DocumentData } from './document'
import type { ParsedDocumentBackup } from './documentBackup'
import { applyCommand, fieldKey, readField, writeField, type DocumentCommand, type FieldPath, type FocusAnchor, type Selection } from './documentCommands'
import { reduceHistory, type HistoryState } from './documentHistory'
import { readTransitionalDocument, sampleDocument, writeTransitionalDocument, type LegacyRead, type WriteResult } from './storage'

export type DocumentRevision = string
export type SaveState = WriteResult | { status: 'sample' } | { status: 'recovery'; reason: 'invalid' | 'read-failed' }
export type DocumentSnapshot = {
  data: DocumentData
  documentRevision: DocumentRevision
  reconciliationEpoch: number
  saveState: SaveState
  canUndo: boolean
  canRedo: boolean
  undoLabel?: string
  redoLabel?: string
  focus?: FocusAnchor
  composing: boolean
}
export type PreparedSnapshot = { status: 'ready'; data: DocumentData; documentRevision: DocumentRevision } | { status: 'composing' }
export type EditToken = { id: number; epoch: number; field: FieldPath }
export type FieldDraft = { text: string; selection?: Selection; composing: boolean }
export type InputKind = 'typing' | 'delete-backward' | 'delete-forward' | 'paste' | 'cut' | 'drop' | 'break' | 'composition' | 'other'
type ActiveEdit = { token: EditToken; selection?: Selection; read?: () => FieldDraft }
const equal = (a: DocumentData, b: DocumentData) => a === b || JSON.stringify(a) === JSON.stringify(b)

function freezeData(data: DocumentData): DocumentData {
  const freeze = (value: object) => {
    if (Object.isFrozen(value)) return
    Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
    Object.freeze(value)
  }
  freeze(data)
  return data
}

/** One synchronous application session. Only the persistence boundary is transitional. */
export function createDocumentSession(options: { initial?: LegacyRead; write?: (data: DocumentData) => WriteResult; now?: () => number } = {}) {
  const loaded = options.initial ?? readTransitionalDocument()
  const initial = { ...loaded, data: freezeData(structuredClone(loaded.data)) }
  const write = options.write ?? writeTransitionalDocument
  const now = options.now ?? Date.now
  let history: HistoryState = { data: initial.data, past: [], future: [] }
  let persisted = initial.status === 'saved' ? initial.data : undefined
  let recoveryRaw = initial.raw
  let snapshot: DocumentSnapshot = {
    data: initial.data, documentRevision: '0', reconciliationEpoch: 0,
    saveState: initial.status === 'recovery' ? { status: 'recovery', reason: initial.reason! } : { status: initial.status },
    canUndo: false, canRedo: false, composing: false,
  }
  let revision = 0
  let tokenId = 0
  let active: ActiveEdit | undefined
  let group: { key: string; kind: InputKind; time: number } | undefined
  let constraintGesture: { key: keyof DocumentData['constraints']; changed: boolean } | undefined
  let disposed = false
  const listeners = new Set<() => void>()
  const emit = () => { if (!disposed) listeners.forEach(listener => listener()) }
  const valid = (token: EditToken) => !disposed && active?.token === token && !!token && token.epoch === snapshot.reconciliationEpoch
  const closeHistoryGroup = () => { group = undefined; constraintGesture = undefined }
  const save = () => {
    if (disposed || snapshot.saveState.status === 'recovery') return
    // After either write fails, retry the whole pair, even if undo matches an earlier payload.
    const result = write(history.data)
    if (result.status === 'saved') persisted = history.data
    snapshot = { ...snapshot, saveState: result }
  }
  const publishChange = (focus?: FocusAnchor, reconcile = false) => {
    if (reconcile) { active = undefined; group = undefined }
    snapshot = {
      ...snapshot, data: history.data, documentRevision: String(++revision),
      reconciliationEpoch: snapshot.reconciliationEpoch + Number(reconcile),
      canUndo: history.past.length > 0, canRedo: history.future.length > 0,
      undoLabel: history.past.at(-1)?.label, redoLabel: history.future.at(-1)?.label,
      focus: reconcile ? focus : snapshot.focus,
    }
    save()
    emit()
  }
  const change = (data: DocumentData, label: string, beforeFocus?: FocusAnchor, afterFocus?: FocusAnchor, coalesce = false, reconcile = false) => {
    if (disposed || equal(data, history.data)) return false
    history = reduceHistory(history, { type: 'change', frame: { before: history.data, after: freezeData(data), beforeFocus, afterFocus, label }, coalesce })
    publishChange(afterFocus, reconcile)
    return true
  }
  const editField = (token: EditToken, text: string, kind: InputKind = 'typing', selection?: Selection) => {
    if (!valid(token) || snapshot.composing) return false
    const data = writeField(history.data, token.field, text)
    const time = now()
    const key = fieldKey(token.field)
    const ordinary = kind === 'typing' || kind === 'delete-backward' || kind === 'delete-forward'
    const coalesce = ordinary && group?.key === key && group.kind === kind && time - group.time < 750
    const before = { field: token.field, selection: active?.selection }
    if (active) active.selection = selection
    const changed = change(data, kind === 'typing' ? 'typing' : kind, before, { field: token.field, selection }, coalesce)
    if (changed) group = ordinary ? { key, kind, time } : undefined
    return changed
  }
  const flushActive = () => {
    if (disposed) return false
    if (active?.read) {
      const draft = active.read()
      if (draft.composing) return false
      editField(active.token, draft.text, 'typing', draft.selection)
    }
    return !snapshot.composing
  }
  const prepareSnapshot = (): PreparedSnapshot => {
    if (!flushActive()) return { status: 'composing' }
    return { status: 'ready', data: history.data, documentRevision: snapshot.documentRevision }
  }
  const finishFieldEdit = (token: EditToken) => {
    if (!valid(token) || !flushActive()) return
    closeHistoryGroup()
    active = undefined
  }
  const navigateHistory = (type: 'undo' | 'redo') => {
    if (!flushActive()) return false
    closeHistoryGroup()
    const frame = (type === 'undo' ? history.past : history.future).at(-1)
    if (!frame) return false
    history = reduceHistory(history, { type })
    publishChange(type === 'undo' ? frame.beforeFocus : frame.afterFocus, true)
    return true
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getLastPersistedData: () => persisted,
    getRecoveryRaw: () => recoveryRaw,
    prepareSnapshot,
    closeHistoryGroup,
    beginFieldEdit(field: FieldPath, selection?: Selection, read?: () => FieldDraft): EditToken | undefined {
      if (disposed || readField(history.data.resume, field) === undefined) return
      if (active && !flushActive()) return
      closeHistoryGroup()
      const token = { id: ++tokenId, epoch: snapshot.reconciliationEpoch, field }
      active = { token, selection, read }
      return token
    },
    editField,
    finishFieldEdit,
    relocateSelection(token: EditToken, selection?: Selection) {
      if (!valid(token)) return
      closeHistoryGroup()
      active!.selection = selection
    },
    checkSelection(token: EditToken, selection?: Selection) {
      if (!valid(token)) return
      const previous = active!.selection
      if (previous?.start !== selection?.start || previous?.end !== selection?.end || previous?.direction !== selection?.direction) closeHistoryGroup()
      active!.selection = selection
    },
    setComposing(token: EditToken, composing: boolean) {
      if (!valid(token)) return
      snapshot = { ...snapshot, composing }
      closeHistoryGroup()
      emit()
    },
    dispatch(command: DocumentCommand) {
      if (command.type === 'structure' && command.epoch !== snapshot.reconciliationEpoch) return false
      if (!flushActive()) return false
      const gesture = command.type === 'constraint' && constraintGesture?.key === command.key ? constraintGesture : undefined
      closeHistoryGroup()
      const result = applyCommand(history.data, command)
      const changed = change(result.data, result.label, result.before, result.after, gesture?.changed ?? false, command.type === 'structure')
      if (gesture) constraintGesture = { ...gesture, changed: gesture.changed || changed }
      return changed
    },
    beginConstraintGesture(key: keyof DocumentData['constraints']) {
      if (!flushActive()) return
      active = undefined
      closeHistoryGroup()
      constraintGesture = { key, changed: false }
    },
    endConstraintGesture: closeHistoryGroup,
    undo: () => navigateHistory('undo'),
    redo: () => navigateHistory('redo'),
    restore(backup: ParsedDocumentBackup, expectedRevision: DocumentRevision) {
      if (!flushActive() || expectedRevision !== snapshot.documentRevision) return false
      closeHistoryGroup()
      return change(backup.kind === 'complete' ? structuredClone(backup.data) : { ...history.data, resume: structuredClone(backup.resume) }, 'restore backup', { field: { kind: 'name' } }, { field: { kind: 'name' } }, false, true)
    },
    resetTemplate(expectedRevision: DocumentRevision) {
      if (!flushActive() || expectedRevision !== snapshot.documentRevision) return false
      closeHistoryGroup()
      return change(sampleDocument(), 'reset template', { field: { kind: 'name' } }, { field: { kind: 'name' } }, false, true)
    },
    retrySave() {
      if (!flushActive()) return
      if (snapshot.saveState.status === 'recovery') {
        const latest = readTransitionalDocument()
        recoveryRaw = latest.raw
        // Recovery retry must never replace edits or overwrite a newly readable draft.
        if (latest.status === 'recovery' || !equal(latest.data, history.data)) {
          snapshot = { ...snapshot, saveState: { status: 'recovery', reason: latest.reason ?? 'read-failed' } }
          emit()
          return
        }
        snapshot = { ...snapshot, saveState: { status: 'sample' } }
      }
      save(); emit()
    },
    enableSaving(expectedRevision: DocumentRevision) {
      if (!flushActive() || snapshot.documentRevision !== expectedRevision) return false
      snapshot = { ...snapshot, saveState: { status: 'sample' } }
      save(); emit()
      return true
    },
    finishActiveEdit() {
      if (!flushActive()) return false
      active = undefined
      closeHistoryGroup()
      return true
    },
    dispose() { disposed = true; active = undefined; listeners.clear() },
  }
}
export type DocumentSession = ReturnType<typeof createDocumentSession>
