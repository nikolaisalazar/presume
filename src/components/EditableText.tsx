import { useLayoutEffect, useRef } from 'react'
import { fieldKey, type FieldPath } from '../documentCommands'
import type { EditToken, InputKind } from '../documentSession'
import { readSelection, restoreSelection } from '../documentSelection'
import { useSessionController } from '../useDocumentSession'

interface EditableTextProps {
  value: string
  field: FieldPath
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  'data-testid'?: string
}
function inputKind(inputType: string): InputKind {
  if (inputType === 'deleteContentBackward') return 'delete-backward'
  if (inputType === 'deleteContentForward') return 'delete-forward'
  if (inputType === 'insertFromPaste') return 'paste'
  if (inputType === 'deleteByCut') return 'cut'
  if (inputType === 'insertFromDrop') return 'drop'
  if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') return 'break'
  return inputType === 'insertText' || !inputType ? 'typing' : 'other'
}

/** T2-2 bridge: typed transactions and authoritative replacements. Plain-text serialization ships in T2-3. */
export function EditableText({ value, field, className, style, placeholder, 'data-testid': testId }: EditableTextProps) {
  const session = useSessionController()
  const ref = useRef<HTMLSpanElement>(null)
  const token = useRef<EditToken>()
  const composing = useRef(false)
  const begin = (element: HTMLSpanElement) => {
    token.current = session.beginFieldEdit(field, readSelection(element), () => ({
      text: element.textContent ?? '', selection: readSelection(element), composing: composing.current,
    }))
  }
  useLayoutEffect(() => {
    const element = ref.current
    if (element && !composing.current && element.textContent !== value) {
      const selection = document.activeElement === element ? readSelection(element) : undefined
      element.textContent = value
      if (selection) restoreSelection(element, selection)
    }
  }, [value])
  useLayoutEffect(() => {
    const element = ref.current!
    // Compare the actual selection before mutation, including Select All and
    // assistive/browser selection commands that do not use our mouse/arrow handlers.
    const beforeInput = () => {
      if (token.current && !composing.current) session.checkSelection(token.current, readSelection(element))
    }
    element.addEventListener('beforeinput', beforeInput)
    return () => {
      element.removeEventListener('beforeinput', beforeInput)
      if (token.current) session.finishFieldEdit(token.current)
    }
  }, [session])
  return (
    <span
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-document-field={fieldKey(field)}
      data-placeholder={placeholder}
      data-testid={testId}
      onFocus={event => begin(event.currentTarget)}
      onBlur={() => {
        if (token.current) session.finishFieldEdit(token.current)
        token.current = undefined
      }}
      onMouseUp={event => { if (token.current) session.relocateSelection(token.current, readSelection(event.currentTarget)) }}
      onKeyUp={event => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) && token.current) session.relocateSelection(token.current, readSelection(event.currentTarget))
      }}
      onCompositionStart={event => {
        if (!token.current) begin(event.currentTarget)
        composing.current = true
        if (token.current) session.setComposing(token.current, true)
      }}
      onCompositionEnd={event => {
        composing.current = false
        if (token.current) {
          session.setComposing(token.current, false)
          session.editField(token.current, event.currentTarget.textContent ?? '', 'composition', readSelection(event.currentTarget))
        }
      }}
      onInput={event => {
        if (!token.current) begin(event.currentTarget)
        if (token.current) session.editField(token.current, event.currentTarget.textContent ?? '', inputKind((event.nativeEvent as InputEvent).inputType), readSelection(event.currentTarget))
      }}
    />
  )
}
