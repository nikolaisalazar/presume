# Shadcn Editor-Shell Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate Presume's editor application chrome into a centered, document-led workbench with a persistent Fit region, fixed Review rail, and deterministic 1640px three-region layout while preserving every resume, export, persistence, resize, and review-data behavior.

**Architecture:** Keep `App.tsx` as the composition root, extract the Fit and Review rail regions into focused components, and leave `useResumeReview` and the resume document untouched. The constrained DOM order is Fit, editor, Review; a single `min-width: 1640px` CSS enhancement places those same regions in symmetric side tracks around the 896px editor. Component tests cover review-state routing and structural ownership, while Playwright covers real geometry, loading disclosure, fixed-canvas overflow, and the 560/561px boundary.

**Tech Stack:** Vite 6, React 18, TypeScript 5.7, Tailwind CSS 4, shadcn/ui `base-nova` on Base UI, Vitest/Testing Library, Playwright.

## Global Constraints

- Presume remains desktop-first; constrained-width behavior is graceful degradation and deterministic CSS reflow, not a mobile-first redesign.
- Keep the resume canvas exactly 816px wide and keep all narrow horizontal overflow inside `.resume-canvas-scroll`.
- Use the constrained Fit → editor → Review DOM and visual order through 1639px; enable the symmetric three-region layout inclusively at `min-width: 1640px`.
- Keep the central editor shell approximately 896px wide at full desktop geometry: 816px canvas + 24px stage padding on each side + 32px shell allowance.
- Keep a fluid framed header within 28px desktop gutters; it must be broader than the editor when space permits and must not contain a Review control or service-status dot.
- Keep Fit Constraints closed by default. Active formatting warnings remain visible outside the closed `CollapsibleContent`; healthy formatting remains silent.
- Keep the Review rail 52px high, single-line, and stable across checking, ready, loading, success, stale, unavailable, and failure states. Scores use tabular, non-wrapping numerals.
- A first review starts from the rail, stays collapsed and inert while loading, uses the text `Reviewing`, displays a 3px bottom sweep, and never auto-opens or auto-scrolls on completion.
- A rerun preserves access to the previous result while loading and preserves existing stale/error semantics after failure.
- At 560px and below, affected touch-critical controls remain at least 44px high; compact 36px controls may resume at 561px.
- Use only the installed Button, Card, Badge, Separator, Alert, and Collapsible primitives. Do not add a shadcn component, package, icon dependency, animation library, or Tailwind configuration.
- Keep `src/styles/resume.css`, `src/types.ts`, `src/storage.ts`, `src/export.ts`, `src/reviewApi.ts`, `src/reviewTypes.ts`, `src/useResumeReview.ts`, and `src/useResizeEngine.ts` unchanged.
- Keep `ResumePage`, in-document `.editor-control`, `.add-btn`, `.remove-btn`, editor rails, measurement rules, print rules, and PDF capture behavior custom.
- Do not add visual snapshots, network-dependent tests, or a test for every utility class or copy variant.
- Do not introduce Import PDF, provider credentials, authentication, backend changes, stable IDs, schema changes, reorder UI, resume JSON changes, drawers, overlays, bottom sheets, or sticky mobile rails.

---

### Task 1: Replace the header status control with a workspace Review rail

**Files:**
- Create: `src/components/ReviewRail.tsx`
- Modify: `src/tests/reviewUi.test.tsx:1-15,911-1042`

**Interfaces:**
- Consumes: `ResumeReviewState` from `src/useResumeReview.ts` without modifying that union.
- Produces:

```ts
export type ReviewRailAction = 'request' | 'open' | 'none'
export type ReviewRailTone = 'default' | 'success' | 'warning' | 'destructive'

export interface ReviewRailPresentation {
  label: string
  detail: string
  score?: string
  action: ReviewRailAction
  actionLabel?: 'Start' | 'View' | 'Details'
  tone: ReviewRailTone
  loading: boolean
}

export interface ReviewRailProps {
  state: ResumeReviewState
  panelId: string
  onOpenPanel: () => void
  onRequestReview: () => void
}

export function getReviewRailPresentation(
  state: ResumeReviewState
): ReviewRailPresentation

export function ReviewRail(props: ReviewRailProps): JSX.Element
```

- `ReviewRail` owns only presentation and action routing. `App.tsx` continues to own whether the full dashboard is expanded.

- [x] **Step 1: Replace the obsolete control tests with a compact state-routing contract**

Remove the `ReviewStatusControl` imports and its entire describe block. Import the new component and helper:

```ts
import {
  ReviewRail,
  getReviewRailPresentation,
} from '../components/ReviewRail'
```

Add this focused replacement block to `src/tests/reviewUi.test.tsx`:

```tsx
describe('ReviewRail', () => {
  it('routes review states to one stable rail action', () => {
    const cases: Array<
      [ResumeReviewState, Partial<ReturnType<typeof getReviewRailPresentation>>]
    > = [
      [{ status: 'unconfigured' }, { label: 'Review unavailable', action: 'open', actionLabel: 'Details', tone: 'warning' }],
      [{ status: 'checking' }, { label: 'Checking review', action: 'none', loading: false }],
      [{ status: 'idle' }, { label: 'Review resume', action: 'request', actionLabel: 'Start' }],
      [{ status: 'loading' }, { label: 'Reviewing', detail: 'In progress', action: 'none', loading: true }],
      [{ status: 'loading', result: reviewResult }, { label: 'Updating review', score: '81 / 100', action: 'open', actionLabel: 'View', loading: true }],
      [{ status: 'success', result: reviewResult }, { label: 'Review ready', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'success' }],
      [{ status: 'stale', result: reviewResult }, { label: 'Review stale', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'warning' }],
      [{ status: 'error', error: new Error('Review failed.') }, { label: 'Review failed', action: 'open', actionLabel: 'Details', tone: 'destructive' }],
      [{ status: 'error', error: new Error('Update failed.'), result: reviewResult }, { label: 'Update failed', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'destructive' }],
    ]

    cases.forEach(([state, expected]) => {
      expect(getReviewRailPresentation(state)).toMatchObject(expected)
    })
  })

  it('keeps first-review loading inert but lets a preserved result reopen', () => {
    const onOpenPanel = vi.fn()
    const { rerender } = render(
      <ReviewRail
        state={{ status: 'loading' }}
        panelId="resume-review-panel"
        onOpenPanel={onOpenPanel}
        onRequestReview={vi.fn()}
      />
    )

    const firstLoad = screen.getByLabelText('Resume review')
    expect(firstLoad).toHaveAttribute('aria-busy', 'true')
    expect(firstLoad).toHaveAttribute('data-loading', '')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(
      <ReviewRail
        state={{ status: 'loading', result: reviewResult }}
        panelId="resume-review-panel"
        onOpenPanel={onOpenPanel}
        onRequestReview={vi.fn()}
      />
    )

    const view = screen.getByRole('button', { name: 'View review' })
    expect(view).toHaveAttribute('aria-controls', 'resume-review-panel')
    expect(view).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(view)
    expect(onOpenPanel).toHaveBeenCalledTimes(1)
  })
})
```

- [x] **Step 2: Run the focused tests and confirm the old module contract fails**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/reviewUi.test.tsx
```

Expected: FAIL because `../components/ReviewRail` does not exist.

- [x] **Step 3: Implement the state mapping and semantic rail**

Create `src/components/ReviewRail.tsx` with the following implementation. Keep the surface and progress hook custom because this is application chrome, while using the shared Button for the one available action:

```tsx
import { cn } from '@/lib/utils'
import type { ResumeReviewState } from '../useResumeReview'
import { Button } from './ui/button'

export type ReviewRailAction = 'request' | 'open' | 'none'
export type ReviewRailTone = 'default' | 'success' | 'warning' | 'destructive'

export interface ReviewRailPresentation {
  label: string
  detail: string
  score?: string
  action: ReviewRailAction
  actionLabel?: 'Start' | 'View' | 'Details'
  tone: ReviewRailTone
  loading: boolean
}

export interface ReviewRailProps {
  state: ResumeReviewState
  panelId: string
  onOpenPanel: () => void
  onRequestReview: () => void
}

function score(result: { totalScore: number; maxScore: number } | undefined) {
  return result ? `${result.totalScore} / ${result.maxScore}` : undefined
}

export function getReviewRailPresentation(
  state: ResumeReviewState
): ReviewRailPresentation {
  switch (state.status) {
    case 'unconfigured':
      return { label: 'Review unavailable', detail: 'Setup needed', action: 'open', actionLabel: 'Details', tone: 'warning', loading: false }
    case 'checking':
      return { label: 'Checking review', detail: 'Checking availability', action: 'none', tone: 'default', loading: false }
    case 'disabled':
      return { label: 'Review unavailable', detail: 'Setup needed', action: 'open', actionLabel: 'Details', tone: 'warning', loading: false }
    case 'config_error':
      return { label: 'Review unavailable', detail: 'Connection issue', action: 'open', actionLabel: 'Details', tone: 'destructive', loading: false }
    case 'idle':
      return { label: 'Review resume', detail: 'Advisory check', action: 'request', actionLabel: 'Start', tone: 'default', loading: false }
    case 'loading':
      return state.result
        ? { label: 'Updating review', detail: 'Previous result available', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'default', loading: true }
        : { label: 'Reviewing', detail: 'In progress', action: 'none', tone: 'default', loading: true }
    case 'success':
      return { label: 'Review ready', detail: 'Advisory result', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'success', loading: false }
    case 'stale':
      return { label: 'Review stale', detail: 'Resume changed', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'warning', loading: false }
    case 'error':
      return state.result
        ? { label: 'Update failed', detail: 'Previous result available', score: score(state.result), action: 'open', actionLabel: 'View', tone: 'destructive', loading: false }
        : { label: 'Review failed', detail: 'Open for details', action: 'open', actionLabel: 'Details', tone: 'destructive', loading: false }
  }
}

export function ReviewRail({
  state,
  panelId,
  onOpenPanel,
  onRequestReview,
}: ReviewRailProps) {
  const presentation = getReviewRailPresentation(state)
  const action = presentation.action === 'request' ? onRequestReview : onOpenPanel
  const accessibleAction = presentation.actionLabel === 'Start'
    ? 'Start review'
    : presentation.actionLabel === 'View'
      ? 'View review'
      : 'Review details'

  return (
    <section
      className={cn(
        'review-rail relative flex h-[52px] min-w-0 items-center gap-2 overflow-hidden rounded-lg border bg-background px-3 shadow-[var(--shadow-panel)]',
        presentation.tone === 'success' && 'border-review-success-border bg-review-success-bg text-review-success-ink',
        presentation.tone === 'warning' && 'border-warning-border bg-warning-bg text-warning-ink',
        presentation.tone === 'destructive' && 'border-destructive/40 bg-destructive/10 text-destructive'
      )}
      aria-label="Resume review"
      aria-busy={presentation.loading || undefined}
      data-slot="review-rail"
      data-tone={presentation.tone}
      {...(presentation.loading ? { 'data-loading': '' } : {})}
    >
      <div className="flex min-w-0 flex-1 items-baseline gap-2 overflow-hidden">
        <strong className="truncate text-[13px] font-bold">{presentation.label}</strong>
        <span className="truncate text-xs font-semibold opacity-75">{presentation.detail}</span>
      </div>
      {presentation.score ? (
        <strong className="min-w-[58px] shrink-0 whitespace-nowrap text-right text-[13px] font-bold tabular-nums">
          {presentation.score}
        </strong>
      ) : null}
      {presentation.action !== 'none' ? (
        <Button
          variant="outline"
          size="editor"
          className="shrink-0"
          onClick={action}
          aria-label={accessibleAction}
          aria-controls={presentation.action === 'open' ? panelId : undefined}
          aria-expanded={presentation.action === 'open' ? false : undefined}
        >
          {presentation.actionLabel}
        </Button>
      ) : null}
      {presentation.loading ? <span className="review-rail__progress" aria-hidden="true" /> : null}
      <span className="sr-only" aria-live="polite">
        {presentation.label}{presentation.score ? `, ${presentation.score}` : ''}
      </span>
    </section>
  )
}
```

- [x] **Step 4: Run the focused tests and type-check through the production build**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/reviewUi.test.tsx
npm run build
```

Expected: the Review UI test file passes and the build succeeds. `ReviewStatusControl.tsx` can still be referenced by `App.tsx` until Task 2; do not delete it until Task 2 switches the import atomically.

- [x] **Step 5: Commit the isolated Review rail contract**

```sh
git add src/components/ReviewRail.tsx src/tests/reviewUi.test.tsx
git commit -m "feat: add persistent review rail"
```

---

### Task 2: Recompose the Fit, editor, and Review regions

**Files:**
- Create: `src/components/FitConstraintsPanel.tsx`
- Modify: `src/App.tsx:1-177`
- Modify: `src/components/ReviewPanel.tsx:20-82`
- Modify: `src/components/Toolbar.tsx:49-62`
- Modify: `src/components/ui/button.tsx:1-42`
- Modify: `src/tests/appIntegration.test.tsx:122-232`
- Modify: `src/tests/uiPrimitives.test.tsx:98-124`
- Delete: `src/components/ReviewStatusControl.tsx`

**Interfaces:**
- Consumes: `ReviewRail`, `ReviewRailProps`, `SettingsPanel`, `FormattingWarningSummary`, and the unchanged `ResumeReviewState` union.
- Produces:

```ts
interface FitConstraintsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
  bulletWarningCount: number
  hasGlobalOverflow: boolean
}

export function FitConstraintsPanel(
  props: FitConstraintsPanelProps
): JSX.Element
```

- `App.tsx` owns `reviewPanelOpen`; no dismissed-result key or automatic-opening helper remains.

- [x] **Step 1: Update the editor integration test to describe the approved region ownership**

In the unconfigured integration flow, replace the assertions that Review is absent with:

```tsx
expect(screen.getByLabelText('Resume review')).toHaveAttribute('data-slot', 'review-rail')
expect(screen.getByText('Review unavailable')).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: 'Review details' }))
expect(screen.getByRole('complementary', { name: 'Resume review' })).toBeInTheDocument()
fireEvent.click(screen.getByRole('button', { name: 'Collapse review' }))
```

Replace the command-deck structural assertions with:

```tsx
const fitRegion = screen.getByRole('complementary', {
  name: 'Fit constraints and formatting',
})
const editor = screen.getByRole('region', { name: 'Resume editor' })
const reviewRegion = screen.getByRole('region', { name: 'Review workspace' })
const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })

expect(fitRegion.compareDocumentPosition(editor)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
expect(editor.compareDocumentPosition(reviewRegion)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
expect(editor).toContainElement(toolbar)
expect(container.querySelector('[data-slot="command-deck"]')).not.toBeInTheDocument()
expect(screen.queryByText('Letter · fixed canvas')).not.toBeInTheDocument()
expect(screen.queryByText('Direct edit')).not.toBeInTheDocument()
```

Keep the existing stepper content, action-label, warning-copy, import, export, persistence, and reset assertions. Change the warning ownership assertion to:

```tsx
const fitRegion = screen.getByRole('complementary', {
  name: 'Fit constraints and formatting',
})
expect(fitRegion).toContainElement(screen.getByRole('status'))
```

- [x] **Step 2: Run the focused integration file and verify the old composition fails**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx
```

Expected: FAIL because Review is absent when unconfigured, the old command deck still exists, and no Fit/Review workspace landmarks exist.

- [x] **Step 3: Extract the Fit region without changing constraint behavior**

Create `src/components/FitConstraintsPanel.tsx`:

```tsx
import type { Constraints } from '../types'
import { FormattingWarningSummary } from './FormattingWarningSummary'
import { SettingsPanel } from './SettingsPanel'

interface FitConstraintsPanelProps {
  constraints: Constraints
  onChange: (constraints: Constraints) => void
  bulletWarningCount: number
  hasGlobalOverflow: boolean
}

export function FitConstraintsPanel({
  constraints,
  onChange,
  bulletWarningCount,
  hasGlobalOverflow,
}: FitConstraintsPanelProps) {
  return (
    <aside
      className="fit-region min-w-0 overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-panel)]"
      aria-label="Fit constraints and formatting"
      data-slot="fit-region"
    >
      <SettingsPanel constraints={constraints} onChange={onChange} />
      <FormattingWarningSummary
        bulletWarningCount={bulletWarningCount}
        hasGlobalOverflow={hasGlobalOverflow}
        constraints={constraints}
      />
    </aside>
  )
}
```

The warning is a sibling of `SettingsPanel`, so it remains visible while the inner Collapsible is closed.

- [x] **Step 4: Replace App's automatic panel state with explicit rail expansion**

In `src/App.tsx`, remove imports for `SettingsPanel`, `FormattingWarningSummary`, `Separator`, and `ReviewStatusControl`. Add:

```ts
import { FitConstraintsPanel } from './components/FitConstraintsPanel'
import { ReviewRail } from './components/ReviewRail'
```

Replace the review state/handlers with:

```ts
const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
const reviewPanelId = 'resume-review-panel'
const requestReview = () => {
  void review.requestReview()
}
const openReviewPanel = () => setReviewPanelOpen(true)
const closeReviewPanel = () => setReviewPanelOpen(false)
```

Remove `reviewPanelDismissedKey`, `showReviewPanel`, `toggleReviewPanel`, `getUsefulReviewPanelKey`, and `shouldShowReviewPanel`. Remove `ReviewStatusControl` from `.app-header__meta`, leaving only the `Saved locally` Badge.

Replace `<main>` with this semantic order:

```tsx
<main className="workspace">
  <FitConstraintsPanel
    constraints={constraints}
    onChange={setConstraints}
    bulletWarningCount={bulletWarningCount}
    hasGlobalOverflow={hasGlobalOverflowWarning}
  />
  <section className="editor-panel" aria-label="Resume editor">
    <div
      className="document-actions-surface overflow-hidden rounded-lg border border-border bg-background shadow-[var(--shadow-panel)]"
      data-slot="document-actions"
    >
      <Toolbar
        resume={resume}
        pageRef={pageRef}
        onImport={setResume}
        onReset={() => setResume(DEFAULT_RESUME)}
      />
    </div>
    <div className="resume-stage">
      <div className="resume-canvas-scroll" aria-label="Fixed-width resume canvas">
        <div className="resume-canvas">
          <ResumePage
            ref={pageRef}
            resume={resume}
            onResumeChange={setResume}
            warnings={warnings}
            reviewAnnotations={reviewAnnotations}
          />
        </div>
      </div>
    </div>
  </section>
  <section className="review-region" aria-label="Review workspace">
    {reviewPanelOpen ? (
      <ReviewPanel
        id={reviewPanelId}
        state={review.state}
        onRequestReview={requestReview}
        onClose={closeReviewPanel}
      />
    ) : (
      <ReviewRail
        state={review.state}
        panelId={reviewPanelId}
        onOpenPanel={openReviewPanel}
        onRequestReview={requestReview}
      />
    )}
  </section>
</main>
```

This makes first-load completion stay collapsed because review-state changes no longer set `reviewPanelOpen`. A rerun started inside an already open `ReviewPanel` leaves that panel open.

- [x] **Step 5: Make the dashboard's close action an explicit collapse control**

In `src/components/ReviewPanel.tsx`, retain the Card composition and result rendering. Change only the optional close Button:

```tsx
<Button
  variant="outline"
  size="editor"
  onClick={onClose}
  aria-label="Collapse review"
>
  Collapse
</Button>
```

Do not alter score, category selection, adjustment, finding, stale-result, loading, or error rendering.

- [x] **Step 6: Remove test-only Toolbar class ownership**

In `src/components/Toolbar.tsx`, replace both `toolbar__group` class names with `data-slot="toolbar-group"`; retain the existing Tailwind classes and `aria-label` values:

```tsx
<div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Export actions">
```

```tsx
<div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="File actions">
```

- [x] **Step 7: Remove the superseded header-only Button variants**

After `ReviewStatusControl.tsx` is deleted, `review`, `reviewSuccess`, `reviewWarning`, and `reviewError` have no consumers. In `src/components/ui/button.tsx`, delete `reviewVariantClasses` and those four entries from `buttonVariants`; retain `default`, `outline`, `secondary`, `ghost`, `destructive`, `link`, `dangerOutline`, `reviewCategory`, and every size unchanged.

In `src/tests/uiPrimitives.test.tsx`, delete only the test named `keeps the shared blue keyboard focus treatment for review buttons`. Keep the ref-forwarding and semantic primary-hover tests intact. The Review rail uses the shared outline Button for its action, while rail tone and the 3px sweep belong to the application surface rather than a Button variant.

- [x] **Step 8: Delete the superseded Review control and run focused verification**

Delete `src/components/ReviewStatusControl.tsx`, then run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx src/tests/uiPrimitives.test.tsx
npm run build
```

Expected: all three focused files pass, the build succeeds, and `rg "ReviewStatusControl|command-deck|resume-stage__chrome|toolbar__group|reviewVariantClasses|reviewSuccess|reviewError" src` returns no matches. `reviewWarning` remains valid in Alert and Badge variants used by `ReviewPanel`.

- [x] **Step 9: Commit the semantic workspace composition**

```sh
git add src/App.tsx src/components/FitConstraintsPanel.tsx src/components/ReviewPanel.tsx src/components/ReviewRail.tsx src/components/Toolbar.tsx src/components/ReviewStatusControl.tsx src/components/ui/button.tsx src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx src/tests/uiPrimitives.test.tsx
git commit -m "refactor: compose editor workspace regions"
```

---

### Task 3: Replace layered shell CSS with the derived geometry

**Files:**
- Modify: `src/styles/app.css:1-718`
- Modify: `src/tests/responsiveLayout.test.ts:1-108`
- Modify: `e2e/unconfigured.spec.ts:4-273`

**Interfaces:**
- Consumes: `.fit-region`, `.editor-panel`, `.review-region`, `.review-rail`, `.review-rail__progress`, `.resume-canvas-scroll`, and `[data-slot="toolbar-group"]` from Tasks 1-2.
- Produces CSS variables `--stage-padding`, `--editor-shell-width`, and `--wide-workspace-width`, plus the inclusive `@media (min-width: 1640px)` geometry contract. The 1640px boundary is derived from 320px minimum side tracks; the 1660px content maximum permits both symmetric tracks to grow to 360px on larger viewports.

- [x] **Step 1: Replace brittle source-string tests with narrow custom-CSS invariants**

Rewrite `src/tests/responsiveLayout.test.ts` so it checks only infrastructure that intentionally remains custom:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(`${process.cwd()}/src/styles/app.css`, 'utf8')

describe('custom editor CSS invariants', () => {
  it('keeps named fixed-canvas and derived wide-workspace geometry', () => {
    expect(appCss).toContain('--editor-shell-width: calc(var(--page-width) + (var(--stage-padding) * 2) + 32px);')
    expect(appCss).toContain('--wide-workspace-width: 1660px;')
    expect(appCss).toContain('@media (min-width: 1640px)')
    expect(appCss).toContain('grid-template-columns: minmax(320px, 1fr) var(--editor-shell-width) minmax(320px, 1fr);')
  })

  it('keeps fixed-canvas scrolling and the 3px review progress hook custom', () => {
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('overflow-x: auto')
    expect(appCss).toContain('.review-rail__progress')
    expect(appCss).toContain('height: 3px')
  })

  it('keeps in-document controls and print hiding intact', () => {
    expect(appCss).toContain('--editor-control-resting-opacity')
    expect(appCss).toContain('.editor-control')
    expect(appCss).toContain('.add-btn')
    expect(appCss).toContain('.remove-btn')
    expect(appCss).toContain('@media print')
    expect(appCss).toContain("[data-editor-only='true']")
  })

  it('does not retain superseded shell generations', () => {
    expect(appCss).not.toContain('.workspace--with-review')
    expect(appCss).not.toContain('.resume-stage__chrome')
    expect(appCss).not.toContain('.app-header__status')
    expect(appCss).not.toContain('@media (max-width: 1220px)')
  })
})
```

- [x] **Step 2: Update unconfigured Playwright contracts before changing CSS**

In `e2e/unconfigured.spec.ts`:

- Replace the absent-Review assertions with a visible `[data-slot="review-rail"]` and a `Review details` action.
- Replace `[data-slot="command-deck"]` with `[data-slot="document-actions"]`; assert four Buttons and zero Separators inside it.
- Replace `.toolbar__group` queries with `[data-slot="toolbar-group"]`.
- In the narrow-overflow loop, measure `.review-region` instead of `.review-panel` and require it to remain inside the viewport rather than requiring width zero.

Add one geometry helper in the existing narrow-overflow test:

```ts
const editorGeometry = async (width: number) => {
  await page.setViewportSize({ width, height: 1100 })
  await page.goto('./editor/')
  return page.evaluate(() => {
    const header = document.querySelector('.app-header')!.getBoundingClientRect()
    const workspace = document.querySelector('.workspace')!.getBoundingClientRect()
    const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
    const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
    const review = document.querySelector('.review-region')!.getBoundingClientRect()
    const resume = document.querySelector('.resume-page')!.getBoundingClientRect()
    const scroller = document.querySelector('.resume-canvas-scroll') as HTMLElement
    return {
      header: { left: header.left, right: header.right, width: header.width },
      workspace: { left: workspace.left, right: workspace.right },
      fit: { left: fit.left, right: fit.right, top: fit.top, bottom: fit.bottom },
      editor: { left: editor.left, right: editor.right, top: editor.top, bottom: editor.bottom, width: editor.width },
      review: { left: review.left, right: review.right, top: review.top, bottom: review.bottom },
      resumeWidth: resume.width,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      scrollerClientWidth: scroller.clientWidth,
      scrollerScrollWidth: scroller.scrollWidth,
    }
  })
}
```

Use it in the same E2E case to assert:

```ts
const wide = await editorGeometry(1640)
expect(wide.fit.right).toBeLessThanOrEqual(wide.editor.left)
expect(wide.review.left).toBeGreaterThanOrEqual(wide.editor.right)
expect(Math.abs((wide.editor.left + wide.editor.right) / 2 - 820)).toBeLessThanOrEqual(1)
expect(wide.editor.width).toBe(896)
expect(wide.header.width).toBeGreaterThan(wide.editor.width)
expect(wide.resumeWidth).toBe(816)

const constrained = await editorGeometry(1639)
expect(constrained.fit.bottom).toBeLessThanOrEqual(constrained.editor.top)
expect(constrained.editor.bottom).toBeLessThanOrEqual(constrained.review.top)
expect(Math.abs((constrained.editor.left + constrained.editor.right) / 2 - 819.5)).toBeLessThanOrEqual(1)
expect(constrained.editor.width).toBe(896)
expect(constrained.resumeWidth).toBe(816)

const narrow = await editorGeometry(358)
expect(narrow.resumeWidth).toBe(816)
expect(narrow.documentWidth).toBeLessThanOrEqual(narrow.viewportWidth)
expect(narrow.scrollerClientWidth).toBeLessThan(narrow.scrollerScrollWidth)
```

- [x] **Step 3: Run the focused CSS and browser tests and confirm they fail against old geometry**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/responsiveLayout.test.ts
npm run test:e2e:unconfigured -- --grep "viewport overflow"
```

Expected: the unit test fails on old selectors and the browser test fails because the old shell has neither the persistent three-region geometry nor the 1640/1639 contract.

- [x] **Step 4: Consolidate the shell portion of `app.css` while preserving document controls**

Remove the duplicate early shell, “Premium editor redesign overrides,” “Visual Pass 2,” “full-width desktop resume stage,” and “unified command deck” definitions for `.app`, `.app-header`, `.workspace`, `.workspace--with-review`, `.editor-panel`, `.review-panel`, `.resume-canvas-scroll`, `.resume-canvas`, and `.resume-stage__chrome`. Retain the live landing-independent brand rules and all in-document control, print, focus, coarse-pointer, and reduced-motion rules.

Define one shell source of truth with these exact geometry declarations:

```css
:root {
  --app-bg: #e7ecf3;
  --app-bg-deep: #d6e0eb;
  --ink: #0f172a;
  --muted-foreground: #536173;
  --surface: #ffffff;
  --surface-subtle: #f6f8fb;
  --line: #c8d2de;
  --border: #cbd5e1;
  --border-strong: #9fb0c2;
  --primary: #0f5f5c;
  --primary-hover: #0a4543;
  --danger: var(--destructive);
  --focus: #2563eb;
  --stage-surface: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(229, 236, 245, 0.72));
  --stage-padding: 24px;
  --editor-shell-width: calc(var(--page-width) + (var(--stage-padding) * 2) + 32px);
  --wide-workspace-width: 1660px;
  --editor-control-resting-opacity: 0.34;
  --shadow-panel: 0 1px 0 rgba(255, 255, 255, 0.95), 0 18px 42px rgba(15, 23, 42, 0.09);
  --shadow-stage: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 20px 60px rgba(15, 23, 42, 0.13);
  --shadow-page-premium: 0 34px 80px rgba(15, 23, 42, 0.24), 0 8px 18px rgba(15, 23, 42, 0.12);
  --shadow-page: var(--shadow-page-premium);
}

.app {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: stretch;
  gap: 22px;
  padding: 28px 28px 64px;
}

.app-header {
  display: flex;
  width: min(var(--wide-workspace-width), 100%);
  align-self: center;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95), 0 18px 50px rgba(15, 23, 42, 0.08);
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, var(--editor-shell-width));
  grid-template-areas: "fit" "editor" "review";
  justify-content: center;
  align-items: start;
  gap: 22px;
  width: min(var(--editor-shell-width), 100%);
  min-width: 0;
  align-self: center;
}

.fit-region {
  grid-area: fit;
  width: 100%;
  min-width: 0;
}

.editor-panel {
  grid-area: editor;
  display: flex;
  width: 100%;
  max-width: var(--editor-shell-width);
  min-width: 0;
  flex-direction: column;
  gap: 16px;
}

.review-region {
  grid-area: review;
  width: 100%;
  min-width: 0;
}

.review-panel {
  min-width: 0;
  max-height: none;
  overflow-wrap: anywhere;
}

.resume-canvas-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  padding: var(--stage-padding);
  scrollbar-gutter: stable both-edges;
  border: 1px solid rgba(148, 163, 184, 0.38);
  border-radius: 12px;
  background: var(--stage-surface);
  box-shadow: var(--shadow-stage);
}

.resume-canvas {
  width: max-content;
  margin: 0 auto;
  filter: drop-shadow(0 28px 30px rgba(15, 23, 42, 0.12));
}

.review-rail__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 46%;
  height: 3px;
  transform: translateX(-120%);
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  animation: review-progress-sweep 1.4s ease-in-out infinite;
}

@media (min-width: 1640px) {
  .workspace {
    width: min(var(--wide-workspace-width), 100%);
    grid-template-columns: minmax(320px, 1fr) var(--editor-shell-width) minmax(320px, 1fr);
    grid-template-areas: "fit editor review";
  }

  .fit-region {
    width: min(240px, 100%);
    justify-self: end;
  }

  .review-region {
    width: min(360px, 100%);
    justify-self: start;
  }

  .review-panel {
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
  }
}

@media (max-width: 960px) {
  :root {
    --stage-padding: 10px;
  }

  .app {
    padding-inline: 16px;
  }
}

@media (max-width: 560px) {
  .app {
    padding: 14px 12px 40px;
  }

  .app-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: 10px;
  }

  .app-header__meta {
    justify-content: flex-start;
  }

  .resume-canvas-scroll {
    border-radius: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .review-rail__progress {
    left: 50%;
    transform: translateX(-50%);
    animation: none;
  }
}
```

Retain the existing `body` workbench background, `.app-header__brand*` styling, annotation legend styling, in-document control styling, and the general reduced-motion rule once each. Do not duplicate token declarations already owned by `src/styles/globals.css`; keep only application-shell aliases still consumed by `app.css` or `resume.css`.

- [x] **Step 5: Run focused geometry verification**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/responsiveLayout.test.ts src/tests/appIntegration.test.tsx
npm run test:e2e:unconfigured -- --grep "viewport overflow|expanded fit constraints"
```

Expected: focused unit tests pass; Playwright proves the 1640/1639 placement, 896px editor maximum, 816px resume, 358px internal scroll, no document overflow, and intact Fit controls.

- [x] **Step 6: Commit the consolidated shell geometry**

```sh
git add src/styles/app.css src/tests/responsiveLayout.test.ts e2e/unconfigured.spec.ts
git commit -m "refactor: consolidate editor shell geometry"
```

---

### Task 4: Protect Review disclosure, stable rail geometry, and reruns in Playwright

**Files:**
- Modify: `e2e/configured-review.spec.ts:1-137`

**Interfaces:**
- Consumes: the `ReviewRail` action labels and App disclosure behavior from Tasks 1-2.
- Produces: browser contracts for 52px rail stability, no first-load auto-expansion, explicit View expansion, preserved-result reruns, 1640/1639 placement, and 560/561px action sizing.

- [x] **Step 1: Update unavailable-state expansion and the new wide boundary**

In the disabled-service test, locate the rail with `[data-slot="review-rail"]`, click `Review details`, and retain the existing explanation assertion. Change the panel close query to `Collapse review`.

Replace the old 1221/1220 geometry checks with:

```ts
await page.setViewportSize({ width: 1640, height: 900 })
const wide = await page.evaluate(() => {
  const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
  const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
  const review = document.querySelector('.review-region')!.getBoundingClientRect()
  return {
    fitLeft: fit.right <= editor.left,
    reviewRight: review.left >= editor.right,
  }
})
expect(wide).toEqual({ fitLeft: true, reviewRight: true })

await page.setViewportSize({ width: 1639, height: 900 })
const stacked = await page.evaluate(() => {
  const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
  const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
  const review = document.querySelector('.review-region')!.getBoundingClientRect()
  return {
    fitAbove: fit.bottom <= editor.top,
    reviewBelow: editor.bottom <= review.top,
  }
})
expect(stacked).toEqual({ fitAbove: true, reviewBelow: true })
```

- [x] **Step 2: Extend the existing successful-review flow instead of adding a parallel E2E case**

Use two deferred response gates in the existing “submits a PDF review” test:

```ts
let requestCount = 0
let releaseFirst!: () => void
let releaseSecond!: () => void
const firstGate = new Promise<void>(resolve => { releaseFirst = resolve })
const secondGate = new Promise<void>(resolve => { releaseSecond = resolve })
```

In the `/reviews` route, increment `requestCount`, retain all multipart PDF assertions, await `firstGate` for request 1 and `secondGate` for request 2, then fulfill with `reviewFixture`.

Before the first click, record the ready rail bounding box. Click `Start review`, assert `Reviewing` and `In progress`, assert the dashboard is absent, and record the loading rail box. Release the first request, wait for `Review ready`, record the success rail box, and assert equal width and height with a 52px height:

```ts
expect(loadingBox).toMatchObject({ width: readyBox!.width, height: 52 })
expect(successBox).toMatchObject({ width: readyBox!.width, height: 52 })
expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
```

Click `View review` and retain all existing score, tier, category, evidence, disclosure, adjustment, annotation, and stale-result assertions.

Start a second review from the open dashboard, assert the prior `81 / 100` remains visible, collapse the dashboard, assert the rail reads `Updating review` and still exposes `View review`, reopen it, and assert the prior score remains visible before calling `releaseSecond()`.

- [x] **Step 3: Cover the inclusive touch boundary in the same configured flow**

With the Review dashboard open, measure `Review resume` and `Collapse review` at 560px and 561px:

```ts
await page.setViewportSize({ width: 560, height: 900 })
for (const action of [
  page.getByRole('button', { name: 'Review resume' }),
  page.getByRole('button', { name: 'Collapse review' }),
]) {
  await expect(action).toHaveCSS('height', '44px')
}

await page.setViewportSize({ width: 561, height: 900 })
for (const action of [
  page.getByRole('button', { name: 'Review resume' }),
  page.getByRole('button', { name: 'Collapse review' }),
]) {
  await expect(action).toHaveCSS('height', '36px')
}
```

The existing unconfigured Fit test continues to cover the Fit stepper side of the same boundary.

- [x] **Step 4: Run the configured browser suite and fix only concrete contract failures**

Run:

```sh
CI=1 npm run test:e2e:configured
```

Expected: 3 configured-review tests pass. Do not alter the protected hook or review API to satisfy presentation tests.

- [x] **Step 5: Commit the browser behavior contract**

```sh
git add e2e/configured-review.spec.ts
git commit -m "test: cover review rail disclosure contracts"
```

---

### Task 5: Run the release gate, perform visual QA, and update the migration record

**Files:**
- Modify: `docs/SHADCN_MIGRATION.md:96-132`
- Modify: `docs/superpowers/plans/2026-07-13-shadcn-editor-shell-consolidation.md`

**Interfaces:**
- Consumes: all completed implementation tasks.
- Produces: a verified, reviewable branch with an accurate migration status and recorded manual-QA state.

Verification record (2026-07-13): focused Vitest passed 4 files/57 tests; the full gate passed 13 files/159 tests and 7 E2E tests (4 unconfigured, 3 configured-review); the default build transformed 355 modules; SPA fallback comparison, protected-file scope, and whitespace checks passed. Manual in-app-browser QA is pending because browser-client reported `Browser is not available: iab` and browser discovery returned no available surfaces; no alternate browser tooling was used.

- [x] **Step 1: Run the focused test set before the full gate**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx src/tests/responsiveLayout.test.ts src/tests/uiPrimitives.test.tsx
```

Expected: the four focused files pass with no local-storage warning or unhandled rejection.

- [x] **Step 2: Run the complete automated release gate**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
CI=1 npm run test:e2e
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --exit-code origin/main...HEAD -- \
  src/styles/resume.css \
  src/types.ts \
  src/storage.ts \
  src/export.ts \
  src/reviewApi.ts \
  src/reviewTypes.ts \
  src/useResumeReview.ts \
  src/useResizeEngine.ts
git diff --check
```

Expected: all unit and E2E tests pass, the production build succeeds, SPA entry files are byte-identical, protected files have no diff, and whitespace validation passes. Record the actual counts and bundle sizes; do not copy historical counts.

- [ ] **Step 3: Perform exact-width manual QA in the in-app browser**

Pending: no manual width or state was rendered because the required in-app browser surface was unavailable. The migration record lists every outstanding viewport, state, interaction, routing, export, persistence, focus, and reduced-motion check.

Check `/presume/editor/` in this order:

1. 1640px: Fit left, editor centered at 896px, Review right, symmetric tracks, header broader than editor, no overlap.
2. 1639px: Fit above, centered editor, Review below, no side compression.
3. 1440px, 1120px, 960px: desktop/laptop hierarchy remains document-led and the resume is the dominant surface.
4. 561px and 560px: compact-to-touch control sizing changes at the inclusive boundary.
5. 358px: the page has no horizontal overflow, the resume remains 816px, and only the canvas scroller overflows.

Exercise Fit closed/open and an active formatting warning. Exercise Review checking, ready, first loading, success, stale, unavailable, configuration error, request error, and rerun-with-result. Confirm keyboard focus, reduced motion, direct editor navigation, browser Back, JSON import/export, PDF export, Reset cancellation, and LocalStorage persistence. Spot-check `/presume/` at desktop width and 358px for global regressions.

If exact viewport control or a required state cannot be inspected, record that item as pending. Do not infer manual completion from Playwright.

- [x] **Step 4: Update the migration record with factual evidence**

In `docs/SHADCN_MIGRATION.md`, change PR 4's status from design approved to implementation complete on `feat/shadcn-editor-shell-consolidation`, summarize the final region composition, and record:

- the exact unit/E2E counts and build output from Step 2;
- the 1640/1639, 560/561, and 358px automated evidence;
- the protected-file and SPA-fallback results;
- each completed manual-QA width and state;
- any manual item that remains pending, using the word `pending` only for an actual unfinished release gate.

Do not mark the PR merged or independently reviewed before those events occur.

- [x] **Step 5: Review repository hygiene and commit the verified record**

```sh
rm -rf test-results
git status --short --branch
git diff --check
git diff --name-only origin/main...HEAD
```

Expected: no `dist/`, `test-results/`, screenshots, traces, or other generated artifacts are tracked. The changed files are limited to the editor-shell implementation, its focused tests, and its two approved documentation files.

```sh
git add docs/SHADCN_MIGRATION.md docs/superpowers/plans/2026-07-13-shadcn-editor-shell-consolidation.md
git commit -m "docs: record editor shell verification"
```

- [x] **Step 6: Request independent whole-branch review before publication or merge**

Review `origin/main...HEAD` against `docs/superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md`. The review must prioritize regressions in state disclosure, 1640/1639 geometry, 560/561 touch sizing, 358px overflow containment, accessibility, fixed-canvas/export behavior, protected-file scope, and generated artifacts. Address only concrete findings, rerun the relevant focused test plus the complete release gate, and update the migration record with the final reviewed head SHA.

Review result (2026-07-13): implementation/documentation head `0431dc30a337733ef8cf9154ac1554e2edbee129` received no Critical, Important, or Minor findings and is ready to publish as a PR. The documentation-only commit that records this result is not part of the reviewed head. Exact-width manual in-app-browser QA remains pending as a pre-merge gate.

---

### Task 6: Equalize the wide Fit and Review surfaces after manual QA

**Files:**
- Modify: `e2e/unconfigured.spec.ts:292-303`
- Modify: `src/styles/app.css:372-387`
- Modify: `docs/superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md:189-197`
- Modify: `docs/SHADCN_MIGRATION.md:130-143`

**Interfaces:**
- Consumes: the existing symmetric `minmax(320px, 1fr)` side tracks, 896px editor shell, and `editorGeometry()` Playwright helper.
- Produces: equal visible Fit and Review widths at and above 1640px, capped at 360px, with no change to the centered editor or constrained layout.

Manual-QA finding (2026-07-14): the 240px Fit cap creates an 82–120px visible mismatch beside the 320–360px Review surface and forces avoidable Fit summary wrapping. The approved correction is to give both surfaces the same 360px maximum width.

- [x] **Step 1: Write the failing wide-geometry assertions**

Extend the existing wide geometry contract in `e2e/unconfigured.spec.ts`:

```ts
const wide = await editorGeometry(1640)
expect(Math.abs(wide.fit.width - wide.review.width)).toBeLessThanOrEqual(1)

const wideMax = await editorGeometry(1920)
expect(wideMax.fit.width).toBe(360)
expect(wideMax.review.width).toBe(360)
```

Retain the current placement, editor-center, 896px editor, 816px resume, 1639px stack, and 358px overflow assertions.

- [x] **Step 2: Run the focused browser test and verify the regression fails**

Run:

```sh
CI=1 npx playwright test -c playwright.unconfigured.config.ts -g "keeps viewport overflow inside the fixed resume canvas scroller at narrow widths"
```

Expected before implementation: FAIL because Fit is 240px while Review fills approximately 322px at 1640px; the 1920px check also observes Fit at 240px and Review at 360px.

- [x] **Step 3: Implement the equal-width wide surfaces**

Change only the Fit width inside `@media (min-width: 1640px)` in `src/styles/app.css`:

```css
.fit-region {
  width: min(360px, 100%);
  justify-self: end;
}
```

Keep Review at `width: min(360px, 100%)`, preserve both `justify-self` directions, and do not change grid tracks, gaps, the editor width, or any rule below 1640px.

- [x] **Step 4: Run the focused browser test and verify it passes**

Run the same Playwright command from Step 2.

Expected: PASS with equal Fit and Review widths at 1640px and 360px caps at 1920px.

TDD evidence (2026-07-14): after the geometry helper exposed Fit and Review widths, RED failed at 1640px with an expected delta of at most 1px and a received delta of 82px (Fit 240px versus Review 322px). After the one-line Fit cap change and a production rebuild, GREEN passed 1/1 focused Playwright test, including the 1920px 360px caps and all retained center, fixed-canvas, stack, and overflow assertions.

- [x] **Step 5: Update the migration record and run the complete release gate**

Record that manual QA superseded the original narrow-Fit assumption, then run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
CI=1 npm run test:e2e
npm run build
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --exit-code origin/main...HEAD -- \
  src/styles/resume.css \
  src/types.ts \
  src/storage.ts \
  src/export.ts \
  src/reviewApi.ts \
  src/reviewTypes.ts \
  src/useResumeReview.ts \
  src/useResizeEngine.ts
git diff --check
git status --short --branch
```

Expected: all automated checks pass, the default build is restored after configured E2E, protected files remain unchanged, and only the approved layout, test, and documentation files are modified.

Release-gate evidence (2026-07-14): Vitest passed 13/13 files and 159/159 tests; Playwright passed 4 unconfigured and 3 configured tests; and the restored default production build transformed 355 modules. Both SPA entry files existed and were byte-identical, the protected resume/data/export/review/resize paths had no branch diff, `git diff --check` passed, and status contained only the five approved Task 6 files.

- [ ] **Step 6: Commit, push, and resume manual QA**

```sh
git add \
  src/styles/app.css \
  e2e/unconfigured.spec.ts \
  docs/SHADCN_MIGRATION.md \
  docs/superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md \
  docs/superpowers/plans/2026-07-13-shadcn-editor-shell-consolidation.md
git commit -m "fix: balance editor side surfaces"
git push
```

Resume manual QA at 1640px and the wider viewport that exposed the mismatch before continuing through the existing checklist. Do not mark manual QA complete until the corrected composition is observed.

Handoff note (2026-07-14): this step remains incomplete because push and corrected visual QA are reserved for the controller/user. The implementation may be committed locally after the automated release gate passes, without claiming either remaining action.
