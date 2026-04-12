import { useEffect, useRef } from 'react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  style?: React.CSSProperties
  placeholder?: string
  'data-testid'?: string
}

export function EditableText({
  value,
  onChange,
  className,
  style,
  placeholder,
  'data-testid': testId,
}: EditableTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const focused = useRef(false)

  // Sync external value changes into DOM (e.g. import/reset),
  // but never while the user is actively typing.
  useEffect(() => {
    if (ref.current && !focused.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  // Set initial content on mount.
  useEffect(() => {
    if (ref.current) ref.current.textContent = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      data-testid={testId}
      onFocus={() => {
        focused.current = true
      }}
      onBlur={e => {
        focused.current = false
        onChange(e.currentTarget.textContent ?? '')
      }}
      onInput={e => {
        onChange((e.currentTarget as HTMLSpanElement).textContent ?? '')
      }}
    />
  )
}
