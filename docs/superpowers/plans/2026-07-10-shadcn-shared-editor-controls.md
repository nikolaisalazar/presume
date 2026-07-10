# shadcn Header and Command Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Presume's first editor-surface migration by rebuilding the header status area and full command deck with shadcn/Base UI primitives while preserving editor behavior and the fixed resume canvas.

**Architecture:** Treat the header and command deck as one coherent surface. Add semantic variants to the local primitives, migrate Fit Constraints to Base UI Collapsible, compose the connected deck from SettingsPanel, Alert, Separator, and Toolbar, then remove the replaced presentation CSS in the same PR. Leave the full ReviewPanel and remaining workspace/stage shell for the next two surface PRs.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind CSS v4, shadcn `base-nova` on Base UI, CVA, Vitest/Testing Library, Playwright.

## Global Constraints

- Presume remains desktop-first. Narrow behavior is graceful degradation, not a mobile redesign.
- Preserve direct editing, resizing, PDF export, JSON import/export, LocalStorage, routing, review behavior, and the fixed 816px resume canvas.
- Do not change `src/styles/resume.css`, resume-document components, data schemas, storage keys, export internals, or review API/state hooks.
- Keep `ReviewPanel` presentation custom in this PR. Only its loading label may change from `Reviewing...` to `Reviewing` for consistency.
- Keep Fit Constraints closed by default and do not persist its open state.
- Use Button for actions and Badge only for passive status.
- Use no icons in the document-action toolbar.
- Do not add PDF import; it is a separate parsing/reconstruction feature.
- Do not add GSAP, visual snapshots, or network-dependent tests.

## Approved Visual Contract

- Export PDF: solid primary teal, no gradient or shadow.
- Export JSON and Import JSON: neutral outline.
- Reset template: neutral at rest, restrained red on hover/focus.
- Editor buttons and saved Badge: 3px corners.
- Keyboard focus: blue outer ring.
- Saved locally: muted filled secondary Badge.
- Review tones: blue normal/loading, green result-ready, amber stale/setup-needed, red request/connection failure.
- Review loading: label `Reviewing` plus a one-pixel feathered bottom sweep with a pause; static under reduced motion.
- Formatting warning: integrated amber strip, polite live region, non-dismissible while unresolved.
- Fit Constraints: compact one-line command strip when closed; three rows when open; 180ms restrained reveal.
- Constraint values: custom plus/minus steppers with bare numbers. Units live in `Page limit`, `Lines per bullet`, and `Minimum font size (px)` labels.
- Narrow toolbar: preserve Export and file-action groups; controls are at least 44px through 560px and 36px from 561px.
- Remove the decorative `Command deck` pseudo-label.

## Test Budget

- Prefer extending existing tests over adding new test cases.
- Add new test cases conservatively, only when they protect a distinct regression or public contract that does not fit clearly into an existing test.
- Do not assert complete Tailwind class strings or implementation trivia.
- Protect public contracts: refs, slots, accessible state, callbacks, exact critical dimensions, overflow containment, and existing behavior.

## File Map

- Create `src/components/ui/alert.tsx`: React 18-safe Alert family with integrated warning variant.
- Create `src/components/ui/collapsible.tsx`: React 18-safe Base UI Collapsible wrappers.
- Modify `src/components/ui/button.tsx`: editor size and semantic action/review variants.
- Modify `src/components/ui/badge.tsx`: status size.
- Modify `src/styles/globals.css`: semantic warning/review tokens and approved keyframes.
- Modify `src/App.tsx`: saved Badge and unified command-deck composition.
- Modify `src/components/ReviewStatusControl.tsx`: semantic Button mapping and loading state.
- Modify `src/components/ReviewPanel.tsx`: loading-label consistency only.
- Modify `src/components/SettingsPanel.tsx`: Collapsible command strip and simplified steppers.
- Modify `src/components/Toolbar.tsx`: shared Buttons with unchanged callbacks.
- Modify `src/components/FormattingWarningSummary.tsx`: Alert composition.
- Modify `src/styles/app.css`: delete replaced header/settings/toolbar/warning/deck presentation; keep shell geometry.
- Modify `src/tests/uiPrimitives.test.tsx`, `src/tests/appIntegration.test.tsx`, `src/tests/reviewUi.test.tsx`, and `e2e/unconfigured.spec.ts`: focused contract updates within the test budget.
- Modify `docs/SHADCN_MIGRATION.md`: completion status and verification evidence.

---

### Task 1: Add the command-deck primitive contracts

**Files:**
- Create: `src/components/ui/alert.tsx`
- Create: `src/components/ui/collapsible.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/styles/globals.css`
- Test: `src/tests/uiPrimitives.test.tsx`

**Interfaces:**
- Produces: Alert family; Collapsible family; `Button size="editor"`; Button variants `review`, `reviewSuccess`, `reviewWarning`, `reviewError`, `dangerOutline`; `Badge size="status"`.
- Preserves: all existing Button, Badge, Card, and Separator APIs plus React 18 ref behavior.

- [ ] **Step 1: Extend the existing primitive ref test before adding components**

Add Alert and Collapsible refs to the existing React 18 contract test rather than creating a separate test:

```tsx
const alertRef = createRef<HTMLDivElement>()
const triggerRef = createRef<HTMLButtonElement>()
const panelRef = createRef<HTMLDivElement>()

render(
  <>
    <Alert ref={alertRef} variant="warningDeck" role="status">
      <AlertTitle>Cannot fit</AlertTitle>
      <AlertDescription>Shorten content.</AlertDescription>
    </Alert>
    <Collapsible defaultOpen>
      <CollapsibleTrigger ref={triggerRef}>Fit constraints</CollapsibleTrigger>
      <CollapsibleContent ref={panelRef}>Controls</CollapsibleContent>
    </Collapsible>
  </>
)

expect(alertRef.current).toBeInstanceOf(HTMLDivElement)
expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement)
expect(panelRef.current).toBeInstanceOf(HTMLDivElement)
```

- [ ] **Step 2: Run the focused test and confirm the missing imports fail**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/uiPrimitives.test.tsx
```

Expected: FAIL because Alert and Collapsible do not exist.

- [ ] **Step 3: Add the upstream components and adapt every wrapper for React 18**

```sh
npx shadcn@latest add alert collapsible --dry-run
npx shadcn@latest add alert collapsible
```

Read both generated files. Convert Alert, AlertTitle, AlertDescription, AlertAction, Collapsible, CollapsibleTrigger, and CollapsibleContent to `React.forwardRef` using their actual DOM element types. Preserve all `data-slot` attributes and caller prop ordering. Remove the generated `"use client"`; this Vite project has `rsc: false`.

- [ ] **Step 4: Add semantic tokens and primitive variants**

In `globals.css`, expose warning, review, and review-success tokens through `@theme inline`. Add the approved values:

```css
--warning-bg: #fff7ed;
--warning-border: #fdba74;
--warning-ink: #9a3412;
--review-bg: #e8f6fb;
--review-border: rgb(14 116 144 / 34%);
--review-ink: #155e75;
--review-hover: #e0f2fe;
--review-success-bg: #ecfdf5;
--review-success-border: #99d5be;
--review-success-ink: #166534;
```

Add `warningDeck` to Alert: amber semantic colors, no outer radius/border, compact typography suitable inside the deck. Keep caller props after the default `role="alert"` so the warning can override it with `role="status"`.

Add these Button contracts:

```tsx
variant: {
  review: "border-review-border bg-review-bg text-review-ink hover:bg-review-hover",
  reviewSuccess: "border-review-success-border bg-review-success-bg text-review-success-ink",
  reviewWarning: "border-warning-border bg-warning-bg text-warning-ink",
  reviewError: "border-destructive/40 bg-destructive/10 text-destructive",
  dangerOutline: "border-border bg-background text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
},
size: {
  editor: "h-11 rounded-[3px] px-3 text-[13px] min-[561px]:h-9",
},
```

Factor the common Review border/hover/focus and loading pseudo-element classes into one local constant before composing variants. The loading pseudo-element activates only under `data-loading` and uses `review-progress-sweep`; other states have no motion.

Add `Badge size="status"` as `h-[34px] rounded-[3px] px-3 text-xs font-bold` without changing the default Badge used on the landing page.

- [ ] **Step 5: Add the approved sweep and reduced-motion fallback**

```css
@keyframes review-progress-sweep {
  0% { transform: translateX(-120%); }
  72%, 100% { transform: translateX(260%); }
}
```

Use a one-pixel, 46%-wide transparent-to-review-ink-to-transparent pseudo-element. Under reduced motion, disable animation and leave a static centered line.

- [ ] **Step 6: Run the focused test and commit**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/uiPrimitives.test.tsx
git add src/components/ui/alert.tsx src/components/ui/collapsible.tsx src/components/ui/button.tsx src/components/ui/badge.tsx src/styles/globals.css src/tests/uiPrimitives.test.tsx
git commit -m "feat: add command deck primitives"
```

Expected: existing primitive test count remains unchanged and all tests pass.

### Task 2: Migrate the editor header status surface

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ReviewStatusControl.tsx`
- Modify: `src/components/ReviewPanel.tsx`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `src/tests/reviewUi.test.tsx`

**Interfaces:**
- Consumes: semantic Button variants and Badge status size from Task 1.
- Produces: `getReviewButtonVariant(state)` and unchanged ReviewStatusControl behavior.

- [ ] **Step 1: Extend existing header and review-state assertions**

In existing tests, add only these public-contract assertions:

```tsx
expect(screen.getByText('Saved locally')).toHaveAttribute('data-slot', 'badge')
expect(screen.getByRole('button', { name: 'Review resume' })).toHaveAttribute('data-slot', 'button')
```

Extend existing loading tests to expect `Reviewing` in both locations and `data-loading` only on ReviewStatusControl. Add a table inside the existing ReviewStatusControl test for the semantic mapping; do not create one test per state.

- [ ] **Step 2: Run focused tests and confirm native markup fails the slot assertions**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
```

- [ ] **Step 3: Migrate passive and interactive status correctly**

In `App.tsx`:

```tsx
<Badge variant="secondary" size="status">Saved locally</Badge>
```

In `ReviewStatusControl.tsx`, export:

```tsx
export function getReviewButtonVariant(state: ResumeReviewState) {
  switch (state.status) {
    case 'success': return 'reviewSuccess' as const
    case 'stale':
    case 'disabled': return 'reviewWarning' as const
    case 'error':
    case 'config_error': return 'reviewError' as const
    default: return 'review' as const
  }
}
```

Render both idle and status controls with Button `size="editor"`. Preserve callbacks, disabled state, `aria-expanded`, `aria-controls`, and titles. For loading, set `data-loading=""` and change the label to `Reviewing`.

Change only ReviewPanel's loading expression to `{isLoading ? 'Reviewing' : 'Review resume'}`.

- [ ] **Step 4: Run focused tests and commit**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
git add src/App.tsx src/components/ReviewStatusControl.tsx src/components/ReviewPanel.tsx src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
git commit -m "refactor: migrate editor status controls"
```

### Task 3: Rebuild Fit Constraints with Collapsible

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `e2e/unconfigured.spec.ts`

**Interfaces:**
- Consumes: Collapsible wrappers and existing SettingsPanel props.
- Produces: the same constraint updates and limits with a local closed-by-default disclosure.

- [ ] **Step 1: Extend the existing SettingsPanel integration and narrow E2E tests**

Do not add a new test. Extend the existing test that opens Fit Constraints to assert:

```tsx
expect(constraints).toHaveAttribute('data-slot', 'collapsible-trigger')
expect(screen.getByText('Page limit')).toBeInTheDocument()
expect(screen.getByText('Lines per bullet')).toBeInTheDocument()
expect(screen.getByText('Minimum font size (px)')).toBeInTheDocument()
expect(screen.getByLabelText('Page limit')).toHaveTextContent('1')
expect(screen.getByLabelText('Page limit')).not.toHaveTextContent('page')
```

Extend the existing 358px Fit Constraints E2E test to use `data-slot="collapsible-content"` and retain its 44px stepper and no-overflow assertions.

- [ ] **Step 2: Run focused tests and confirm the slot/label assertions fail**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx
npx playwright test -c playwright.unconfigured.config.ts -g "expanded fit constraints"
```

- [ ] **Step 3: Replace the custom disclosure with Collapsible**

Keep `const [open, setOpen] = useState(false)`. Compose:

```tsx
<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left">
    <span className="text-[13px] font-bold">Fit constraints</span>
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      {constraints.maxPages} page · {constraints.maxLinesPerBullet} line/bullet · {constraints.minFontSize}px min
      <span aria-hidden="true">{open ? '▴' : '▾'}</span>
    </span>
  </CollapsibleTrigger>
  <CollapsibleContent
    keepMounted
    className="h-[var(--collapsible-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-[180ms] ease-out data-[closed]:h-0 data-[closed]:opacity-0 motion-reduce:transition-none"
  >
    <div className="border-t border-border bg-muted/30 px-4 py-2">
      <ConstraintStepper
        label="Page limit"
        value={constraints.maxPages}
        help="Number of resume pages"
        onDecrease={() => step('maxPages', -1, 1, 10)}
        onIncrease={() => step('maxPages', 1, 1, 10)}
        decreaseLabel="Decrease max pages"
        increaseLabel="Increase max pages"
        decreaseDisabled={constraints.maxPages <= 1}
        increaseDisabled={constraints.maxPages >= 10}
      />
      <ConstraintStepper
        label="Lines per bullet"
        value={constraints.maxLinesPerBullet}
        help="Maximum wrapped lines"
        onDecrease={() => step('maxLinesPerBullet', -1, 1, 10)}
        onIncrease={() => step('maxLinesPerBullet', 1, 1, 10)}
        decreaseLabel="Decrease max lines per bullet"
        increaseLabel="Increase max lines per bullet"
        decreaseDisabled={constraints.maxLinesPerBullet <= 1}
        increaseDisabled={constraints.maxLinesPerBullet >= 10}
      />
      <ConstraintStepper
        label="Minimum font size (px)"
        value={constraints.minFontSize}
        help="Do not shrink below"
        onDecrease={() => step('minFontSize', -1, 4, 16)}
        onIncrease={() => step('minFontSize', 1, 4, 16)}
        decreaseLabel="Decrease minimum font size"
        increaseLabel="Increase minimum font size"
        decreaseDisabled={constraints.minFontSize <= 4}
        increaseDisabled={constraints.minFontSize >= 16}
      />
    </div>
  </CollapsibleContent>
</Collapsible>
```

Keep the three existing min/max bounds and callbacks. Rename row labels to the approved copy. Simplify `ConstraintStepper` so its center cell renders only `<strong>{value}</strong>`; remove the `unit` prop. Keep descriptive `aria-label`s on plus/minus buttons and `aria-live="polite"` on the number.

Use utilities for the three rows and steppers. Stepper buttons are 44px at narrow widths and 36px from 561px. Use 3px only on the two outer corners of the segmented control.

- [ ] **Step 4: Run focused tests and commit**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx
npx playwright test -c playwright.unconfigured.config.ts -g "expanded fit constraints"
git add src/components/SettingsPanel.tsx src/tests/appIntegration.test.tsx e2e/unconfigured.spec.ts
git commit -m "refactor: migrate fit constraints to collapsible"
```

### Task 4: Compose Toolbar and formatting feedback into one command deck

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/FormattingWarningSummary.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

**Interfaces:**
- Consumes: SettingsPanel, Separator, Alert, and Button contracts.
- Produces: one connected command deck with unchanged document-action behavior.

- [ ] **Step 1: Extend existing composition assertions**

In the existing editor-shell integration test, assert the command deck contains four Button slots, one Separator without a warning or two with a warning, and the existing action names. In the existing warning cases, assert one `role="status"` Alert with title/description slots. Update existing responsive CSS assertions to stop requiring selectors that this task deletes.

Do not add a new test case.

- [ ] **Step 2: Run focused tests and confirm the primitive composition assertions fail**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
```

- [ ] **Step 3: Compose the connected deck in App**

Wrap the three surfaces:

```tsx
<div
  data-slot="command-deck"
  className="w-full overflow-hidden rounded-lg border border-border bg-background"
>
  <SettingsPanel constraints={constraints} onChange={setConstraints} />
  <Separator />
  <FormattingWarningSummary
    bulletWarningCount={bulletWarningCount}
    hasGlobalOverflow={hasGlobalOverflowWarning}
    constraints={constraints}
  />
  {bulletWarningCount > 0 || hasGlobalOverflowWarning ? <Separator /> : null}
  <Toolbar
    resume={resume}
    pageRef={pageRef}
    onImport={setResume}
    onReset={() => setResume(DEFAULT_RESUME)}
  />
</div>
```

This is now a genuine use of Separator: it owns the boundaries between complete command-deck regions.

- [ ] **Step 4: Migrate Toolbar without changing handlers**

Use text-only Buttons:

```tsx
<Button size="editor" onClick={handleExportPDF}>Export PDF</Button>
<Button variant="outline" size="editor" onClick={handleExportJSON}>Export JSON</Button>
<Button variant="outline" size="editor" onClick={handleImportClick}>Import JSON</Button>
<Button variant="dangerOutline" size="editor" onClick={handleReset}>Reset template</Button>
```

Preserve the toolbar role, group labels, hidden file input, confirm flows, error alerts, and every handler. At narrow widths keep Export actions together and file actions together; do not convert them into an undifferentiated grid or four-button stack.

- [ ] **Step 5: Migrate the warning to Alert**

```tsx
<Alert variant="warningDeck" role="status" aria-live="polite">
  <AlertTitle>Cannot fit under current constraints</AlertTitle>
  <AlertDescription>
    {hasGlobalOverflow ? (
      <p>
        The resume exceeds {constraints.maxPages}{' '}
        {constraints.maxPages === 1 ? 'page' : 'pages'} even at the{' '}
        {constraints.minFontSize}px minimum. Shorten content or loosen constraints.
      </p>
    ) : null}
    {bulletWarningCount > 0 ? (
      <p>
        {bulletWarningCount}{' '}
        {bulletWarningCount === 1 ? 'bullet exceeds' : 'bullets exceed'}{' '}
        {lineLabel} even at the {constraints.minFontSize}px minimum. Shorten{' '}
        {bulletWarningCount === 1 ? 'it' : 'them'} or loosen constraints.
      </p>
    ) : null}
  </AlertDescription>
</Alert>
```

Use the existing copy expressions verbatim. Keep the early null return. The warning is non-dismissible and never mutates content.

- [ ] **Step 6: Remove replaced CSS, not protected layout**

Delete component presentation for `.toolbar-btn`, `.app-status-pill`, `.review-status-control`, `.settings-panel*`, `.settings-control-row*`, `.settings-stepper*`, and `.formatting-warning-summary*`, plus the `.editor-panel::before` Command deck label. Remove obsolete adjacency selectors now owned by the command-deck wrapper and Separator.

Keep `.app-header`, `.app-header__meta`, `.workspace`, `.editor-panel`, `.resume-stage`, `.resume-canvas-scroll`, `.resume-canvas`, ReviewPanel rules, in-document editor controls, and all print/export-related selectors.

- [ ] **Step 7: Run focused tests and commit**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/export.test.ts
npx playwright test -c playwright.unconfigured.config.ts -g "loads, renders|landing workflow|expanded fit constraints|fixed resume canvas"
git add src/App.tsx src/components/Toolbar.tsx src/components/FormattingWarningSummary.tsx src/styles/app.css src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts e2e/unconfigured.spec.ts
git commit -m "refactor: compose the editor command deck"
```

### Task 5: Verify, visually review, document, and open the PR

**Files:**
- Modify: `docs/SHADCN_MIGRATION.md`

- [ ] **Step 1: Run the complete verification contract**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
npm run test:e2e
npm run build
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --exit-code origin/main...HEAD -- \
  src/styles/resume.css src/types.ts src/storage.ts src/export.ts \
  src/reviewApi.ts src/useResumeReview.ts
git diff --check
rm -rf test-results
git status --short --branch
```

Expected: all existing and deliberately added tests pass; the default build is restored; SPA files are byte-identical; protected files are unchanged.

- [ ] **Step 2: Perform layered manual QA**

Desktop first at 1120px and 960px:

- Resume remains the visual anchor and 816px wide.
- Header status and semantic Review tones match the approved contract.
- Fit Constraints starts closed, reveals smoothly, and all bounds work.
- Toolbar hierarchy, warning integration, focus, import/export/reset, and review navigation work.

Then 561px, 560px, and 358px:

- Controls transition from 36px to at least 44px at the inclusive boundary.
- Action groups remain intact with no document-level overflow.
- Resume overflow stays inside `.resume-canvas-scroll`.

Spot-check landing at 1120px and 358px, configured/unconfigured review states, reduced motion, direct editor navigation, PDF export, JSON import/export, and browser back.

- [ ] **Step 3: Update roadmap with actual evidence**

Mark PR 2 complete only after automated and manual QA pass. Record the PR link, actual test counts, and that PR 3 is ReviewPanel presentation while PR 4 is shell consolidation.

- [ ] **Step 4: Commit documentation, push, and open the PR**

```sh
git add docs/SHADCN_MIGRATION.md
git commit -m "docs: record command deck migration"
git push -u origin feat/shadcn-shared-editor-controls
gh pr create --base main --head feat/shadcn-shared-editor-controls \
  --title "Migrate the editor header and command deck to shadcn" \
  --body-file /tmp/presume-pr2-body.md
```

The PR description must list the approved design decisions, behavior preserved, CSS removed, test count, manual QA status, protected files, and follow-up surface PRs.

## Rollback Strategy

- Primitive, header, Fit Constraints, and command-deck commits are independently revertible.
- Revert a surface commit if its visual migration regresses while retaining the reviewed primitives.
- Reverting the full PR restores the handcrafted header/command deck without data or schema rollback.

## Review Focus

- No interactive Badge; no decorative icons; no PDF import.
- Correct semantic Review tone mapping and C1 loading motion.
- React 18 refs for every new wrapper.
- Collapsible closed by default, non-persisted, bounded steppers, and reduced-motion fallback.
- No duplicate migrated presentation CSS.
- No change to ReviewPanel presentation beyond loading copy.
- No change to fixed-canvas, resume, export, data, or review behavior.
- Test additions remain proportional: existing cases are extended first, and each new case protects a distinct regression or public contract.
