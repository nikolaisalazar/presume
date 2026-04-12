import { EditableText } from './EditableText'

interface BulletProps {
  text: string
  sectionIdx: number
  entryIdx: number
  bulletIdx: number
  warning: boolean
  onChange: (text: string) => void
  onDelete: () => void
}

export function Bullet({
  text,
  sectionIdx,
  entryIdx,
  bulletIdx,
  warning,
  onChange,
  onDelete,
}: BulletProps) {
  const varName = `--font-size-bullet-${sectionIdx}-${entryIdx}-${bulletIdx}`

  return (
    <li
      className={`bullet-item${warning ? ' bullet-item--warning' : ''}`}
      style={{
        fontSize: `calc(var(${varName}, var(--font-size-bullet)) * var(--global-scale))`,
      }}
    >
      <EditableText value={text} onChange={onChange} placeholder="Bullet point" />
      <button className="remove-btn" onClick={onDelete} aria-label="Delete bullet">
        −
      </button>
    </li>
  )
}
