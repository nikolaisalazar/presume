# Shadcn Review Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recompose Presume's advisory Review Panel with existing shadcn/Base UI primitives, an accessible selectable category grid, evidence-led hierarchy, mixed disclosure, and compact semantic state alerts while preserving all review and resume behavior.

**Architecture:** Keep `ReviewPanel` as the public state router and extract the successful-result category interaction into a focused component. Use the existing normalized `ReviewResult` as immutable input; local UI state controls only category selection and supporting disclosures. Preserve custom workspace geometry in `app.css`, move component presentation into shadcn primitives and Tailwind utilities, then delete only superseded ReviewPanel CSS.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind CSS v4, shadcn `base-nova` on Base UI, Vitest/Testing Library, Playwright.

## Global Constraints

- Presume remains desktop-first; Review is subordinate to the fixed 816px resume.
- Preserve every configured, checking, disabled, config-error, idle, loading, success, stale, and request-error state.
- Preserve the existing normalized review API, HackerRank scoring semantics, advisory/non-mutating behavior, inline annotations, resume JSON, LocalStorage, PDF/JSON import/export, routes, and SPA fallback.
- Do not change `src/styles/resume.css`, `src/types.ts`, `src/storage.ts`, `src/export.ts`, or `src/reviewApi.ts`.
- Do not add providers, credentials, local-model integration, backend changes, schemas, stable IDs, reorder UI, or network-dependent tests.
- Reuse the installed `Card`, `Alert`, `Badge`, `Button`, `Separator`, and `Collapsible` primitives; add no dependency and no new shadcn component.
- Keep tests conservative: add only contract coverage for new selection, disclosure, and responsive behavior.
- Do not add visual snapshots.

---

## File Map

- Create `src/components/ReviewCategorySelector.tsx`: pure largest-deficit selection helper plus the controlled category grid and selected evidence region.
- Modify `src/components/ReviewPanel.tsx`: shadcn Card shell, semantic state alerts, successful-result composition, compact adjustment ledger, and mixed disclosure.
- Modify `src/components/ui/button.tsx`: semantic `reviewCategory` variant for selected category controls.
- Modify `src/components/ui/alert.tsx`: restrained `reviewWarning` variant for stale/setup states.
- Modify `src/components/ui/card.tsx`: restrained `reviewPanel` variant so call sites use `className` only for layout.
- Modify `src/styles/app.css`: retain only inspector geometry/responsive rules and delete replaced ReviewPanel presentation selectors.
- Modify `src/tests/reviewUi.test.tsx`: focused category-selection, reset, and disclosure contracts while retaining existing state tests.
- Modify `src/tests/responsiveLayout.test.ts`: update source contracts only when deleted selectors make existing assertions obsolete.
- Modify `e2e/configured-review.spec.ts`: one browser contract for the 1221/1220 inspector transition and retained 560px action sizing, only if component tests cannot prove it.
- Modify `docs/SHADCN_MIGRATION.md`: record PR #3 implementation and verification evidence after the gate passes.

---

### Task 1: Build the accessible category selector

**Files:**
- Create: `src/components/ReviewCategorySelector.tsx`
- Modify: `src/components/ui/button.tsx`
- Test: `src/tests/reviewUi.test.tsx`

**Interfaces:**
- Consumes: `ReviewCategory[]` and an immutable review-result identity supplied later by `ReviewPanel`.
- Produces: `selectLargestDeficitCategory(categories): ReviewCategoryKey | null` and `<ReviewCategorySelector categories selectedKey onSelect />`.

- [ ] **Step 1: Write failing helper and interaction tests**

Add imports for `ReviewCategorySelector` and `selectLargestDeficitCategory`, then add these focused cases inside the ReviewPanel test area:

```tsx
it('selects the largest raw point deficit in stock rubric order', () => {
  const tiedCategories: ReviewCategory[] = [
    { key: 'technical_skills', label: 'Technical Skills', score: 5, maxScore: 10, evidence: ['Technical evidence'], suggestions: [] },
    { key: 'production', label: 'Production', score: 20, maxScore: 25, evidence: ['Production evidence'], suggestions: [] },
    { key: 'open_source', label: 'Open Source', score: 30, maxScore: 35, evidence: ['Open-source evidence'], suggestions: [] },
  ]

  expect(selectLargestDeficitCategory(tiedCategories)).toBe('open_source')
  expect(selectLargestDeficitCategory([])).toBeNull()
})

it('shows evidence for the selected category without mutating scores', () => {
  const onSelect = vi.fn()
  const categories = [
    reviewResult.categories[0],
    {
      key: 'technical_skills' as const,
      label: 'Technical Skills',
      score: 8,
      maxScore: 10,
      evidence: ['Broad supported toolset.'],
      suggestions: ['Add systems evidence.'],
    },
  ]

  const { rerender } = render(
    <ReviewCategorySelector
      categories={categories}
      selectedKey="production"
      onSelect={onSelect}
    />
  )

  expect(screen.getByRole('button', { name: /Production Experience, 18 of 25/i }))
    .toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('heading', { name: 'Production Experience evidence' }))
    .toBeInTheDocument()
  expect(screen.getByText('Experience section shows engineering work.'))
    .toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /Technical Skills, 8 of 10/i }))
  expect(onSelect).toHaveBeenCalledWith('technical_skills')

  rerender(
    <ReviewCategorySelector
      categories={categories}
      selectedKey="technical_skills"
      onSelect={onSelect}
    />
  )
  expect(screen.getByText('Broad supported toolset.')).toBeInTheDocument()
  expect(categories[1].score).toBe(8)
})
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage \
  npx vitest run src/tests/reviewUi.test.tsx
```

Expected: FAIL because `ReviewCategorySelector` and `selectLargestDeficitCategory` do not exist.

- [ ] **Step 3: Add the semantic category Button variant**

Add to `buttonVariants.variant` in `src/components/ui/button.tsx`:

```tsx
reviewCategory:
  "h-auto min-h-18 w-full flex-col items-stretch gap-1 rounded-[4px] border-border bg-background px-2.5 py-2 text-left whitespace-normal hover:border-primary/45 hover:bg-muted/60 aria-pressed:border-primary aria-pressed:bg-primary/6 aria-pressed:ring-1 aria-pressed:ring-primary/20",
```

This keeps color, border, typography, hover, focus, and selected styling in the primitive variant rather than overriding them at call sites.

- [ ] **Step 4: Implement the controlled selector and deterministic helper**

Create `src/components/ReviewCategorySelector.tsx`:

```tsx
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
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: the new cases pass and all existing `reviewUi` cases remain green.

- [ ] **Step 6: Review and commit Task 1**

```sh
git diff --check
git add src/components/ReviewCategorySelector.tsx src/components/ui/button.tsx src/tests/reviewUi.test.tsx
git commit -m "feat: add review category selector"
```

---

### Task 2: Recompose successful results with mixed disclosure

**Files:**
- Modify: `src/components/ReviewPanel.tsx`
- Test: `src/tests/reviewUi.test.tsx`

**Interfaces:**
- Consumes: `selectLargestDeficitCategory` and `ReviewCategorySelector` from Task 1.
- Produces: successful result composition with local category selection, compact adjustments, visible improvements/findings, and closed strengths/details.

- [ ] **Step 1: Write failing successful-report behavior tests**

Add these cases:

```tsx
it('defaults to the largest-deficit category and resets for a new review', () => {
  const { rerender } = render(
    <ReviewPanel
      state={{ status: 'success', result: reviewResult }}
      onRequestReview={vi.fn()}
    />
  )

  expect(screen.getByRole('button', { name: /Production Experience, 18 of 25/i }))
    .toHaveAttribute('aria-pressed', 'true')

  const nextResult: ReviewResult = {
    ...reviewResult,
    id: 'review_456',
    categories: [
      ...reviewResult.categories,
      {
        key: 'open_source',
        label: 'Open Source',
        score: 5,
        maxScore: 35,
        evidence: ['External contributions are limited.'],
        suggestions: [],
      },
    ],
  }

  rerender(
    <ReviewPanel
      state={{ status: 'success', result: nextResult }}
      onRequestReview={vi.fn()}
    />
  )
  expect(screen.getByRole('button', { name: /Open Source, 5 of 35/i }))
    .toHaveAttribute('aria-pressed', 'true')
})

it('keeps improvements visible and supporting details closed by default', () => {
  render(
    <ReviewPanel
      state={{ status: 'success', result: reviewResult }}
      onRequestReview={vi.fn()}
    />
  )

  expect(screen.getByText('Quantify production impact.')).toBeVisible()
  expect(screen.getByRole('button', { name: /Key strengths/i }))
    .toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText('Clear technical ownership.')).not.toBeInTheDocument()
  expect(screen.getByText(/Bonus \+3 · Deductions −2/)).toBeVisible()
  expect(screen.getByRole('button', { name: /Adjustment details/i }))
    .toHaveAttribute('aria-expanded', 'false')

  fireEvent.click(screen.getByRole('button', { name: /Key strengths/i }))
  expect(screen.getByText('Clear technical ownership.')).toBeVisible()
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run the focused Vitest command from Task 1. Expected: FAIL because the old report expands all categories and supporting sections.

- [ ] **Step 3: Add local selection reset and the approved report order**

In `ReviewResultDetails`, use review identity—not resume edits—to reset selection:

```tsx
const defaultCategoryKey = selectLargestDeficitCategory(result.categories)
const [selectedCategoryKey, setSelectedCategoryKey] = useState(defaultCategoryKey)

useEffect(() => {
  setSelectedCategoryKey(selectLargestDeficitCategory(result.categories))
}, [result.id, result.categories])
```

Render in this exact order:

```tsx
<div className="flex flex-col gap-3">
  <ReviewScore result={result} />
  <ReviewCategorySelector
    categories={result.categories}
    selectedKey={selectedCategoryKey}
    onSelect={setSelectedCategoryKey}
  />
  <ReviewAdjustmentLedger
    bonuses={result.bonuses}
    deductions={result.deductions}
  />
  <ReviewList title="Areas for improvement" items={result.improvements} />
  <ReviewFindings annotations={result.annotations} />
  <ReviewDisclosure title="Key strengths" items={result.strengths} />
  <ReviewAdjustmentDetails
    bonuses={result.bonuses}
    deductions={result.deductions}
  />
  {hasNoDetailedFindings(result) ? (
    <p className="rounded-[4px] border border-dashed border-border p-2.5 text-xs text-muted-foreground">
      No detailed findings returned.
    </p>
  ) : null}
</div>
```

Use `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` for the two closed sections. Triggers must be real buttons, show `Show`/`Hide`, and rely on Base UI for `aria-expanded`.

- [ ] **Step 4: Implement the compact adjustment ledger**

Use signed sums without changing underlying values:

```tsx
function totalAdjustmentPoints(adjustments: ReviewAdjustment[]): number {
  return adjustments.reduce((total, adjustment) => total + adjustment.points, 0)
}

function ReviewAdjustmentLedger({ bonuses, deductions }: {
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
}) {
  if (bonuses.length === 0 && deductions.length === 0) return null
  const bonus = totalAdjustmentPoints(bonuses)
  const deduction = Math.abs(totalAdjustmentPoints(deductions))

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-y border-border py-2 text-xs">
      <span>Bonus <strong className="text-primary">+{bonus}</strong></span>
      <span aria-hidden="true">·</span>
      <span>Deductions <strong className="text-destructive">−{deduction}</strong></span>
    </div>
  )
}
```

The detailed adjustment disclosure renders labels and evidence as a plain list, not cards.

- [ ] **Step 5: Preserve findings and annotation semantics**

Keep `annotation.id` keys, `formatSeverity`, `formatAnnotationTarget`, the annotation legend, and all existing visible strings. Replace severity spans with `Badge` variants only where the existing semantic colors remain distinguishable. Do not modify inline annotations in resume components.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run the focused Vitest command. Expected: all ReviewPanel cases pass.

- [ ] **Step 7: Review and commit Task 2**

```sh
git diff --check
git add src/components/ReviewPanel.tsx src/tests/reviewUi.test.tsx
git commit -m "refactor: compose successful review results"
```

---

### Task 3: Migrate the shell and non-success states

**Files:**
- Modify: `src/components/ReviewPanel.tsx`
- Modify: `src/components/ui/alert.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/reviewUi.test.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`

**Interfaces:**
- Consumes: successful-result composition from Task 2.
- Produces: stable Card shell and semantic alerts with only inspector geometry left in custom CSS.

- [ ] **Step 1: Add failing semantic-shell assertions**

Augment existing state tests rather than duplicating them:

```tsx
it('uses a stable review shell and semantic alerts for service states', () => {
  const { rerender } = render(
    <ReviewPanel state={{ status: 'checking' }} onRequestReview={vi.fn()} />
  )

  expect(screen.getByRole('complementary', { name: 'Resume review' }))
    .toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Checking review service')

  rerender(
    <ReviewPanel
      state={{ status: 'config_error', error: new Error('Could not reach the review service.') }}
      onRequestReview={vi.fn()}
    />
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Review service unavailable')
  expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'destructive')
})
```

If `Alert` does not currently expose `data-variant`, add it in the minimal implementation rather than testing a CSS class.

- [ ] **Step 2: Run focused tests and verify RED**

Run the focused Vitest command. Expected: FAIL because old empty/status divs are not alerts and the shell is not composed with Card.

- [ ] **Step 3: Add a restrained warning Alert variant**

Add to `alertVariants`:

```tsx
reviewWarning:
  "border-warning-border bg-warning-bg text-warning-ink *:data-[slot=alert-description]:text-warning-ink/90",
```

Pass `data-variant={variant ?? 'default'}` from `Alert` so semantic state tests can inspect the public variant contract.

- [ ] **Step 4: Recompose the stable inspector shell**

First extend `CardProps` with `variant?: "default" | "reviewPanel"` and keep the review surface styling inside `card.tsx`:

```tsx
type CardProps = React.ComponentPropsWithoutRef<"div"> & {
  size?: "default" | "sm"
  variant?: "default" | "reviewPanel"
}

// Merge this conditional into Card's existing cn() call.
variant === "reviewPanel" &&
  "rounded-lg bg-card ring-border shadow-[var(--shadow-panel)]"
```

This prevents the ReviewPanel call site from overriding Card colors, radius, or shadow through `className`.

Preserve the complementary landmark outside the non-polymorphic Card:

```tsx
<aside id={id} className="review-panel" aria-label="Resume review">
  <Card size="sm" variant="reviewPanel" className="max-h-[inherit] overflow-auto">
    <CardHeader className="border-b">
      <CardTitle>Review</CardTitle>
      <CardDescription>Advisory evaluation</CardDescription>
      <CardAction className="flex flex-wrap justify-end gap-1.5">
        <Button
          size="editor"
          onClick={onRequestReview}
          disabled={actionDisabled}
        >
          {isLoading ? 'Reviewing' : 'Review resume'}
        </Button>
        {onClose ? (
          <Button
            variant="outline"
            size="editor"
            onClick={onClose}
            aria-label="Close review panel"
          >
            Close
          </Button>
        ) : null}
      </CardAction>
    </CardHeader>
    <CardContent className="flex flex-col gap-3">
      {renderReviewStateAlert(state, result, resultIsStale)}
      {result ? <ReviewResultDetails state={state} /> : null}
    </CardContent>
  </Card>
</aside>
```

Keep Review action disablement and existing copy exactly as implemented. Keep `size="editor"` on Review and Close.

- [ ] **Step 5: Replace old state helpers with Alert composition**

Use one helper:

```tsx
function ReviewStateAlert({
  title,
  message,
  detail,
  variant = 'default',
}: {
  title?: string
  message: string
  detail?: string
  variant?: 'default' | 'reviewWarning' | 'destructive'
}) {
  return (
    <Alert variant={variant}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>
        <p>{message}</p>
        {detail ? <p>{detail}</p> : null}
      </AlertDescription>
    </Alert>
  )
}
```

Add `renderReviewStateAlert(state, result, resultIsStale)` as an exhaustive status switch that returns the existing title/message/detail strings through `ReviewStateAlert`: checking/idle/loading use `default`; unconfigured/disabled/stale use `reviewWarning`; config/request errors use `destructive`; success returns `null`. Preserve previous results beneath stale and error alerts through the separate `result` render shown in Step 4.

- [ ] **Step 6: Delete superseded ReviewPanel CSS carefully**

Retain only geometry/resilience concerns in `app.css`:

```css
.review-panel {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 1220px) {
  .review-panel {
    position: static;
    width: 100%;
    max-width: min(816px, calc(100vw - 32px));
    max-height: none;
    order: -1;
  }
}
```

Remove replaced selectors for panel header, advisory, empty/status boxes, score, categories, adjustments, sections, findings, and duplicate visual-pass overrides only after `rg` confirms no remaining markup references them. Preserve annotation-marker styles used inside `ResumePage`.

- [ ] **Step 7: Run focused and source-contract tests**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage \
  npx vitest run src/tests/reviewUi.test.tsx src/tests/responsiveLayout.test.ts
```

Expected: PASS. Update source-contract assertions only to reflect intentionally removed selectors; do not weaken the 816px canvas or breakpoint assertions.

- [ ] **Step 8: Review and commit Task 3**

```sh
git diff --check
git add src/components/ReviewPanel.tsx src/components/ui/alert.tsx src/components/ui/card.tsx src/styles/app.css src/tests/reviewUi.test.tsx src/tests/responsiveLayout.test.ts
git commit -m "refactor: migrate review panel presentation"
```

---

### Task 4: Browser boundary coverage, documentation, and release gate

**Files:**
- Modify: `e2e/configured-review.spec.ts`
- Modify: `docs/SHADCN_MIGRATION.md`
- Update: `docs/superpowers/plans/2026-07-10-shadcn-review-panel.md` checkboxes and evidence during execution

**Interfaces:**
- Consumes: completed ReviewPanel surface.
- Produces: verified PR-ready branch with accurate migration status.

- [x] **Step 1: Add only the missing browser contract**

First inspect existing configured and unconfigured Playwright coverage. If no test proves the inspector transition, extend the configured disabled-service test with exact-width assertions:

```ts
await page.setViewportSize({ width: 1221, height: 900 })
await expect(panel).toBeVisible()
const desktopLayout = await page.evaluate(() => {
  const workspace = document.querySelector('.workspace')!.getBoundingClientRect()
  const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
  const review = document.querySelector('.review-panel')!.getBoundingClientRect()
  return {
    reviewRightOfEditor: review.left > editor.right,
    contained: review.right <= workspace.right + 1,
  }
})
expect(desktopLayout).toEqual({ reviewRightOfEditor: true, contained: true })

await page.setViewportSize({ width: 1220, height: 900 })
const stackedLayout = await page.evaluate(() => {
  const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
  const review = document.querySelector('.review-panel')!.getBoundingClientRect()
  return {
    reviewAboveEditor: review.bottom <= editor.top,
    sameLeft: Math.abs(review.left - editor.left) <= 1,
  }
})
expect(stackedLayout).toEqual({ reviewAboveEditor: true, sameLeft: true })
```

Keep the existing exact-560px 44px action assertions. Do not add screenshots.

- [x] **Step 2: Run the focused browser test**

```sh
VITE_REVIEW_API_URL=http://127.0.0.1:8124 npm run build
CI=1 npx playwright test -c playwright.configured.config.ts \
  -g "renders disabled service state"
```

Expected: PASS with the inspector right-aligned at 1221px, stacked at 1220px, and both actions 44px at 560px.

Evidence (2026-07-10): 1 focused configured-review test passed. Its first run caught the stacked left-edge mismatch at 1220px; after aligning the ReviewPanel to `--editor-shell-width`, the assertions passed at 1221px, 1220px, and 560px.

- [x] **Step 3: Run the full automated release gate**

```sh
rm -rf test-results
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
CI=1 npm run test:e2e
rm -rf test-results
npm run build
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --exit-code origin/main...HEAD -- \
  src/styles/resume.css \
  src/types.ts \
  src/storage.ts \
  src/export.ts \
  src/reviewApi.ts
git diff --check
git status --short --branch
```

Expected: all unit and E2E tests pass; the final default unconfigured build succeeds; SPA files are byte-identical; protected files are unchanged; no generated artifacts are staged.

Evidence (2026-07-10): 13 Vitest files / 168 tests and 7 Playwright tests passed (4 unconfigured, 3 configured-review). The final default build transformed 354 modules and emitted `index.html` 0.70 kB (0.39 kB gzip), CSS 65.21 kB (12.83 kB gzip), and JavaScript chunks of 22.03/159.64/202.38/299.48/358.14 kB (8.72/53.38/47.71/94.52/116.81 kB gzip). The SPA files were byte-identical, protected files were unchanged, `git diff --check` passed, and generated `test-results` was removed.

- [x] **Step 4: Complete exact-width manual QA**

Use the configured and unconfigured builds as appropriate:

- 1440px and 1221px: sticky 320–360px inspector to the right; resume remains dominant; no overlap.
- 1220px and 960px: identical report stacked above the editor; no page overflow.
- 561px: Review actions remain 36px.
- 560px and 358px: Review actions are 44px; category grid remains readable; no page overflow.
- 358px: resume remains 816px and scrolls only inside `.resume-canvas-scroll`.
- Check checking, unavailable, config error, idle, loading, success, stale, request error with/without prior result, and empty result.
- Check category hover, selected, focus-visible, activation, evidence replacement, disclosure open/close, and reduced motion.
- Spot-check `/presume/` at 1120px and 358px.

Record observed measurements and any unavailable manual checks accurately.

Evidence (2026-07-10): controller-owned exact-width browser QA passed. At 1440px and 1221px the inspector measured 360px wide and remained to the right of the document-led editor; at 1220px it stacked above with the same left edge and 896px width. At 960/561/560/358px it remained stacked with no document-level overflow. Review/Close measured 36px at 561px and 44px at 560px and 358px. The resume remained 816px; at 358px its scroller measured 302px client width and 836px scroll width. Category selection/evidence replacement, both disclosures, focus-visible styling, success, loading, disabled, config-error, stale, request error with and without prior results, and empty results rendered coherently. Reduced motion reported no loading animation (`animation-name: none`, effective duration `0.01ms`). Checking and unconfigured copy/semantics remain covered by component tests; those transient/unavailable states are not directly reachable as stable configured-browser destinations. Landing screenshots at 1120px and 358px showed no overflow, and direct editor navigation plus browser back returned to `/presume/`.

- [x] **Step 5: Update the roadmap with evidence**

Change PR #3 status in `docs/SHADCN_MIGRATION.md` to implementation complete only after Steps 3 and 4 pass. Record exact unit/E2E counts, build module count and bundle sizes, SPA identity, protected-file result, review result, and exact-width QA. Leave PR publication or merge language pending until those actions occur.

Evidence (2026-07-10): automated and manual evidence are recorded in the roadmap. Publication and merge remain pending.

- [x] **Step 6: Commit documentation and verification evidence**

```sh
git add e2e/configured-review.spec.ts docs/SHADCN_MIGRATION.md docs/superpowers/plans/2026-07-10-shadcn-review-panel.md
git commit -m "docs: record review panel migration verification"
```

Evidence (2026-07-10): automated evidence was committed in `e26c84f`; controller-owned manual evidence is recorded in the follow-up QA commit.

- [x] **Step 7: Request whole-branch review before publishing**

Review `origin/main...HEAD` for behavior preservation, React 18/Base UI composition, state coverage, accessibility, exact 1221/1220 and 561/560 boundaries, dead CSS, protected files, and repository hygiene. Resolve actionable findings with focused regression tests and rerun the relevant focused test plus the full gate.

Evidence (2026-07-10): whole-branch review found three adjustment/stale-state edge cases. Commit `7e4759c` made one-sided ledgers conditional, preserved arbitrary signed values, and restored a separate stale warning beside request errors with stale prior results. Focused tests passed 39/39, the full unit suite passed 170/170, and re-review returned `Ready` with no remaining findings.

---

## PR Scope and Rollback

The PR contains only the approved ReviewPanel presentation, focused tests, CSS cleanup, and migration documentation. It does not begin PR #4 editor-shell consolidation.

Keep Task 1 selector work, Task 2 result composition, Task 3 shell/state migration, and Task 4 verification in separate commits. If the surface regresses, revert the affected presentation commit while retaining the shadcn foundation and PR #2 command deck.
