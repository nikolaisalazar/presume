import type { DocumentData } from './document'
import type { FocusAnchor } from './documentCommands'

export type HistoryFrame = { before: DocumentData; after: DocumentData; beforeFocus?: FocusAnchor; afterFocus?: FocusAnchor; label: string }
export type HistoryState = { data: DocumentData; past: HistoryFrame[]; future: HistoryFrame[] }
export type HistoryAction =
  | { type: 'change'; frame: HistoryFrame; coalesce: boolean }
  | { type: 'undo' | 'redo' }

/** Pure, bounded history; the controller owns grouping and monotonically increasing revisions. */
export function reduceHistory(state: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === 'change') {
    const { frame } = action
    if (frame.before === frame.after) return state
    const past = action.coalesce && state.past.length
      ? [...state.past.slice(0, -1), { ...state.past[state.past.length - 1], after: frame.after, afterFocus: frame.afterFocus }]
      : [...state.past, frame].slice(-100)
    return { data: frame.after, past, future: [] }
  }
  const frame = (action.type === 'undo' ? state.past : state.future).at(-1)
  if (!frame) return state
  return action.type === 'undo'
    ? { data: frame.before, past: state.past.slice(0, -1), future: [...state.future, frame] }
    : { data: frame.after, past: [...state.past, frame], future: state.future.slice(0, -1) }
}
