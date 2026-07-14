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

  return (
    <section aria-labelledby="review-score-breakdown">
      <h3 id="review-score-breakdown" className="mb-2 text-xs font-semibold">
        Score breakdown
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(category => {
          const ratio = category.maxScore > 0
            ? Math.max(0, Math.min(100, (category.score / category.maxScore) * 100))
            : 0

          return (
            <Button
              key={category.key}
              type="button"
              variant="reviewCategory"
              aria-label={`${category.label}, ${category.score} of ${category.maxScore}`}
              aria-pressed={category.key === selected.key}
              onClick={() => onSelect(category.key)}
            >
              <span className="text-xs text-muted-foreground">{category.label}</span>
              <span className="text-base font-bold text-foreground">
                {category.score}{' '}
                <span className="text-xs font-medium text-muted-foreground">
                  / {category.maxScore}
                </span>
              </span>
              <span className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  className="block h-full bg-primary"
                  style={{ width: `${ratio}%` }}
                />
              </span>
            </Button>
          )
        })}
      </div>
      <div className="mt-2 rounded-[4px] border border-primary/35 bg-primary/5 p-2.5">
        <h3 className="text-xs font-semibold">{selected.label} evidence</h3>
        {selected.evidence.length > 0 ? (
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
            {selected.evidence.map((item, index) => (
              <li key={`${item}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-xs text-muted-foreground">No evidence returned.</p>
        )}
      </div>
    </section>
  )
}
