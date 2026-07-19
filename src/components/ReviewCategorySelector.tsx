import type { ReviewCategory, ReviewCategoryKey } from '../reviewTypes'
import { Button } from './ui/button'

const STOCK_CATEGORY_ORDER: ReviewCategoryKey[] = [
  'open_source',
  'self_projects',
  'production',
  'technical_skills',
]

export function selectLargestDeficitCategory(
  categories: ReviewCategory[]
): ReviewCategoryKey | null {
  const ordered = [...categories].sort(
    (left, right) =>
      STOCK_CATEGORY_ORDER.indexOf(left.key) -
      STOCK_CATEGORY_ORDER.indexOf(right.key)
  )

  return ordered.reduce<ReviewCategory | null>((selected, category) => {
    if (!selected) return category
    const deficit = category.maxScore - category.score
    const selectedDeficit = selected.maxScore - selected.score
    return deficit > selectedDeficit ? category : selected
  }, null)?.key ?? null
}

interface ReviewCategorySelectorProps {
  categories: ReviewCategory[]
  selectedKey: ReviewCategoryKey | null
  onSelect: (key: ReviewCategoryKey) => void
}

export function ReviewCategorySelector({
  categories,
  selectedKey,
  onSelect,
}: ReviewCategorySelectorProps) {
  if (categories.length === 0) return null

  const selected =
    categories.find(category => category.key === selectedKey) ?? categories[0]
  const selectedDetailId = `review-category-${selected.key}-detail`

  return (
    <section className="review-category-section" aria-labelledby="review-score-breakdown">
      <h3 id="review-score-breakdown" className="review-section-heading">
        Score breakdown
      </h3>
      <div className="review-category-grid">
        {categories.map(category => (
          <Button
            key={category.key}
            type="button"
            variant="reviewCategory"
            className="review-category"
            aria-label={`${category.label}, ${category.score} of ${category.maxScore}`}
            aria-pressed={category.key === selected.key}
            aria-controls={category.key === selected.key ? selectedDetailId : undefined}
            onClick={() => onSelect(category.key)}
          >
            <span className="review-category__label">{category.label}</span>
            <span className="review-category__score">
              <strong>{category.score}</strong>
              <span>/ {category.maxScore}</span>
            </span>
          </Button>
        ))}
      </div>
      <section
        id={selectedDetailId}
        className="review-category-detail"
        aria-labelledby={`${selectedDetailId}-heading`}
      >
        <h4 id={`${selectedDetailId}-heading`} className="review-category-detail__heading">
          {selected.label} evidence
        </h4>
        {selected.evidence.length > 0 ? (
          <ul className="review-evidence-list">
            {selected.evidence.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="review-category-detail__empty">No evidence returned.</p>
        )}
        {selected.suggestions.length > 0 ? (
          <div className="review-category-suggestions">
            <h5>Suggested next steps</h5>
            <ul className="review-evidence-list">
              {selected.suggestions.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </section>
  )
}
