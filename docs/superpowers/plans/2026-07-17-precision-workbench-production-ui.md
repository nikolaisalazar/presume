# Precision Workbench Production UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved root `DESIGN.md` into Presume's production visual system through five independently reviewable pull requests without changing resume behavior, document geometry, export, review semantics, or persisted resume data.

**Architecture:** Keep `DESIGN.md` normative, translate its values into semantic Tailwind v4/CSS tokens in `src/styles/globals.css`, and let React components consume those tokens through the existing shadcn/Base UI primitives and a small theme-preference module. Migrate from the outside inward: theme and typography first, editor shell second, expanded Review third, landing page fourth, and legacy CSS retirement last. Every phase starts from the latest merged `main` and must merge before the next begins.

**Tech Stack:** Vite 6, React 18, TypeScript 5.7, Tailwind CSS 4, shadcn 4/Base UI, Vitest/Testing Library, Playwright, locally bundled Geist Sans and EB Garamond assets.

## Global Constraints

- `DESIGN.md` is the visual authority. `PRODUCT.md` is the product authority. If a historical plan or spec conflicts with either, do not reproduce the historical behavior.
- Keep Presume desktop-first. The `1640px` wide-workbench boundary and the stacked layout through `1639px` remain unchanged.
- Preserve the fixed `816px × 1056px` resume, browser-zoom geometry, internal narrow-screen canvas scroller, canonical PDF renderer, and Letter-sized export.
- Do not change the resume JSON format, stable identifiers, `src/storage.ts`, resize bounds, review request/state behavior, routing, or GitHub Pages fallback behavior.
- Do not change `src/styles/resume.css` during this program. If implementation appears to require it, stop and open a separate document-design task.
- The app may add a separate UI preference key, `presume:theme`, but it must not alter or migrate any resume-storage key.
- Keep the resume paper warm white in Light, Dark, and System appearances. Theme changes apply to application chrome only.
- Treat the current browser/PDF paper fill as part of the protected document renderer. The `--paper` token may style app-owned previews and framing, but this program must not override `.resume-page` or the PDF `Page` background merely to shift `#ffffff` to `#fffefb`; that exact document-color change requires its own explicit document-rendering task.
- Use Geist for every application role, including the `Presume` wordmark. Keep EB Garamond exclusive to the browser resume and PDF.
- Preserve the inclusive touch boundary: touch-critical controls are at least `44px` high through `560px`; desktop controls return to `36px` from `561px`.
- Keep ordinary motion within `150–250ms`; keep the Review progress line `3px`; provide a static reduced-motion state.
- Do not add visual snapshots. Add only focused behavior or geometry tests that protect a newly introduced contract.
- Do not mix unrelated product features—especially PDF import, review-provider work, resume reordering, or schema changes—into these PRs.
- Never claim visual QA from automated geometry tests. Each phase with visual changes has a direct browser gate.

## Approved Token Mapping

Translate the `DESIGN.md` front matter into these semantic roles. Component code should consume the role, not a raw hex value.

| Semantic role | Light | Dark | Usage |
| --- | --- | --- | --- |
| `--background` | `#edf2f0` | `#101513` | App canvas |
| `--canvas-deep` | `#e2e9e6` | `#0c100f` | Subtle canvas depth only |
| `--card` / `--surface` | `#f8fbfa` | `#1a211f` | Structural shells |
| `--surface-raised` | `#ffffff` | `#202825` | Buttons and raised controls |
| `--surface-pressed` | `#eef3f1` | `#151b19` | Selected/control wells |
| `--stage` | `#dfe7e4` | `#0d1210` | Resume stage |
| `--foreground` | `#17211e` | `#f0f3f1` | App text |
| `--muted-foreground` | `#56635e` | `#aab4b0` | Secondary app text |
| `--border` | `#bccbc6` | `#34403c` | Structural lines |
| `--border-strong` | `#9eafa9` | `#46534e` | Major boundaries |
| `--primary` | `#14796f` | `#14796f` | Primary action |
| `--primary-hover` | `#0f685f` | `#1d8177` | Primary hover |
| `--ring` | `#6bc8bd` | `#6bc8bd` | Focus edge |
| `--paper` | `#fffefb` | `#fffefb` | Resume only |
| `--paper-ink` | `#101827` | `#101827` | Resume only |

Semantic warning, success, and destructive tokens must use `DESIGN.md`'s fixed meanings. They must not derive from Verdigris and must not be used decoratively.

## Program Sequence

| PR | Branch | Scope | Merge gate |
| --- | --- | --- | --- |
| A | `feat/precision-workbench-foundation` | Geist, semantic tokens, Light/Dark/System preference, masthead | Theme behavior, both palettes, no resume/PDF drift |
| B | `feat/precision-workbench-editor-shell` | Command rail, Fit, stage, collapsed Review, wide/stacked composition | Exact-width shell QA and all editor geometry tests |
| C | `feat/precision-workbench-review` | Expanded Review report and all Review states | Configured Review state QA and semantics |
| D | `feat/precision-workbench-landing` | Landing page identity and responsive composition | Inclusive `640/641` and `920/921` QA |
| E | `chore/precision-workbench-css-hardening` | Retire obsolete CSS/tokens, consistency audit, documentation | Full release gate and final cross-route QA |

Do not open PR B before PR A merges, and so on. This avoids maintaining parallel token or component contracts across long-lived branches.

---

## Phase A — Semantic Foundation, Geist, and Appearance

### Task A1: Establish the branch and baseline

**Files:**
- Read: `DESIGN.md`
- Read: `PRODUCT.md`
- Read: `.impeccable/design.json`
- Read: `src/styles/globals.css`
- Read: `src/styles/app.css`
- Read: `src/main.tsx`
- Read: `src/App.tsx`

- [ ] Fetch `origin`, fast-forward local `main`, and create an isolated worktree/branch named `feat/precision-workbench-foundation`.
- [ ] Run the current baseline before editing:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm run verify
CI=1 npm run test:e2e
npm run build
```

Expected baseline on 2026-07-17: 18 Vitest files / 184 tests and 7 Playwright tests pass. Record actual counts; do not force future counts to match this note.

- [ ] Confirm the protected document and behavior files are clean against `origin/main`:

```sh
git diff --exit-code origin/main...HEAD -- \
  src/styles/resume.css \
  src/types.ts \
  src/storage.ts \
  src/export.ts \
  src/pdf \
  src/reviewApi.ts \
  src/useResizeEngine.ts
```

### Task A2: Bundle Geist locally

**Files:**
- Create: `src/assets/fonts/Geist-Variable.woff2`
- Create: `src/assets/fonts/Geist-OFL.txt`
- Create: `src/assets/fonts/README.md`
- Modify: `src/styles/globals.css`

- [ ] Obtain the official Geist Sans variable webfont and OFL license from the `vercel/geist-font` release used by the implementation. Do not reference a CDN or make the production app fetch a font at runtime.
- [ ] Keep `Geist-OFL.txt` verbatim. Record the upstream repository, release/tag, source filename, and retrieval date in `src/assets/fonts/README.md` so later upgrades are reproducible.
- [ ] Register only the application family in `globals.css`:

```css
@font-face {
  font-family: "Geist";
  src: url("../assets/fonts/Geist-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

- [ ] Set Tailwind's `--font-sans` and `--font-heading` to `"Geist", "Helvetica Neue", system-ui, sans-serif`.
- [ ] Keep all `EB Garamond` declarations and assets unchanged. Search the application shell for serif leakage:

```sh
rg -n "EB Garamond|Garamond|font-serif" src --glob '!styles/resume.css' --glob '!pdf/**'
```

Expected: no application-shell component intentionally uses EB Garamond.

### Task A3: Implement semantic Light and Dark tokens

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/styles/app.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/alert.tsx`

- [ ] Replace the generic current Light/Dark values in `globals.css` with the approved semantic mapping above.
- [ ] Add named variables for canvas depth, raised/pressed surfaces, stage, strong border, paper, inset edge, control edge, structural ambient, masthead ambient, document ambient, and the standard `180ms` easing.
- [ ] Make `app.css` bridge its existing `--app-bg`, `--surface`, `--line`, `--stage-surface`, and shadow variables to the new semantic tokens. Do not maintain a second raw color palette.
- [ ] Set the system radius base so structural shells resolve to `2px` and controls explicitly resolve to `4px`. Do not rely on shadcn's current `rounded-lg`/`rounded-xl` defaults for product surfaces.
- [ ] Update the shared `Button` variants so all ordinary controls use `4px` corners, `36px` desktop height, tokenized hover/active/focus/disabled states, and the existing `44px` touch-critical editor size through `560px`.
- [ ] Update shared `Card`, `Badge`, and `Alert` presentation only where a semantic token or corner rule can be applied without changing component content or behavior.
- [ ] Keep Verdigris below roughly ten percent of the normal screen. A token conversion is not permission to tint every surface.

### Task A4: Add the persisted theme contract before first paint

**Files:**
- Create: `src/theme.ts`
- Create: `src/tests/theme.test.ts`
- Modify: `src/main.tsx`

- [ ] Write focused failing tests for the following contract:
  - Missing or invalid storage resolves to `system`.
  - `light` and `dark` preferences resolve directly.
  - `system` follows `matchMedia('(prefers-color-scheme: dark)')`.
  - Applying a resolved theme toggles `.dark`, sets `data-theme`, and sets `color-scheme` without touching resume storage.
- [ ] Implement this public API:

```ts
export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'presume:theme'

export function readThemePreference(storage: Pick<Storage, 'getItem'>): ThemePreference
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme
export function applyResolvedTheme(
  root: HTMLElement,
  theme: ResolvedTheme
): void
export function initializeTheme(): ThemePreference
export function setThemePreference(preference: ThemePreference): void
export function subscribeToTheme(listener: () => void): () => void
```

Implementation notes:

- `initializeTheme()` runs in `src/main.tsx` before `createRoot(...).render(...)` to avoid a Light flash in Dark/System mode.
- The module listens for system-theme changes only as long as the active preference is `system`.
- The module dispatches a same-document custom event after an explicit change so React controls synchronize without a reload.
- Storage failures fall back to `system`; they must not prevent the editor from rendering.
- Do not add theme behavior to `src/storage.ts`.

- [ ] Run only the focused test while iterating:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-theme-vitest npm test -- --run src/tests/theme.test.ts
```

### Task A5: Add the masthead and appearance control

**Files:**
- Create: `src/components/ThemeControl.tsx`
- Create: `src/components/AppHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`

- [ ] Build `ThemeControl` as a real single-choice option set with visible `System`, `Light`, and `Dark` labels. Use a native radio group/fieldset or an equally semantic Base UI primitive; do not use three unrelated buttons.
- [ ] Keep keyboard arrow/tab behavior appropriate for the chosen primitive, an accessible `Appearance` name, visible focus, and `aria-checked`/checked state that matches the stored preference.
- [ ] Extract the editor masthead into `AppHeader` so theme state and product identity are not mixed into `EditorApp` orchestration.
- [ ] Render the masthead in this order:

```text
Presume                                      Saved locally  [System Light Dark]
```

- [ ] Remove the editor tagline. Render `Saved locally` as quiet status text, not a Badge or button-like chip.
- [ ] Preserve the existing `Presume home` navigation and browser-back behavior.
- [ ] Make the masthead span the available browser width while the workbench beneath remains content-constrained.
- [ ] Add the same `ThemeControl` to the existing landing navigation without otherwise redesigning the landing page in this phase. Keep the landing editor action and its responsive behavior intact.
- [ ] Update existing integration assertions rather than adding broad snapshots. Add only assertions for:
  - the `Appearance` option set and current preference;
  - `Saved locally` preceding it in the masthead;
  - the removed tagline not rendering;
  - the resume page remaining outside the theme control's styling contract.

### Task A6: Verify and review PR A

- [ ] Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm run verify
npm run build
CI=1 npm run test:e2e
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --check
git status --short --branch
```

- [ ] Directly inspect `/presume/editor/` in Light, Dark, and System at `1920px`, `960px`, `560px`, and `358px`, plus a landing-page smoke check at `1120px` and `358px`.
- [ ] Confirm the warm-white resume does not change color, its measured width remains `816px`, and PDF output remains Letter-sized in both themes.
- [ ] Confirm System responds to a system appearance change, explicit Light/Dark persists across reloads, focus remains visible, and the masthead wraps without page-level overflow.
- [ ] Use a screen-reader/semantics inspection to confirm the appearance choice is announced as one named option set.
- [ ] Commit in reviewable units, for example:

```sh
git add src/assets/fonts src/styles/globals.css src/styles/app.css src/components/ui
git commit -m "feat: add Precision Workbench visual tokens"

git add src/theme.ts src/main.tsx src/components/ThemeControl.tsx src/components/AppHeader.tsx src/App.tsx src/tests
git commit -m "feat: add persisted appearance control"
```

- [ ] Open PR A. Merge only after `verify` passes, direct Light/Dark QA is recorded, and an independent code review reports no actionable finding.

---

## Phase B — Editor Shell and Collapsed Workbench Surfaces

### Task B1: Start from merged PR A

**Files:**
- Read: `DESIGN.md`
- Read: `src/App.tsx`
- Read: `src/styles/app.css`
- Read: `src/components/FitConstraintsPanel.tsx`
- Read: `src/components/SettingsPanel.tsx`
- Read: `src/components/Toolbar.tsx`
- Read: `src/components/ReviewRail.tsx`

- [ ] Fast-forward `main` after PR A and create `feat/precision-workbench-editor-shell` in an isolated worktree.
- [ ] Run `npm run verify` before editing and capture the new baseline counts.

### Task B2: Restyle the command rail without changing actions

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`

- [ ] Keep exactly four actions and the existing two accessible groups:

```text
Export PDF  Export JSON                         Import JSON  Reset template
```

- [ ] Keep `Export PDF` as the only primary action. Keep JSON import/export and Reset behavior unchanged.
- [ ] Keep `role="toolbar"`, `Export actions`, and `File actions` group semantics.
- [ ] Remove no button labels and add no redundant `EXPORT` title.
- [ ] Convert the outer action surface to a `2px` structural shell with tokenized border, inset edge, and restrained ambient shadow.
- [ ] Preserve the narrow wrapping order and `44px` touch targets through `560px`.

### Task B3: Restyle Fit as a precise progressive-disclosure rail

**Files:**
- Modify: `src/components/FitConstraintsPanel.tsx`
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/FormattingWarningSummary.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `e2e/unconfigured.spec.ts`

- [ ] Keep the collapsed label and summary exactly:

```text
Fit constraints    1 page · 1 line/bullet · 8px min    chevron
```

- [ ] Keep the summary absent while expanded. Make the chevron legible as the disclosure affordance without placing it in a decorative standalone capsule.
- [ ] Preserve the current invariant that the collapsed and expanded trigger heights match.
- [ ] Restyle the three steppers as one segmented `4px` control each. Keep units in labels/help, not inside the numeric value cell.
- [ ] Use tabular Geist numerals for values. Preserve constraint limits, labels, accessible button names, and update behavior.
- [ ] Keep formatting warnings semantic and subordinate. Do not turn each warning into a new card.
- [ ] Keep Fit and Review exactly equal in wide-column width; target `320px` content tracks, allowing only the documented shell border/padding around them.

### Task B4: Restyle the stage and centered document anchor

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

- [ ] Keep the workspace geometry:

```css
@media (min-width: 1640px) {
  /* 320px Fit / fixed editor / 320px Review */
}
```

- [ ] At `1640px+`, keep Fit left, the fixed editor centered, and Review right. At `1639px` and below, keep Fit above, editor center, Review below.
- [ ] Replace the current flexible `360px` side surfaces with the approved equal `320px` tracks and update the wide-workspace width calculation accordingly. Update the existing `1920px` Playwright expectation from `360px` to `320px`; keep the equality assertion at `1640px`.
- [ ] Replace the rounded, gradient-heavy stage with the approved opaque stage token, `2px` structural edge, and sparse elevation.
- [ ] Keep the resume itself square, warm white, centered within `.resume-canvas-scroll`, and elevated more strongly than application shells.
- [ ] Preserve `.resume-canvas-scroll { overflow-x: auto; }`, no document-level overflow, and all zoom/author-geometry assertions.
- [ ] Do not edit `.resume-page`, resume font sizes, resume section spacing, or author coordinates.
- [ ] Update the CSS invariant test only for intentional token/corner changes. Do not add string assertions for every color.

### Task B5: Restyle the collapsed Review rail and loading state

**Files:**
- Modify: `src/components/ReviewRail.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/reviewUi.test.tsx`
- Modify: `e2e/configured-review.spec.ts`

- [ ] Preserve all `getReviewRailPresentation` state mappings and action behavior.
- [ ] Keep Review a persistent peer to Fit. Do not move its trigger into the masthead.
- [ ] Keep the compact single-row hierarchy and stable rail dimensions across unavailable, idle, loading, success, stale, and error states.
- [ ] Keep the loading label `Reviewing`, with no ellipsis and no spinner.
- [ ] Keep the `3px` bottom-edge Verdigris sweep. Under `prefers-reduced-motion: reduce`, render a static full-width line.
- [ ] Keep score typography on one line with tabular numerals.
- [ ] Use amber/green/red only for semantic status; unavailable must not look like a primary action.
- [ ] Update existing ReviewRail tests only when markup or presentation tokens change. Do not rewrite state-machine tests.

### Task B6: Verify and review PR B

- [ ] Run the full release gate and protected-file diff from Task A6.
- [ ] Directly inspect Light and Dark at `1920px`, `1640px`, `1639px`, `960px`, `561px`, `560px`, and `358px`.
- [ ] At wide widths confirm:
  - equal Fit and Review tracks;
  - centered resume and command rail;
  - the resume is the dominant visual anchor;
  - shells use the same `2px` geometry and align at their top edges.
- [ ] At constrained widths confirm Fit is above, Review is below, controls remain usable, and horizontal overflow is contained inside the canvas.
- [ ] Exercise Fit collapsed/expanded, formatting warning present/absent, Review unavailable/idle/loading/ready/stale/failure, keyboard focus, reduced motion, and `50%` browser zoom.
- [ ] Export PDF in both themes and confirm theme chrome is absent and Letter dimensions remain unchanged.
- [ ] Suggested commits:

```sh
git commit -m "feat: restyle document command and fit controls"
git commit -m "feat: apply Precision Workbench editor shell"
git commit -m "feat: refine collapsed review states"
```

- [ ] Open PR B and request independent review. Merge before beginning Phase C.

---

## Phase C — Expanded Review Report

### Task C1: Preserve Review behavior before changing presentation

**Files:**
- Read: `src/components/ReviewPanel.tsx`
- Read: `src/components/ReviewCategorySelector.tsx`
- Read: `src/tests/reviewUi.test.tsx`
- Read: `src/useResumeReview.ts`

- [ ] Fast-forward merged Phase B and create `feat/precision-workbench-review`.
- [ ] Record the DOM/state contract for unconfigured, checking, disabled, configuration error, idle, loading, success, stale, rerun failure with retained result, and first-run failure.
- [ ] Do not change `useResumeReview`, request cancellation, stale-result behavior, annotations, category selection semantics, or review response types.

### Task C2: Apply the mixed-visibility report hierarchy

**Files:**
- Modify: `src/components/ReviewPanel.tsx`
- Modify: `src/components/ReviewCategorySelector.tsx`
- Modify: `src/styles/app.css`

- [ ] Keep `Review` as a semantic level-two heading and preserve coherent descendant heading order.
- [ ] Present the completed result in this order:
  1. Compact overall score and tier.
  2. Category score grid.
  3. Selected category evidence/detail.
  4. Inline bonus/deduction ledger when present.
  5. Findings and annotations.
- [ ] Use Badge only for tier/severity/status. Do not give bonus and deduction separate full-size cards.
- [ ] Use Separator only when both ledger sides exist or where a genuine structural boundary is needed.
- [ ] Keep selectively disclosed evidence so the right-side report does not become a wall of equal-weight cards.
- [ ] Keep all signed adjustment semantics, arbitrary values, one-sided adjustments, and zero/empty states intact.
- [ ] Keep expanded Review constrained and sticky only at the existing wide layout; it must not eclipse the document.
- [ ] Apply `2px` structural shells, `4px` controls/chips, Geist typography, and semantic colors from Phase A.

### Task C3: Test only the presentation contracts that can regress behavior

**Files:**
- Modify: `src/tests/reviewUi.test.tsx`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `e2e/configured-review.spec.ts`

- [ ] Reuse the existing broad Review state tests.
- [ ] Add or update focused assertions only for:
  - level-two `Review` heading;
  - selected category disclosure;
  - tier/severity Badge presence;
  - conditional two-sided Separator;
  - retained stale result after failed rerun;
  - `44px` Review actions at `560px` and `36px` at `561px`.
- [ ] Do not add snapshots for every Review state.

### Task C4: Verify and review PR C

- [ ] Run `npm run verify`, build, both E2E configurations, SPA fallback comparison, protected diff, and `git diff --check`.
- [ ] Directly inspect all Review states in Light and Dark at `1920px`, `1640px`, `1639px`, `960px`, `560px`, and `358px`.
- [ ] Confirm no score wraps as `84` over `/100`, category labels remain readable, evidence is not duplicated, status is not communicated by color alone, and the document remains visually dominant.
- [ ] Confirm focus returns to the rail after collapse and moves into the panel after expand.

> **Phase C checkpoint — 2026-07-21 (`b59323a`):** The approved Elastic Review workbench, Border Notch Fit drawer, and information-first Score/Feedback report are implemented without temporary preview or mock runtime code. `npm run verify` passed 220 frontend and 50 backend tests; both E2E configurations passed 9/9; the production build, SPA fallback comparison, protected diff, and whitespace checks passed. Direct visual QA covered all ten Review states in Light and Dark at `1920`, `1640`, `1639`, `960`, `560`, and `358`, including score wrapping, category readability, duplicate evidence, non-color cues, document dominance, and focus transfer/return. Independent rigorous review reported no Critical, Important, or Minor findings.

- [ ] Suggested commits:

```sh
git commit -m "feat: restyle expanded review report"
git commit -m "test: protect review presentation contracts"
```

- [ ] Open PR C, request independent review, and merge before Phase D.

---

## Phase D — Landing Page Identity

### Task D1: Translate the system without turning the page into a generic SaaS site

**Files:**
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/styles/app.css`

- [ ] Fast-forward merged Phase C and create `feat/precision-workbench-landing`.
- [ ] Apply Geist, Verdigris, the Light/Dark surface system, `2px` structural shells, `4px` controls, and the same masthead identity.
- [ ] Keep the existing landing information architecture and route behavior unless removing copy that directly violates `DESIGN.md`'s redundancy rule.
- [ ] Keep the resume/editor preview as the visual anchor of the hero. Do not add glass, oversized gradient type, decorative vertical stripes, or a card around every text group.
- [ ] Make the page work in both themes; keep any previewed resume paper warm white.
- [ ] Keep the existing three calls to open/continue editing and their saved-resume wording.
- [ ] Preserve exact inclusive responsive contracts:
  - Through `640px`: stacked header, `44px` header action, hidden decorative preview, one feature column, no page overflow.
  - `641px–920px`: desktop-oriented header, `36px` header action, visible preview, two feature columns, vertical workflow through `920px`.
  - `921px+`: four feature columns, horizontal workflow, two-column hero, no overlap.

### Task D2: Keep landing tests conservative

**Files:**
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `e2e/unconfigured.spec.ts`

- [ ] Preserve route, saved-resume, and primitive-composition assertions.
- [ ] Update text assertions only for deliberately distilled copy.
- [ ] Keep the existing `640/641` and `920/921` geometry coverage. Add no visual snapshots.
- [ ] Add one paper-independence assertion if the landing preview has a themed parent: its document preview must remain the same warm-white token in Light and Dark.

### Task D3: Verify and review PR D

- [ ] Run the full release gate.
- [ ] Directly inspect `/presume/` in Light and Dark at `1120px`, `921px`, `920px`, `641px`, `640px`, and `358px`.
- [ ] Confirm hierarchy, feature/workflow transitions, touch sizing, preview containment, focus, theme persistence into `/presume/editor/`, and browser-back navigation.
- [ ] Suggested commits:

```sh
git commit -m "feat: apply Precision Workbench landing identity"
git commit -m "test: preserve landing responsive boundaries"
```

- [ ] Open PR D, request independent review, and merge before Phase E.

---

## Phase E — CSS Retirement, Consistency, and Migration Closeout

### Task E1: Remove superseded visual generations

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/styles/app.css`
- Read: `src/components/ui/button.tsx`
- Read: `src/components/ui/card.tsx`
- Read: `src/components/ui/badge.tsx`
- Read: `src/components/ui/alert.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`

- [x] Fast-forward merged Phase D and create `chore/precision-workbench-css-hardening`.
- [x] Inventory raw colors, arbitrary radii, unapproved shadows, duplicate surface variables, and obsolete selector generations:

```sh
rg -n "#[0-9a-fA-F]{3,8}|rgba?\(|oklch\(|rounded-(lg|xl|2xl)|border-radius|box-shadow" \
  src/styles/globals.css src/styles/app.css src/components
```

- [x] Keep intentional raw values only where they define the approved tokens, document editor-control behavior, or semantic state. Replace component-level visual literals with semantic roles.
- [x] Remove unused legacy `--app-*`, `--surface-*`, shadow, and radius variables after confirming no references remain.
- [x] Remove superseded selectors rather than keeping old and new shell systems in parallel.
- [x] Consolidate repeated shadcn variant strings only when at least two real consumers share the same semantic role. Do not build speculative abstractions. No new shared abstraction met this threshold.
- [x] Keep `app.css` for genuinely custom layout, fixed-canvas containment, in-document editor controls, print hiding, and the Review sweep.
- [x] Do not move resume styling into Tailwind and do not touch `resume.css`.

### Task E2: Audit accessibility, motion, and token completeness

**Files:**
- Modify only where a concrete defect is found: `src/components/**`
- Modify: `src/styles/globals.css`
- Modify: `src/styles/app.css`
- Modify focused existing tests only

- [x] Check WCAG 2.2 AA contrast for Light/Dark body text, muted text, buttons, focus edges, warnings, success, and error states.
- [x] Keyboard through landing and editor without a mouse; confirm visible focus, disclosure order, toolbar grouping, radio-group semantics, and Review focus restoration.
- [x] Confirm `prefers-reduced-motion` removes the sweep animation but retains a visible progress state.
- [x] Confirm no ordinary control has pill geometry, no decorative vertical stripe exists, and no structural shell exceeds `2px` corners.
- [x] Confirm `Saved locally` reads as status, not as a button.
- [x] Confirm Verdigris is reserved for action/selection/focus/progress, not broad decoration.

### Task E3: Close the migration record

**Files:**
- Modify: `docs/SHADCN_MIGRATION.md`
- Modify: `docs/superpowers/specs/2026-07-16-publishing-bureau-editor-visual-system-design.md`
- Modify: `docs/superpowers/plans/2026-07-17-precision-workbench-production-ui.md`

- [x] Record every already-merged PR number and merge SHA. Phase E remains explicitly pending until merge.
- [x] Distinguish automated verification, independent code review, direct visual QA, and merge status.
- [ ] Mark this program complete only after all five PRs are merged and final QA passes.
- [x] Note any intentionally deferred work as a separate issue; do not leave vague “later” bullets that look like unfinished scope. Phase E introduces no unnamed deferral.

> **Phase E reviewed PR checkpoint — 2026-07-22:** The conservative audit retires 220 stylesheet lines and adds 33 contract-preserving or accessibility-correcting lines, including the `--shadow-page` bridge still consumed by protected resume styling. Every remaining custom class has a source consumer. The Light accent defect moves from 4.400:1 to 5.552:1. A fresh context-isolated review of PR head `8cf79feb52b1653ca3da496f8e18803112c90b53` then found standalone custom focus outlines measuring only 1.747–1.960:1 and incomplete retirement-test coverage. The test-first remediation pairs application outlines with `--focus-contrast`, theme-independent document and landing-hero paper surfaces with `--paper-ink`, and expands the retirement boundary through every removed variant. Re-review of first remediation `b2e3088aa0346c77135bd659ed948e8a53a832b3` caught the hero-specific context and last selector variants; both follow-ups are now covered. `npm run verify` passes 224 frontend and 50 backend tests; the production build and both E2E configurations pass 10/10. Direct Light/Dark focus inspection covers the masthead identity, hero CTA/credit, and document controls. The earlier full route/PDF/reduced-motion matrix remains valid because geometry, behavior, and document output are unchanged. Final exact-head review of `b25e3ac6c081dc449ddb62d7e64541c1acf54796` found no Critical, Important, or Minor issues and approved merge subject to required CI. Merge evidence remains pending for PR #40.

### Task E4: Final release gate

- [x] Run from a clean worktree after the PR review remediation:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run verify
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
  src/pdf \
  src/reviewApi.ts \
  src/useResizeEngine.ts
git diff --check
git status --short --branch
```

- [x] Confirm no generated `dist/`, `test-results/`, screenshots, traces, or local visualizer artifacts are staged.
- [x] Perform a final cross-route manual matrix:

| Route | Widths | Appearance/states |
| --- | --- | --- |
| `/presume/` | 1120, 921, 920, 641, 640, 358 | Light, Dark, System; saved/unsaved |
| `/presume/editor/` | 1920, 1640, 1639, 960, 561, 560, 358 | Light/Dark; Fit open/closed; Review all states |
| `/presume/editor/` | representative desktop | reduced motion, keyboard only, 50% zoom, PDF export |

- [x] Verify the resume remains `816px` wide, horizontal overflow remains inside `.resume-canvas-scroll`, and exported PDFs are theme- and zoom-independent.
- [x] Obtain final independent re-review of the context-isolated review remediation. Exact head `b25e3ac6c081dc449ddb62d7e64541c1acf54796` passed with no Critical, Important, or Minor findings.
- [ ] PR E is #40. Merge only when the repository-required `verify` check and the recorded visual gate pass.

---

## Rollback Strategy

- Each phase is a separate PR and can be reverted independently in reverse order.
- Phase A owns the token/theme foundation. Reverting it after later phases requires reverting E → D → C → B first.
- The theme key is additive. Reverting Phase A may leave harmless `presume:theme` data in a user's LocalStorage; no migration or cleanup is required.
- No phase may require a resume-data rollback, schema migration, PDF rollback, or Review API rollback.
- If a phase exposes a document-geometry or export regression, stop the program, revert that phase, and diagnose it separately before continuing.

## Definition of Done

- [ ] All five PRs have merged sequentially from current `main`.
- [ ] Geist is locally bundled and used by every application surface; EB Garamond remains document-only.
- [ ] System, Light, and Dark behavior is complete, accessible, persisted, and applied before first paint.
- [ ] The production editor matches The Precision Workbench's palette, geometry, elevation, hierarchy, copy, and motion rules.
- [ ] The landing page and expanded Review report use the same coherent system without becoming card-heavy or generic.
- [ ] The fixed, theme-independent resume, resizing, PDF, JSON, LocalStorage, routing, Review semantics, and SPA fallback all remain intact.
- [ ] Legacy visual tokens/selectors are retired rather than preserved beside the new system.
- [ ] Automated verification, independent code review, and direct visual QA are recorded separately and accurately.
