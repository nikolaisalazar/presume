import { EditableText } from './EditableText'

interface BulletProps {
  text: string
  warning: boolean
  onChange: (text: string) => void
  onDelete: () => void
}

export function Bullet({
  text,
  warning,
  onChange,
  onDelete,
}: BulletProps) {
  return (
    <li
      className={`bullet-item${warning ? ' bullet-item--warning' : ''}`}
      style={{
        fontSize: `calc(var(--font-size-bullet) * var(--global-scale))`,
      }}
    >
      <EditableText value={text} onChange={onChange} placeholder="Bullet point" />
      <button className="remove-btn" onClick={onDelete} aria-label="Delete bullet">
        −
      </button>
    </li>
  )
}
