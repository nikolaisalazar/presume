# shadcn Shared Editor Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Presume's shared editor actions, saved/review status chrome, and formatting warning surface to the existing shadcn/Base UI primitives without changing editor behavior or the desktop-first document workbench.

**Architecture:** Extend the already-installed local primitives with narrowly reusable editor variants, add the upstream Base UI `Alert` source with React 18 ref forwarding, and then migrate one editor surface at a time. Keep layout classes on the command deck so Tailwind/shadcn owns component presentation while `app.css` continues to own shell geometry and the connected settings-warning-toolbar composition.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind CSS v4, shadcn `base-nova` on Base UI, CVA, Vitest/Testing Library, Playwright.

## Global Constraints

- Presume remains desktop-first; narrow-screen changes are breakpoint resilience and graceful degradation, not a mobile redesign.
- Preserve the fixed 816px resume canvas, direct editing, resizing, PDF export, JSON import/export, LocalStorage, review state machine, and `/presume/` plus `/presume/editor/` routing.
- Do not change `src/styles/resume.css`, the resume JSON format, persistence keys, export internals, review API/state hooks, or resume-document components.
- Do not migrate `SettingsPanel` or `ReviewPanel` presentation in this PR; those remain PR 3 and PR 4.
- Use `Button` for interactive controls and `Badge` only for non-interactive status text. A control that visually resembles a status chip remains a semantic button.
- Keep 36px toolbar actions on desktop and at least 44px toolbar/review actions through 560px, matching the existing inclusive breakpoint contract.
- Preserve review configured/unconfigured, checking, disabled, config-error, loading, success, stale, and error behavior exactly.
- Preserve `role="status"` and `aria-live="polite"` on formatting warnings; do not replace them with an interruptive `role="alert"`.
- Do not force `Separator` into the editor: the inventory found no genuine divider whose replacement improves the command deck.
- Use semantic tokens and primitive variants for color, typography, and control sizing. Consumer `className` values may retain layout hooks only.
- Do not add visual snapshots or network-dependent tests.

---

## Execution Branch Setup

This plan is committed on the feature branch created from merged PR #23. Before Task 1, confirm the execution context:

```sh
git branch --show-current
git merge-base --is-ancestor origin/main HEAD
git status --short
```

Expected: the branch is `feat/shadcn-shared-editor-controls`, `origin/main` is an ancestor, and the worktree is clean. Do not recreate or rebase the branch unless the user explicitly requests it.

## File Map

- Create `src/components/ui/alert.tsx`: local shadcn Alert family, adapted for React 18 refs and a semantic warning variant.
- Modify `src/components/ui/button.tsx`: add reusable `review` and restrained `dangerOutline` variants plus an `editor` size.
- Modify `src/components/ui/badge.tsx`: add a `status` size without changing existing landing-page defaults.
- Modify `src/styles/globals.css`: expose warning and review semantic colors to Tailwind.
- Modify `src/styles/app.css`: remove semantic warning-token duplicates after moving them to the Tailwind theme source, then progressively remove migrated presentation rules.
- Modify `src/components/Toolbar.tsx`: replace four native action buttons with `Button`.
- Modify `src/components/ReviewStatusControl.tsx`: replace native interactive status controls with `Button`.
- Modify `src/App.tsx`: replace the saved-status span with `Badge`.
- Modify `src/components/FormattingWarningSummary.tsx`: compose `Alert`, `AlertTitle`, and `AlertDescription`.
- Modify `src/tests/uiPrimitives.test.tsx`: lock primitive slots, variants, and React 18 ref contracts.
- Modify `src/tests/appIntegration.test.tsx`: lock migrated editor composition and preserve action behavior.
- Modify `src/tests/reviewUi.test.tsx`: lock review-control composition and state semantics.
- Modify `e2e/unconfigured.spec.ts`: verify desktop/narrow control sizing, overflow containment, and document actions.
- Modify `docs/SHADCN_MIGRATION.md`: mark PR 2 complete only after verification and link the eventual PR.

### Task 1: Add semantic editor primitive contracts

**Files:**
- Create: `src/components/ui/alert.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/styles/app.css`
- Test: `src/tests/uiPrimitives.test.tsx`

**Interfaces:**
- Consumes: existing `ButtonProps`, `BadgeProps`, `cn()`, Base UI, CVA, and semantic CSS variables.
- Produces: `Button variant="review" | "dangerOutline"`, `Button size="editor"`, `Badge size="status"`, and `Alert`, `AlertTitle`, `AlertDescription`, `AlertAction` with React 18-compatible refs.

- [ ] **Step 1: Add failing primitive contract tests**

Extend `src/tests/uiPrimitives.test.tsx` to render the new variants and Alert family. Assert the stable public contract rather than full class snapshots:

```tsx
const alertRef = createRef<HTMLDivElement>()
const alertTitleRef = createRef<HTMLDivElement>()
const alertDescriptionRef = createRef<HTMLDivElement>()

const { container } = render(
  <>
    <Button variant="review" size="editor">View review</Button>
    <Button variant="dangerOutline" size="editor">Reset template</Button>
    <Badge variant="outline" size="status">Saved locally</Badge>
    <Alert ref={alertRef} variant="warning" role="status">
      <AlertTitle ref={alertTitleRef}>Cannot fit</AlertTitle>
      <AlertDescription ref={alertDescriptionRef}>Shorten content.</AlertDescription>
    </Alert>
  </>
)

expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(2)
expect(container.querySelector('[data-slot="badge"]')).toHaveTextContent('Saved locally')
expect(container.querySelector('[data-slot="alert"]')).toHaveAttribute('role', 'status')
expect(container.querySelector('[data-slot="alert-title"]')).toHaveTextContent('Cannot fit')
expect(container.querySelector('[data-slot="alert-description"]')).toHaveTextContent('Shorten content.')
expect(alertRef.current).toBeInstanceOf(HTMLDivElement)
expect(alertTitleRef.current).toBeInstanceOf(HTMLDivElement)
expect(alertDescriptionRef.current).toBeInstanceOf(HTMLDivElement)
```

- [ ] **Step 2: Run the focused test and confirm the missing contracts fail**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/uiPrimitives.test.tsx
```

Expected: FAIL because Alert is not installed and the editor variants/sizes do not exist.

- [ ] **Step 3: Add Alert from the configured registry and inspect it before adapting**

Run:

```sh
npx shadcn@latest add alert --dry-run
npx shadcn@latest add alert
```

Read the generated file. Preserve its Base UI-compatible slots and CVA structure, then convert `Alert`, `AlertTitle`, `AlertDescription`, and `AlertAction` to `React.forwardRef` wrappers. This is required because the project remains on React 18; accepting a `ref` in component props is not sufficient.

Add `warning` to `alertVariants` using semantic utilities:

```tsx
warning:
  "border-warning-border bg-warning-bg text-warning-ink *:data-[slot=alert-description]:text-warning-ink",
```

Keep the default `role="alert"` supplied by shadcn, but ensure caller props are spread after it so `FormattingWarningSummary` can override it with `role="status"`.

- [ ] **Step 4: Add semantic Tailwind mappings and component variants**

In `src/styles/globals.css`, add these `@theme inline` mappings:

```css
--color-warning-bg: var(--warning-bg);
--color-warning-border: var(--warning-border);
--color-warning-ink: var(--warning-ink);
--color-review-bg: var(--review-bg);
--color-review-border: var(--review-border);
--color-review-ink: var(--review-ink);
--color-review-hover: var(--review-hover);
```

Add the corresponding `:root` values, preserving the existing editor appearance:

```css
--warning-bg: #fff7ed;
--warning-border: #fdba74;
--warning-ink: #9a3412;
--review-bg: #e8f6fb;
--review-border: rgb(14 116 144 / 34%);
--review-ink: #155e75;
--review-hover: #e0f2fe;
```

Remove `--warning-bg`, `--warning-border`, and `--warning-ink` from the later `:root` block in `app.css` so `globals.css` is their single source of truth. Keep `--danger`, `--review`, and `--focus` because untouched legacy editor/review selectors still consume them.

Add these variants to `buttonVariants`:

```tsx
review:
  "border-review-border bg-review-bg text-review-ink hover:bg-review-hover aria-expanded:bg-review-hover",
dangerOutline:
  "border-border bg-background text-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
```

Add an `editor` size that makes the inclusive narrow contract deterministic with a narrow base and a desktop enhancement:

```tsx
editor: "h-11 gap-1.5 px-3 text-[13px] min-[561px]:h-9",
```

Refactor `badgeVariants` to include a `size` axis while leaving `size="default"` visually identical to the current Badge. Add:

```tsx
status: "h-[34px] px-3 text-xs font-bold",
```

Update `BadgeProps`, the component defaults, and the CVA call so `size="status"` is typed and applied. Do not change existing landing Badge output.

- [ ] **Step 5: Run primitive and landing regression tests**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/uiPrimitives.test.tsx src/tests/appIntegration.test.tsx
```

Expected: PASS; the existing landing primitive counts and React 18 ref tests remain green.

- [ ] **Step 6: Commit the primitive foundation**

```sh
git add src/components/ui/alert.tsx src/components/ui/button.tsx src/components/ui/badge.tsx src/styles/globals.css src/styles/app.css src/tests/uiPrimitives.test.tsx
git commit -m "feat: add shared editor primitive variants"
```

### Task 2: Migrate toolbar actions and editor status chrome

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/ReviewStatusControl.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Test: `src/tests/appIntegration.test.tsx`
- Test: `src/tests/reviewUi.test.tsx`

**Interfaces:**
- Consumes: `Button` editor size and variants plus `Badge size="status"` from Task 1.
- Produces: unchanged Toolbar and ReviewStatusControl props/behavior implemented with shared primitives; non-interactive saved status implemented with Badge.

- [ ] **Step 1: Add failing composition assertions**

In the editor integration test, assert that the four toolbar actions, saved status, and configured review control use the intended slots without changing accessible names:

```tsx
const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })
expect(toolbar.querySelectorAll('[data-slot="button"]')).toHaveLength(4)
expect(screen.getByText('Saved locally')).toHaveAttribute('data-slot', 'badge')
expect(screen.getByRole('button', { name: 'Export PDF' })).toHaveAttribute('data-slot', 'button')
expect(screen.getByRole('button', { name: 'Reset template' })).toHaveAttribute('data-slot', 'button')
```

In `src/tests/reviewUi.test.tsx`, extend the idle and toggleable-state tests:

```tsx
expect(screen.getByRole('button', { name: 'Review resume' })).toHaveAttribute(
  'data-slot',
  'button'
)
```

Retain all existing assertions for `disabled`, `aria-expanded`, `aria-controls`, titles, panel visibility, and callbacks.

- [ ] **Step 2: Run focused tests and confirm native controls fail the slot assertions**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
```

Expected: FAIL because the editor still renders native toolbar/review buttons and a plain saved-status span.

- [ ] **Step 3: Migrate Toolbar without changing its event flow**

Import `Button` from `@/components/ui/button` and replace only the four native `<button>` elements:

```tsx
<Button size="editor" onClick={handleExportPDF} aria-label="Export PDF">
  Export PDF
</Button>
<Button variant="outline" size="editor" onClick={handleExportJSON} aria-label="Export JSON">
  Export JSON
</Button>
<Button variant="outline" size="editor" onClick={handleImportClick} aria-label="Import JSON">
  Import JSON
</Button>
<Button variant="dangerOutline" size="editor" onClick={handleReset}>
  Reset template
</Button>
```

Do not alter `handleExportPDF`, `handleExportJSON`, file-input activation/reset, confirmation dialogs, error alerts, `accept`, or the hidden input ref.

- [ ] **Step 4: Migrate status chrome with correct semantics**

In `src/App.tsx`, replace the saved span with:

```tsx
<Badge variant="outline" size="status">Saved locally</Badge>
```

In `ReviewStatusControl.tsx`, replace both native buttons with `Button variant="review" size="editor"`. Keep every conditional, label, disabled state, click handler, `aria-expanded`, `aria-controls`, and `title` unchanged. Do not render the interactive review control through Badge.

- [ ] **Step 5: Remove only superseded button/status presentation CSS**

Delete rules whose complete responsibility moved to primitives:

- `.toolbar-btn` base/hover/primary/danger/active/focus rules and their duplicate premium-pass declarations.
- `.app-status-pill` presentation rules.
- `.review-status-control` presentation/hover/disabled/active/focus rules.
- The `.toolbar-btn` and `.review-status-control` entries in narrow and reduced-motion selector lists.

Retain `.toolbar`, `.toolbar__group`, `.toolbar__group-label`, `.app-header__meta`, all connected-deck adjacency/radius rules, and unrelated focus/reduced-motion selectors. Do not rename these layout classes in this PR.

- [ ] **Step 6: Run focused behavior tests**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx src/tests/export.test.ts
```

Expected: PASS. Export/import/reset and all review-state behavior remain unchanged.

- [ ] **Step 7: Commit the control migration**

```sh
git add src/App.tsx src/components/Toolbar.tsx src/components/ReviewStatusControl.tsx src/styles/app.css src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
git commit -m "refactor: migrate shared editor controls"
```

### Task 3: Migrate formatting warnings to Alert

**Files:**
- Modify: `src/components/FormattingWarningSummary.tsx`
- Modify: `src/styles/app.css`
- Test: `src/tests/appIntegration.test.tsx`

**Interfaces:**
- Consumes: React 18-safe `Alert`, `AlertTitle`, and `AlertDescription` with `variant="warning"` from Task 1.
- Produces: the same warning copy and polite live-region behavior composed from shadcn slots.

- [ ] **Step 1: Add failing Alert composition assertions to all warning cases**

For the single-bullet warning case, add:

```tsx
const warning = screen.getByRole('status')
expect(warning).toHaveAttribute('data-slot', 'alert')
expect(warning).toHaveAttribute('aria-live', 'polite')
expect(warning.querySelector('[data-slot="alert-title"]')).toHaveTextContent(
  'Cannot fit under current constraints'
)
expect(warning.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
  '1 bullet exceeds 1 line per bullet even at the 8px minimum.'
)
```

Keep the current copy assertions for global-only and mixed warnings, and add `expect(screen.getAllByRole('status')).toHaveLength(1)` to ensure mixed warnings remain one live region.

- [ ] **Step 2: Run focused tests and confirm the slot assertions fail**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx
```

Expected: FAIL because the warning uses custom markup without Alert slots.

- [ ] **Step 3: Compose the warning from Alert primitives**

Replace the outer custom markup with:

```tsx
<Alert
  className="formatting-warning-summary"
  variant="warning"
  role="status"
  aria-live="polite"
>
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

Keep the early `null` return and pluralization logic unchanged.

- [ ] **Step 4: Reduce warning CSS to layout and deck adjacency**

Keep `.formatting-warning-summary` only where it controls command-deck geometry: width/max-width, connected border radius, adjacency, max-width grouping, and transition behavior. Remove warning color, border, padding, shadow, title typography, and paragraph spacing rules now owned by `Alert` and `AlertDescription`.

If the generated Alert's paragraph selector needs compact spacing, put that spacing in the Alert component's `warning` variant or shared AlertDescription source—not in the consumer class.

- [ ] **Step 5: Run integration and responsive CSS tests**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
```

Expected: PASS. The warning remains between SettingsPanel and Toolbar and the command-deck CSS contract remains intact.

- [ ] **Step 6: Commit the warning migration**

```sh
git add src/components/FormattingWarningSummary.tsx src/styles/app.css src/tests/appIntegration.test.tsx
git commit -m "refactor: compose formatting warnings with alert"
```

### Task 4: Add responsive browser coverage and verify the PR

**Files:**
- Modify: `e2e/unconfigured.spec.ts`
- Modify: `docs/SHADCN_MIGRATION.md`

**Interfaces:**
- Consumes: migrated editor primitives and existing unconfigured Playwright configuration.
- Produces: browser-level regression coverage, completed roadmap status, and release evidence for PR review.

- [ ] **Step 1: Add exact desktop and narrow editor control assertions**

Extend the existing fixed-canvas narrow-width E2E test or add one editor-control test that uses the production app only. At 960px assert:

```ts
await page.setViewportSize({ width: 960, height: 900 })
await expect(page.getByRole('button', { name: 'Export PDF' })).toHaveCSS('height', '36px')
await expect(page.getByText('Saved locally')).toBeVisible()
await expect(page.getByRole('toolbar', { name: 'Document actions' })).toBeVisible()
```

At 358px assert:

```ts
await page.setViewportSize({ width: 358, height: 900 })
for (const name of ['Export PDF', 'Export JSON', 'Import JSON', 'Reset template']) {
  const box = await page.getByRole('button', { name }).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(44)
}
await expect(page.locator('.resume-page')).toHaveCSS('width', '816px')
expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(358)
```

Keep existing PDF download, JSON behavior, review-state, and canvas-scroller assertions. Do not add screenshots.

- [ ] **Step 2: Run the focused browser test**

```sh
npx playwright test -c playwright.unconfigured.config.ts -g "fixed resume canvas|editor controls"
```

Expected: PASS with the exact name selected in the final test.

- [ ] **Step 3: Run the full verification contract**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
npm run test:e2e
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
  src/useResumeReview.ts
git diff --check
rm -rf test-results
git status --short --branch
```

Expected: all unit and E2E tests pass; the default production build is restored after configured E2E; SPA files are byte-identical; protected files are unchanged; only intended source, test, and documentation changes remain.

- [ ] **Step 4: Perform desktop-first manual QA**

Check `/presume/editor/` at 1120px and 960px first:

- The resume remains the visual anchor and 816px wide.
- Toolbar density and the connected command-deck composition remain intact.
- Export PDF is clearly primary; reset is restrained until hover/focus.
- Saved status is non-interactive; review status remains operable and exposes correct expanded/disabled state.
- Keyboard focus indicators are visible and reduced-motion behavior remains quiet.

Then check 560px, 561px, and 358px:

- Toolbar/review actions are at least 44px through 560px and return to 36px at 561px.
- Controls wrap without clipping or page-level horizontal overflow.
- The 816px resume still scrolls only inside `.resume-canvas-scroll`.

Spot-check `/presume/` at 1120px and 358px to ensure primitive changes did not alter landing buttons or Badge styling.

- [ ] **Step 5: Update the roadmap with actual results**

In `docs/SHADCN_MIGRATION.md`, mark PR 2 complete only after automated and manual checks pass. Add the PR number/link and actual test counts. Leave PR 3 and PR 4 unchanged.

- [ ] **Step 6: Commit tests and documentation**

```sh
git add e2e/unconfigured.spec.ts docs/SHADCN_MIGRATION.md
git commit -m "test: cover shared editor primitive migration"
```

- [ ] **Step 7: Push and open the focused PR**

```sh
git push -u origin feat/shadcn-shared-editor-controls
gh pr create \
  --base main \
  --head feat/shadcn-shared-editor-controls \
  --title "Migrate shared editor controls to shadcn" \
  --body-file /tmp/presume-pr2-body.md
```

The PR description must summarize the primitive additions, semantic distinctions between Button and Badge, preserved behavior, CSS removed, exact verification results, manual QA status, and the deliberate decision not to force Separator into the command deck.

## Rollback Strategy

- Each task is independently revertible: primitive additions, control migration, warning migration, and browser/docs coverage are separate commits.
- If a surface regresses visually, revert that surface commit while retaining the reviewed primitive foundation for repair.
- Reverting the entire PR restores the existing handcrafted editor presentation without affecting data, storage, export, review, or resume-document behavior.

## Review Focus

- React 18 ref behavior for every new Alert wrapper.
- No Badge used as an interactive control.
- No changed toolbar/import/export/reset or review-state behavior.
- Exact 560/561px control-height transition and no document-level overflow.
- No `src/styles/resume.css` or protected behavior-file changes.
- No duplicate component presentation left in `app.css` after a surface migrates.
- Landing primitives retain their PR #23 appearance and behavior.
