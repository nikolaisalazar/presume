import { EditableText } from './EditableText'
import type { ReviewAnnotation } from '../reviewTypes'
import {
  ReviewAnnotations,
  getReviewSeverityClass,
} from './ReviewAnnotations'

interface BulletProps {
  text: string
  warning: boolean
  reviewAnnotations?: ReviewAnnotation[]
  onChange: (text: string) => void
  onDelete: () => void
}

export function Bullet({
  text,
  warning,
  reviewAnnotations = [],
  onChange,
  onDelete,
}: BulletProps) {
  return (
    <li
      className={[
        'bullet-item',
        warning ? 'bullet-item--warning' : '',
        reviewAnnotations.length > 0 ? 'bullet-item--review-warning' : '',
        getReviewSeverityClass(reviewAnnotations),
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        fontSize: `calc(var(--font-size-bullet) * var(--global-scale))`,
      }}
    >
      <EditableText value={text} onChange={onChange} placeholder="Bullet point" />
      <ReviewAnnotations annotations={reviewAnnotations} />
      <button
        className="editor-control editor-control--remove remove-btn bullet-remove"
        onClick={onDelete}
        aria-label="Delete bullet"
        data-editor-only="true"
      >
        ×
      </button>
    </li>
  )
}
