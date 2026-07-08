# Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the editor redesign from `docs/EDITOR_REDESIGN_SPEC.md`: a restrained, premium inline document editor where the resume page is primary and editor chrome is supportive.

**Architecture:** Keep the current React component structure and public data contracts. Add focused shell/review/warning/control components only where they clarify responsibilities, with most visual change in `src/styles/app.css` and `src/styles/resume.css`. Preserve Pretext resizing, PDF export behavior, `/presume/`, LocalStorage, JSON import/export, and advisory/non-mutating review behavior.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Playwright, CSS custom properties, existing `contenteditable` editor components, existing `useResizeEngine`, existing `useResumeReview`. shadcn/ui is available through the `/shadcn` skill but this repository is not currently initialized with `components.json`, so shadcn adoption is an explicit planning decision, not an assumed dependency.

## Global Constraints

- Do not change the public `Resume` JSON format.
- Do not add stable IDs, schema versioning, JSON migration, or reorder UI.
- Do not change backend/provider/auth/database/queue behavior.
- Do not make review UX the main product focus.
- Do not add network-dependent tests.
- Do not change PDF export behavior.
- Do not remove direct inline editing.
- Do not remove Pretext/global resizing.
- Do not change `/presume/` routing.
- Do not change LocalStorage persistence behavior.
- Do not change JSON import/export semantics.
- Review feedback must remain advisory and non-mutating.
- Keep the fixed-width printable resume canvas and allow horizontal scrolling only inside `.resume-canvas-scroll` on narrow screens.
- Use constraints/status strip above document actions toolbar above resume canvas.
- Use summary plus inline marker for formatting warnings.
- Use a compact review status/action affordance in the shell and render the full review panel only when useful/open.
- Editor controls are non-printing editor chrome outside resume text flow.
- Hover must not be the only discovery or activation path.
- Use visible focus rings, accessible labels, semantic buttons, and reduced-motion-safe transitions.
- Do not initialize shadcn/ui or add shadcn components unless the implementation owner deliberately accepts the dependency/configuration change first.
- If shadcn is adopted, use it for app chrome primitives only, such as Button, Alert, Badge, Collapsible, Sheet/Drawer, or Tooltip; do not use it to turn the resume document into a form builder.

---

## shadcn/ui Decision Point

This project currently has no `components.json` and no installed shadcn component tree. The redesign can be implemented cleanly with existing React components and CSS. However, shadcn may be useful if the team wants standardized primitives for buttons, alerts, badges, collapsible settings, or review panel disclosure.

Before executing implementation, choose one path:

### Path A: No shadcn initialization for this redesign, recommended default

- Keep all UI primitives local to existing components.
- Use CSS custom properties in `src/styles/app.css` and `src/styles/resume.css`.
- Avoid Tailwind/shadcn setup churn.
- Best fit if the goal is focused polish with minimal architecture change.

### Path B: Initialize shadcn before implementation, optional

- Use the `/shadcn` skill before executing Task 1.
- Run project-aware shadcn context commands first.
- Add only the minimal primitives needed for editor chrome.
- Recommended initial component candidates: `button`, `alert`, `badge`, `collapsible`, and possibly `sheet` or `drawer` for the review panel on narrow screens.
- Do not add broad blocks, dashboards, cards everywhere, or form-builder patterns.
- After adding shadcn files, read generated files and update this plan's file list/import paths before coding.

Unless the user explicitly chooses Path B, execute Path A.

## File Structure And Responsibilities

### New files

- `src/components/ReviewStatusControl.tsx`
  - Compact shell affordance for review status/action.
  - Decides button text and disabled state from `ResumeReviewState`.
  - Calls `onRequestReview` or `onTogglePanel` based on review state.
  - If shadcn Path B is selected, this may compose shadcn `Button`/`Badge`; otherwise use semantic native buttons.

- `src/components/FormattingWarningSummary.tsx`
  - Renders fitting warning summary near the constraints strip.
  - Consumes `Warnings`, `Constraints`, and resume bullet count context supplied by `App`.
  - If shadcn Path B is selected, this may compose shadcn `Alert`; otherwise use semantic local markup.

### Modified files

- `src/App.tsx`
  - Owns whether the full review panel is open.
  - Places compact review affordance in header.
  - Renders active/useful `ReviewPanel` only when appropriate.
  - Keeps order: settings/constraints strip, toolbar, resume canvas.
  - Passes warning summary into `SettingsPanel` or renders it directly below the strip.

- `src/components/SettingsPanel.tsx`
  - Becomes a fit constraints/status strip.
  - Adds helper text to expanded controls.
  - Accepts optional `warningSummary?: React.ReactNode` if implemented inside the panel.

- `src/components/Toolbar.tsx`
  - Uses explicit labels: `Export PDF`, `Export JSON`, `Import JSON`, `Reset template`.
  - Keeps `Export PDF` primary.

- `src/components/ReviewPanel.tsx`
  - Remains the full panel for active/useful states.
  - Adds optional `onClose?: () => void` and close button for opened panel.
  - Does not own unconfigured full-rail visibility decisions; `App` does.

- `src/components/ResumeHeader.tsx`
  - Moves contact add/remove into contextual non-printing controls outside centered text flow.

- `src/components/ResumePage.tsx`
  - Uses a consistent document-level add section control.
  - Marks all editor chrome with `data-editor-only="true"`.

- `src/components/Section.tsx`
  - Uses section-level contextual rails/action pills.
  - Keeps remove section outside title/underline flow.

- `src/components/Entry.tsx`
  - Uses entry-level contextual action group for add bullet/remove entry.

- `src/components/Bullet.tsx`
  - Keeps bullet delete in gutter and outside inline text flow.

- `src/components/EditableText.tsx`
  - Only modify if needed for focus styling attributes. Do not change editing behavior.

- `src/styles/app.css`
  - Adds visual tokens, polished shell, toolbar/settings/review styling, responsive contracts, focus rings, reduced motion, touch target rules.

- `src/styles/resume.css`
  - Adds contextual editor rail/control positioning, resume focus treatment, warning/review distinction, print hiding.

- `src/export.ts`
  - Only modify if new editor-only selectors are not already covered. Current hiding covers `.add-btn`, `.remove-btn`, and `[data-editor-only="true"]`; prefer using those selectors instead of changing export.

### Tests to modify

- `src/tests/appIntegration.test.tsx`
  - Update expectations for compact review affordance and no unconfigured full rail.
  - Add tests for shell hierarchy, constraint copy, toolbar labels.

- `src/tests/reviewUi.test.tsx`
  - Keep `ReviewPanel` unit tests for full panel states.
  - Add `ReviewStatusControl` unit tests or integrate in app tests.

- `src/tests/responsiveLayout.test.ts`
  - Update CSS contract tests for tokens, review rail behavior, contextual controls, touch/focus requirements, print hiding.

- `src/tests/export.test.ts`
  - Ensure new editor chrome is hidden/restored during capture if new selectors are added.

- `e2e/unconfigured.spec.ts`
  - Update to assert no full review rail when review unconfigured and editing/export remain available.

- `e2e/configured-review.spec.ts`
  - Update to open/use full review panel through compact review affordance when needed.

---

## Task 0: Confirm shadcn Adoption Path

**Files:**
- Modify: none for Path A.
- If Path B is chosen, files are determined by `/shadcn` initialization and must be recorded before Task 1.

**Interfaces:**
- Produces: explicit decision to execute Path A or Path B from the shadcn decision point.

- [ ] **Step 1: Check whether shadcn is already configured**

Run:

```bash
ls components.json 2>/dev/null || true
find src -maxdepth 3 -path '*components/ui*' -type f 2>/dev/null | head
```

Expected in current repository: no output, confirming shadcn is not currently configured.

- [ ] **Step 2: Choose implementation path**

If the user wants minimal architecture churn, record:

```txt
Decision: Path A, no shadcn initialization for this redesign.
```

If the user wants shadcn primitives, invoke the `/shadcn` skill before Task 1 and record:

```txt
Decision: Path B, initialize shadcn and add only minimal editor chrome primitives.
```

- [ ] **Step 3: For Path B only, refresh this plan before implementation**

If Path B is selected, update this plan after shadcn initialization with:

- exact generated files,
- exact import aliases,
- exact components added,
- any Tailwind/CSS setup files,
- revised task code snippets using those components.

Do not proceed with stale import paths or guessed shadcn APIs.

- [ ] **Step 4: Commit only if Path B changes files**

For Path A, no commit is needed.

For Path B, commit generated config/components separately:

```bash
git add components.json src/components/ui package.json package-lock.json tailwind.config.* src/styles/*
git commit -m "chore: initialize shadcn ui primitives"
```

Adjust the `git add` paths to the actual files generated by `/shadcn`.

---

## Task 1: Shell Tokens, Header, Toolbar, And Layout Polish

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/styles/app.css`
- Test: `src/tests/appIntegration.test.tsx`
- Test: `src/tests/responsiveLayout.test.ts`

**Interfaces:**
- Consumes: existing `ToolbarProps`, existing `App` state, and Task 0 Path A unless explicitly revised for shadcn Path B.
- Produces: stable shell hierarchy with `.app-header__meta`, `.workspace`, `.editor-panel`, `.toolbar-btn--primary`, `.toolbar-btn--danger`, and unchanged toolbar callbacks.

- [ ] **Step 1: Update the failing app shell test**

In `src/tests/appIntegration.test.tsx`, update the polished shell test to expect the new promise copy and full toolbar labels. Replace the existing `renders a polished editor shell...` test body with:

```tsx
it('renders a premium document-editor shell with constraints before document actions', () => {
  vi.stubEnv('VITE_REVIEW_API_URL', '')

  render(<App />)

  expect(screen.getByRole('banner')).toHaveTextContent('Presume')
  expect(
    screen.getByText('Edit the final resume directly. Presume keeps it fitting.')
  ).toBeInTheDocument()
  expect(screen.getByText('Saved locally')).toBeInTheDocument()

  const constraints = screen.getByRole('button', {
    name: /Fit constraints.*1 page.*1 line per bullet.*8px minimum/i,
  })
  const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })
  expect(constraints.compareDocumentPosition(toolbar)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  )

  expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Import JSON' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the app shell test and verify it fails**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx -t "premium document-editor shell"
```

Expected: FAIL because the current header still says `Editable resume workspace`, the settings accessible name says `Constraints`, and toolbar visible labels are `PDF`, `JSON`, `Import`, `Reset to Template`.

- [ ] **Step 3: Update `App.tsx` header copy and status class**

In `src/App.tsx`, replace the header block with:

```tsx
<header className="app-header">
  <div className="app-header__brand">
    <h1>Presume</h1>
    <p>Edit the final resume directly. Presume keeps it fitting.</p>
  </div>
  <div className="app-header__meta" aria-label="Editor status">
    <span className="app-status-pill">Saved locally</span>
  </div>
</header>
```

Do not change the rest of `App.tsx` in this task.

- [ ] **Step 4: Update toolbar labels while preserving behavior**

In `src/components/Toolbar.tsx`, change button children only:

```tsx
<button
  className="toolbar-btn toolbar-btn--primary"
  onClick={handleExportPDF}
  aria-label="Export PDF"
>
  Export PDF
</button>
<button
  className="toolbar-btn"
  onClick={handleExportJSON}
  aria-label="Export JSON"
>
  Export JSON
</button>
```

And:

```tsx
<button
  className="toolbar-btn"
  onClick={handleImportClick}
  aria-label="Import JSON"
>
  Import JSON
</button>
<button className="toolbar-btn toolbar-btn--danger" onClick={handleReset}>
  Reset template
</button>
```

Keep all handlers unchanged.

- [ ] **Step 5: Update CSS tokens and shell styling**

At the top of `src/styles/app.css`, after the box sizing block, add app tokens:

```css
:root {
  --app-bg: #eef2f6;
  --surface: #ffffff;
  --surface-subtle: #f8fafc;
  --border: #d8dee8;
  --border-strong: #c3ccd8;
  --ink: #111827;
  --muted: #64748b;
  --accent: #0f766e;
  --accent-strong: #115e59;
  --warning-bg: #fff7ed;
  --warning-border: #fdba74;
  --warning-ink: #9a3412;
  --danger: #dc2626;
  --review: #0284c7;
  --focus: #2563eb;
  --radius-md: 10px;
  --radius-sm: 8px;
  --shadow-panel: 0 1px 3px rgba(15, 23, 42, 0.06), 0 12px 30px rgba(15, 23, 42, 0.06);
  --shadow-page: 0 18px 50px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.1);
}
```

Then replace hard-coded app shell colors with these tokens. Minimum required replacements:

```css
body {
  margin: 0;
  background: var(--app-bg);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 20px 56px;
  gap: 16px;
  min-height: 100vh;
  --editor-control-resting-opacity: 0.34;
}

.app-header__brand h1,
.app-header__brand p {
  margin: 0;
}

.app-header__brand h1 {
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.app-header__brand p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.app-header__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.app-status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: #475569;
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, var(--page-width)) minmax(320px, 360px);
  align-items: start;
  gap: 22px;
  width: min(1198px, 100%);
  min-width: 0;
}

.toolbar,
.settings-panel,
.review-panel {
  border-color: var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-panel);
}
```

Do not introduce decorative gradients or glassmorphism. If Path B uses shadcn, map this visual treatment to semantic theme tokens instead of raw local classes, and update this step before implementation with exact component APIs from `/shadcn` docs.

- [ ] **Step 6: Update toolbar CSS for stronger hierarchy**

In `src/styles/app.css`, ensure these button rules exist or replace existing equivalents:

```css
.toolbar-btn {
  min-height: 32px;
  padding: 7px 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: #1f2937;
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.2;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.toolbar-btn:hover {
  background: var(--surface-subtle);
  border-color: #94a3b8;
}

.toolbar-btn:focus-visible,
.settings-panel__toggle:focus-visible,
.add-btn:focus-visible,
.remove-btn:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.toolbar-btn--primary {
  border-color: var(--accent);
  background: var(--accent);
  color: #ffffff;
}

.toolbar-btn--primary:hover {
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.toolbar-btn--danger:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: var(--danger);
}
```

- [ ] **Step 7: Add reduced motion fallback**

At the end of `src/styles/app.css`, add:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 8: Run the focused tests**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
```

Expected: PASS or only failures caused by tests that still expect old exact copy. If old-copy failures remain, update only those assertions to the new labels from this task.

- [ ] **Step 9: Commit Task 1**

```bash
git add src/App.tsx src/components/Toolbar.tsx src/styles/app.css src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
git commit -m "polish editor shell and document toolbar"
```

---

## Task 2: Constraints Strip Helper Copy And Formatting Warning Summary

**Files:**
- Create: `src/components/FormattingWarningSummary.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/styles/resume.css`
- Test: `src/tests/appIntegration.test.tsx`

**Interfaces:**
- Consumes: `Warnings` from `useResizeEngine`, `Constraints` from `types.ts`.
- Produces: `FormattingWarningSummary({ warningCount, constraints })` React component.

- [ ] **Step 1: Add failing warning summary test**

In `src/tests/appIntegration.test.tsx`, change the `useResizeEngine` mock to allow per-test warnings. Replace the current mock block:

```tsx
vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => new Map(),
}))
```

with:

```tsx
const resizeWarningsMock = vi.hoisted(() => ({
  warnings: new Map<string, boolean>(),
}))

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => resizeWarningsMock.warnings,
}))
```

In `afterEach`, add:

```tsx
resizeWarningsMock.warnings = new Map()
```

Then add this test:

```tsx
it('explains impossible fitting warnings near the constraints strip', () => {
  vi.stubEnv('VITE_REVIEW_API_URL', '')
  resizeWarningsMock.warnings = new Map([['bullet-0-0-0', true]])

  render(<App />)

  expect(screen.getByText('Cannot fit under current constraints')).toBeInTheDocument()
  expect(
    screen.getByText('1 bullet exceeds 1 line per bullet even at the 8px minimum. Shorten it or loosen constraints.')
  ).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the warning test and verify it fails**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx -t "impossible fitting warnings"
```

Expected: FAIL because no warning summary component exists.

- [ ] **Step 3: Create `FormattingWarningSummary.tsx`**

Create `src/components/FormattingWarningSummary.tsx`:

```tsx
import type { Constraints } from '../types'

interface FormattingWarningSummaryProps {
  warningCount: number
  constraints: Constraints
}

export function FormattingWarningSummary({
  warningCount,
  constraints,
}: FormattingWarningSummaryProps) {
  if (warningCount === 0) return null

  const bulletLabel = warningCount === 1 ? 'bullet exceeds' : 'bullets exceed'
  const lineLabel =
    constraints.maxLinesPerBullet === 1
      ? '1 line per bullet'
      : `${constraints.maxLinesPerBullet} lines per bullet`

  return (
    <div className="formatting-warning-summary" role="status" aria-live="polite">
      <strong>Cannot fit under current constraints</strong>
      <p>
        {warningCount} {bulletLabel} {lineLabel} even at the{' '}
        {constraints.minFontSize}px minimum. Shorten it or loosen constraints.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Render the warning summary directly below the constraints strip**

In `src/App.tsx`, import the component:

```tsx
import { FormattingWarningSummary } from './components/FormattingWarningSummary'
```

Inside `App`, after `warnings` is defined, add:

```tsx
const formattingWarningCount = Array.from(warnings.values()).filter(Boolean).length
```

In the editor panel, immediately after `SettingsPanel`, add:

```tsx
<FormattingWarningSummary
  warningCount={formattingWarningCount}
  constraints={constraints}
/>
```

The order must remain `SettingsPanel`, `FormattingWarningSummary`, `Toolbar`, resume canvas.

- [ ] **Step 5: Add helper copy to expanded settings**

In `src/components/SettingsPanel.tsx`, under each input add helper text:

```tsx
<p className="settings-field__help">PDF exports one Letter page per page-height segment.</p>
```

```tsx
<p className="settings-field__help">Bullets that cannot fit are marked.</p>
```

```tsx
<p className="settings-field__help">Presume will not shrink text below this size.</p>
```

Also change collapsed labels to accessible copy matching the test:

```tsx
<span>{constraints.maxPages} {constraints.maxPages === 1 ? 'page' : 'pages'}</span>
<span>
  {constraints.maxLinesPerBullet}{' '}
  {constraints.maxLinesPerBullet === 1 ? 'line per bullet' : 'lines per bullet'}
</span>
<span>{constraints.minFontSize}px minimum</span>
```

- [ ] **Step 6: Style warning summary and helper copy**

In `src/styles/app.css`, add:

```css
.formatting-warning-summary {
  width: 100%;
  max-width: var(--page-width);
  padding: 10px 12px;
  border: 1px solid var(--warning-border);
  border-radius: var(--radius-md);
  background: var(--warning-bg);
  color: var(--warning-ink);
  box-shadow: 0 1px 3px rgba(154, 52, 18, 0.08);
}

.formatting-warning-summary strong {
  display: block;
  font-size: 13px;
  line-height: 1.3;
}

.formatting-warning-summary p {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.35;
}

.settings-field__help {
  margin: 0;
  max-width: 26ch;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.35;
}
```

- [ ] **Step 7: Refine inline warning styling**

In `src/styles/resume.css`, replace `.bullet-item--warning` with:

```css
.bullet-item--warning {
  background-color: rgba(251, 146, 60, 0.14);
  outline: 1px solid rgba(234, 88, 12, 0.45);
  border-radius: 2px;
}
```

Keep review annotation styles blue/teal/green and distinct.

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 2**

```bash
git add src/App.tsx src/components/FormattingWarningSummary.tsx src/components/SettingsPanel.tsx src/styles/app.css src/styles/resume.css src/tests/appIntegration.test.tsx
git commit -m "clarify fit constraints and formatting warnings"
```

---

## Task 3: Compact Review Shell Affordance And Conditional Full Panel

**Files:**
- Create: `src/components/ReviewStatusControl.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ReviewPanel.tsx`
- Modify: `src/styles/app.css`
- Test: `src/tests/appIntegration.test.tsx`
- Test: `src/tests/reviewUi.test.tsx`

**Interfaces:**
- Consumes: `ResumeReviewState` from `src/useResumeReview.ts`.
- Produces: `ReviewStatusControl({ state, panelOpen, onTogglePanel, onRequestReview })`.
- Produces: `shouldShowReviewPanel(state, panelOpen): boolean` exported from `ReviewStatusControl.tsx` for unit testing.

- [ ] **Step 1: Add failing app tests for no unconfigured rail and compact affordance**

In `src/tests/appIntegration.test.tsx`, update unconfigured expectations in `keeps editing, persistence, export, and import available`:

Replace:

```tsx
expect(screen.getByText('Review service not configured')).toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Review resume' })).toBeDisabled()
```

with:

```tsx
expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()
expect(screen.queryByText('Review service not configured')).not.toBeInTheDocument()
expect(screen.queryByRole('button', { name: 'Review resume' })).not.toBeInTheDocument()
```

Add a new test:

```tsx
it('shows a compact review action when review is configured and idle', async () => {
  vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          reviewEnabled: true,
          llmProvider: 'ollama',
          defaultModel: 'gemma3:4b',
          githubEnrichmentEnabled: false,
          maxUploadBytes: 10_485_760,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    )
  )

  render(<App />)

  expect(await screen.findByRole('button', { name: 'Review resume' })).toBeInTheDocument()
  expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx -t "compact review|editing, persistence"
```

Expected: FAIL because `ReviewPanel` is always rendered.

- [ ] **Step 3: Create `ReviewStatusControl.tsx`**

Create `src/components/ReviewStatusControl.tsx`:

```tsx
import type { ResumeReviewState } from '../useResumeReview'

interface ReviewStatusControlProps {
  state: ResumeReviewState
  panelOpen: boolean
  onTogglePanel: () => void
  onRequestReview: () => void
}

export function shouldShowReviewPanel(
  state: ResumeReviewState,
  panelOpen: boolean
): boolean {
  if (state.status === 'unconfigured') return false
  if (panelOpen) return true
  if (state.status === 'loading') return true
  if (state.status === 'success') return true
  if (state.status === 'stale') return true
  if (state.status === 'error' && 'result' in state && state.result) return true
  return false
}

export function ReviewStatusControl({
  state,
  panelOpen,
  onTogglePanel,
  onRequestReview,
}: ReviewStatusControlProps) {
  if (state.status === 'unconfigured') return null

  const disabled =
    state.status === 'checking' ||
    state.status === 'disabled' ||
    state.status === 'config_error' ||
    state.status === 'loading'

  if (state.status === 'idle') {
    return (
      <button className="review-status-control" onClick={onRequestReview}>
        Review resume
      </button>
    )
  }

  const label = getReviewStatusLabel(state)

  return (
    <button
      className="review-status-control"
      onClick={onTogglePanel}
      disabled={disabled && !shouldShowReviewPanel(state, panelOpen)}
      aria-expanded={shouldShowReviewPanel(state, panelOpen)}
    >
      {label}
    </button>
  )
}

function getReviewStatusLabel(state: ResumeReviewState): string {
  switch (state.status) {
    case 'checking':
      return 'Checking review'
    case 'disabled':
      return 'Review unavailable'
    case 'config_error':
      return 'Review unavailable'
    case 'loading':
      return 'Reviewing...'
    case 'success':
      return 'View review'
    case 'stale':
      return 'Review stale'
    case 'error':
      return 'Review failed'
    default:
      return 'Review'
  }
}
```

- [ ] **Step 4: Update `ReviewPanel` to support close**

In `src/components/ReviewPanel.tsx`, update props:

```tsx
interface ReviewPanelProps {
  state: ResumeReviewState
  onRequestReview: () => void
  onClose?: () => void
}
```

Update function signature:

```tsx
export function ReviewPanel({ state, onRequestReview, onClose }: ReviewPanelProps) {
```

In `.review-panel__header`, after the review action button, add:

```tsx
{onClose ? (
  <button
    className="toolbar-btn review-panel__close"
    onClick={onClose}
    aria-label="Close review panel"
  >
    Close
  </button>
) : null}
```

Do not change existing review state rendering.

- [ ] **Step 5: Wire conditional review panel in `App.tsx`**

In `src/App.tsx`, import `useState`, `ReviewStatusControl`, and `shouldShowReviewPanel`:

```tsx
import { useRef, useState } from 'react'
import {
  ReviewStatusControl,
  shouldShowReviewPanel,
} from './components/ReviewStatusControl'
```

Inside `App`, add:

```tsx
const [reviewPanelOpen, setReviewPanelOpen] = useState(false)
const showReviewPanel = shouldShowReviewPanel(review.state, reviewPanelOpen)
const requestReview = () => {
  setReviewPanelOpen(true)
  void review.requestReview()
}
```

In the header meta, after `Saved locally`, render:

```tsx
<ReviewStatusControl
  state={review.state}
  panelOpen={reviewPanelOpen}
  onTogglePanel={() => setReviewPanelOpen(open => !open)}
  onRequestReview={requestReview}
/>
```

Replace the unconditional `ReviewPanel` render with:

```tsx
{showReviewPanel ? (
  <ReviewPanel
    state={review.state}
    onRequestReview={requestReview}
    onClose={() => setReviewPanelOpen(false)}
  />
) : null}
```

- [ ] **Step 6: Style compact review affordance and close button**

In `src/styles/app.css`, add:

```css
.review-status-control {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 5px 10px;
  border: 1px solid rgba(2, 132, 199, 0.28);
  border-radius: 999px;
  background: #f0f9ff;
  color: #075985;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.review-status-control:hover {
  border-color: rgba(2, 132, 199, 0.55);
  background: #e0f2fe;
}

.review-status-control:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.review-status-control:focus-visible,
.review-panel__close:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.review-panel__header {
  align-items: flex-start;
}

.review-panel__close {
  padding-inline: 10px;
}
```

- [ ] **Step 7: Update review panel tests if needed**

`src/tests/reviewUi.test.tsx` unit tests that render `ReviewPanel` directly should still pass because `onClose` is optional. If a snapshot or exact header button count fails, update only to allow optional absence of close button.

- [ ] **Step 8: Run focused tests**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add src/App.tsx src/components/ReviewStatusControl.tsx src/components/ReviewPanel.tsx src/styles/app.css src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx
git commit -m "add compact review affordance"
```

---

## Task 4: Contextual Editor Controls Outside Resume Text Flow

**Files:**
- Modify: `src/components/ResumeHeader.tsx`
- Modify: `src/components/ResumePage.tsx`
- Modify: `src/components/Section.tsx`
- Modify: `src/components/Entry.tsx`
- Modify: `src/components/Bullet.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/styles/resume.css`
- Test: `src/tests/appIntegration.test.tsx`
- Test: `src/tests/responsiveLayout.test.ts`
- Test: `src/tests/export.test.ts`

**Interfaces:**
- Consumes: existing resume operation helpers.
- Produces: consistent `.editor-control`, `.editor-control--add`, `.editor-control--remove`, `.editor-rail`, `.entry-actions`, `.section-actions`, `.contact-actions` classes.
- Keeps existing `.add-btn`, `.remove-btn`, and `data-editor-only="true"` so current export hiding continues to work.

- [ ] **Step 1: Add failing app integration test for accessible editor controls**

In `src/tests/appIntegration.test.tsx`, add:

```tsx
it('renders contextual editor controls with accessible labels outside resume text flow', () => {
  vi.stubEnv('VITE_REVIEW_API_URL', '')

  render(<App />)

  expect(screen.getByRole('button', { name: 'Add contact item' })).toHaveAttribute(
    'data-editor-only',
    'true'
  )
  expect(screen.getAllByRole('button', { name: /^Remove contact item/ })[0]).toHaveAttribute(
    'data-editor-only',
    'true'
  )
  expect(screen.getByRole('button', { name: 'Add section' })).toHaveAttribute(
    'data-editor-only',
    'true'
  )
  expect(screen.getAllByRole('button', { name: /^Remove section/ })[0]).toHaveAttribute(
    'data-editor-only',
    'true'
  )
  expect(screen.getAllByRole('button', { name: /^Add bullet/ })[0]).toHaveAttribute(
    'data-editor-only',
    'true'
  )
})
```

- [ ] **Step 2: Add CSS contract assertions**

In `src/tests/responsiveLayout.test.ts`, add:

```ts
it('uses one contextual editor-control language with touch-safe fallbacks', () => {
  expect(appCss).toContain('.editor-control')
  expect(appCss).toContain('.editor-rail')
  expect(appCss).toContain('focus-within')
  expect(appCss).toContain('min-height: 44px')
  expect(appCss).toContain('@media (hover: none)')
})
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts -t "contextual editor|editor-control"
```

Expected: FAIL because canonical classes/labels are not implemented yet.

- [ ] **Step 4: Update `ResumeHeader.tsx` controls**

Change contact remove button to:

```tsx
<button
  className="editor-control editor-control--remove remove-btn"
  onClick={() => onResumeChange(removeContactItem(resume, i))}
  aria-label={`Remove contact item${item ? `: ${item}` : ''}`}
  data-editor-only="true"
>
  ×
</button>
```

Change add contact button to:

```tsx
<button
  className="editor-control editor-control--add add-btn"
  onClick={() => onResumeChange(addContactItem(resume))}
  aria-label="Add contact item"
  data-editor-only="true"
>
  Add contact
</button>
```

Keep the button outside the `<ul>` as it is now so it does not disturb centered contact layout.

- [ ] **Step 5: Update `ResumePage.tsx` add section control**

Replace the bottom add section control with:

```tsx
<div className="document-actions-row" data-editor-only="true">
  <button
    className="editor-control editor-control--add add-btn"
    onClick={() => onResumeChange(addSection(resume))}
    aria-label="Add section"
    data-editor-only="true"
  >
    Add section
  </button>
</div>
```

- [ ] **Step 6: Update `Section.tsx` section controls**

Change section remove button to:

```tsx
<div className="section-actions editor-rail" data-editor-only="true">
  <button
    className="editor-control editor-control--remove remove-btn"
    onClick={onRemove}
    aria-label={`Remove section: ${section.title || 'Untitled section'}`}
    data-editor-only="true"
  >
    ×
  </button>
</div>
```

Place this inside `.resume-section-header-row` after `ReviewAnnotations`, keeping it outside `EditableText`.

Change add entry button to:

```tsx
<div className="controls-row" data-editor-only="true">
  <button
    className="editor-control editor-control--add add-btn"
    onClick={() => onChange(addEntry(section))}
    aria-label={`Add entry to ${section.title || 'section'}`}
    data-editor-only="true"
  >
    Add entry
  </button>
</div>
```

- [ ] **Step 7: Update `Entry.tsx` entry controls**

Replace the controls row buttons with:

```tsx
<div className="entry-actions editor-rail" data-editor-only="true">
  <button
    className="editor-control editor-control--add add-btn"
    onClick={() => onChange(addBullet(entry))}
    aria-label={`Add bullet to ${entry.title || 'entry'}`}
    data-editor-only="true"
  >
    Add bullet
  </button>
  <button
    className="editor-control editor-control--remove remove-btn"
    onClick={onRemove}
    aria-label={`Remove entry: ${entry.title || 'Untitled entry'}`}
    data-editor-only="true"
  >
    ×
  </button>
</div>
```

- [ ] **Step 8: Update `Bullet.tsx` delete control**

Change bullet delete button to:

```tsx
<button
  className="editor-control editor-control--remove remove-btn bullet-remove"
  onClick={onDelete}
  aria-label="Delete bullet"
  data-editor-only="true"
>
  ×
</button>
```

Keep it as a child of the `<li>` only for positioning; CSS must keep it out of text flow with absolute positioning.

- [ ] **Step 9: Replace add/remove control CSS with contextual language**

In `src/styles/app.css`, replace the existing `/* ── Add / Remove controls */` section with:

```css
/* ── Contextual editor controls ─────────────────────────────────── */
.editor-control,
.add-btn,
.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid rgba(148, 163, 184, 0.68);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #475569;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  opacity: var(--editor-control-resting-opacity);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
  transition: opacity 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.editor-control--add {
  opacity: 0.68;
}

.editor-control--remove {
  min-width: 24px;
  padding-inline: 7px;
}

.resume-header:hover .editor-control,
.resume-header:focus-within .editor-control,
.resume-section:hover .editor-control,
.resume-section:focus-within .editor-control,
.resume-entry:hover .editor-control,
.resume-entry:focus-within .editor-control,
.bullet-item:hover .editor-control,
.bullet-item:focus-within .editor-control,
.editor-control:focus-visible {
  opacity: 1;
}

.editor-control--add:hover {
  background: #ecfdf5;
  border-color: #86efac;
  color: #047857;
}

.editor-control--remove:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: var(--danger);
}

.editor-rail {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.document-actions-row,
.controls-row {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

@media (hover: none), (pointer: coarse) {
  .editor-control,
  .add-btn,
  .remove-btn {
    min-height: 44px;
    min-width: 44px;
    opacity: 0.86;
  }

  .editor-control--add {
    padding-inline: 12px;
  }
}
```

Keep the print block hiding `.add-btn`, `.remove-btn`, and `[data-editor-only='true']`.

- [ ] **Step 10: Update resume positioning CSS**

In `src/styles/app.css`, ensure these placement rules exist after the contextual controls block:

```css
.resume-header-contact-row {
  position: relative;
  margin-bottom: 8px;
}

.resume-header-contact-row > .editor-control--add {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.resume-contact-item {
  position: relative;
}

.resume-contact-item > .editor-control--remove {
  position: absolute;
  top: -18px;
  right: -18px;
}

.resume-section-header-row > .section-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.resume-entry {
  position: relative;
}

.entry-actions {
  justify-content: flex-end;
  margin-top: 3px;
}

.bullet-item {
  position: relative;
}

.bullet-item > .bullet-remove {
  position: absolute;
  top: -3px;
  right: -32px;
}
```

- [ ] **Step 11: Ensure export hiding still covers all controls**

Run:

```bash
npm test -- --run src/tests/export.test.ts -t "editor-only controls"
```

Expected: PASS because all controls retain `.add-btn`, `.remove-btn`, or `[data-editor-only="true"]`.

If it fails because a new class is not hidden, update `src/export.ts` editor-only selector to include `.editor-control`:

```ts
const editorOnlySelector = '.add-btn, .remove-btn, .editor-control, [data-editor-only="true"]'
```

Then update export tests to include an `.editor-control` button and assert it is hidden/restored.

- [ ] **Step 12: Run focused tests**

Run:

```bash
npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/export.test.ts
```

Expected: PASS.

- [ ] **Step 13: Commit Task 4**

```bash
git add src/components/ResumeHeader.tsx src/components/ResumePage.tsx src/components/Section.tsx src/components/Entry.tsx src/components/Bullet.tsx src/styles/app.css src/styles/resume.css src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/export.test.ts src/export.ts
git commit -m "redesign contextual resume editor controls"
```

---

## Task 5: Responsive Behavior And E2E Contract Updates

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`
- Modify: `e2e/configured-review.spec.ts`

**Interfaces:**
- Consumes: classes from Tasks 1-4.
- Produces: verified no page-level horizontal overflow and review panel only useful/open.

- [ ] **Step 1: Strengthen CSS contract tests**

In `src/tests/responsiveLayout.test.ts`, add:

```ts
it('keeps review conditional and prevents page-level overflow on narrow screens', () => {
  expect(appCss).toContain('@media (max-width: 1220px)')
  expect(appCss).toContain('grid-template-columns: minmax(0, 1fr);')
  expect(appCss).toContain('overflow-x: auto;')
  expect(appCss).toContain('max-width: min(816px, calc(100vw - 40px));')
})

it('defines semantic colors for warning danger review and focus states', () => {
  expect(appCss).toContain('--warning-bg')
  expect(appCss).toContain('--warning-border')
  expect(appCss).toContain('--danger')
  expect(appCss).toContain('--review')
  expect(appCss).toContain('--focus')
})
```

- [ ] **Step 2: Update responsive CSS for narrower app padding**

In `src/styles/app.css`, update the existing `@media (max-width: 1220px)` review max width rule to account for current 20px app padding:

```css
.review-panel {
  position: static;
  width: 100%;
  max-width: min(816px, calc(100vw - 40px));
  max-height: none;
  order: -1;
}
```

In `@media (max-width: 560px)`, keep app padding `12px`; add:

```css
.review-panel {
  max-width: min(816px, calc(100vw - 24px));
}

.app-header__meta {
  justify-content: flex-start;
}

.toolbar-btn,
.review-status-control {
  min-height: 44px;
}
```

- [ ] **Step 3: Run responsive CSS tests**

Run:

```bash
npm test -- --run src/tests/responsiveLayout.test.ts
```

Expected: PASS.

- [ ] **Step 4: Update unconfigured E2E expectations**

In `e2e/unconfigured.spec.ts`, replace any assertion that expects the full review panel or disabled `Review resume` button in unconfigured mode with:

```ts
await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
await expect(page.getByRole('button', { name: 'Review resume' })).toHaveCount(0)
```

Keep existing assertions for app load, nonblank resume, PDF download, editing, and narrow fixed-canvas scrolling.

- [ ] **Step 5: Update configured E2E to use compact review affordance**

In `e2e/configured-review.spec.ts`, when triggering review success, use the shell button:

```ts
await page.getByRole('button', { name: 'Review resume' }).click()
await expect(page.getByRole('complementary', { name: 'Resume review' })).toBeVisible()
```

For stale/result assertions, keep checking the full panel after it appears. For disabled/config-error states, expect compact status text rather than an always-rendered full disabled rail unless the test explicitly opens the panel.

- [ ] **Step 6: Run E2E tests**

Run:

```bash
npm run test:e2e
```

Expected: PASS. The tests must not require real Ollama, `vendor/hiring-agent`, or third-party network access.

- [ ] **Step 7: Commit Task 5**

```bash
git add src/styles/app.css src/tests/responsiveLayout.test.ts e2e/unconfigured.spec.ts e2e/configured-review.spec.ts
git commit -m "harden responsive editor redesign contracts"
```

---

## Task 6: Full Verification And Documentation Sync

**Files:**
- Modify: `docs/EDITOR_REDESIGN_SPEC.md` only if implementation discovers a necessary spec clarification.
- Modify: `README.md` or product docs only if visible behavior copy changed enough to make existing docs stale.

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: verified redesign branch with passing frontend, build, and E2E checks.

- [ ] **Step 1: Run frontend tests**

Run:

```bash
npm test -- --run
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and Vite builds with `/presume/` base path unchanged.

- [ ] **Step 3: Run browser E2E tests**

Run:

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 4: Optional backend tests if review-service files changed**

Only if any `review-service/` file changed, run:

```bash
python3 -m pytest review-service/tests -q
```

Expected: PASS. If no backend files changed, record `Not run: no review-service files changed` in the final implementation summary.

- [ ] **Step 5: Manual QA desktop**

Start the app:

```bash
npm run dev -- --host 127.0.0.1
```

Open:

```txt
http://127.0.0.1:5173/presume/
```

At a desktop viewport around `1366x1024`, verify:

- Header shows product promise and `Saved locally`.
- Constraints/status strip appears above document toolbar.
- `Export PDF` is primary.
- Resume page has strongest physical presence.
- Review rail is absent when unconfigured.
- Editor controls are quiet at rest and visible on hover/focus.
- PDF export downloads and contains no editor controls.

- [ ] **Step 6: Manual QA narrow viewport**

At a narrow viewport around `358x980`, verify:

- Body does not horizontally scroll.
- Header stacks.
- Constraints and toolbar wrap without clipping.
- Only `.resume-canvas-scroll` scrolls horizontally for the fixed `816px` resume page.
- Touch/focus editor controls have usable hit areas.
- Active review panel stacks/collapses and does not create page-level horizontal overflow.

- [ ] **Step 7: Manual QA review states with configured fixture/E2E path**

Using existing configured E2E route interception or a controlled local fixture, verify:

- Configured idle state shows compact `Review resume` affordance.
- Clicking review opens the full panel when useful.
- Success result shows `Advisory only` and `Advisory score, not an ATS guarantee.`
- Editing after success shows stale review state and keeps previous result visible.
- Config error and disabled states remain understandable without a visually dominant rail.

- [ ] **Step 8: Commit verification docs if changed**

If manual QA or docs updates changed files:

```bash
git add docs/EDITOR_REDESIGN_SPEC.md README.md docs/PRODUCT_SPEC.md docs/ARCHITECTURE.md
git commit -m "document editor redesign verification"
```

If no docs changed, do not create an empty commit.

- [ ] **Step 9: Final status summary**

Prepare final implementation summary with:

- Commits made.
- Tests run and exact pass/fail results.
- Manual QA performed.
- Any intentional deviations from `docs/EDITOR_REDESIGN_SPEC.md`.
- Confirmation that JSON format, PDF behavior, Pretext resizing, direct editing, `/presume/`, and advisory review mutation boundaries were not changed.
