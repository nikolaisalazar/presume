# PR #23 Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the four review findings on PR #23 without expanding the first shadcn migration beyond the landing page and its four primitives.

**Architecture:** Preserve the legacy responsive contracts with explicit Tailwind breakpoints, keep compact desktop controls while restoring the narrow-screen touch target, and adapt the generated React 19-style wrappers to the repository's React 18 runtime with `forwardRef`. Expose the existing primary-hover variable as a Tailwind semantic color and consume it from the default Button variant. Presume remains desktop-first: the laptop/desktop document workspace, fixed 816px resume canvas, editing density, and prominent resume preview are the primary experience.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, shadcn Base UI, Vitest, Testing Library, Playwright.

## Global Constraints

- Do not change editor or resume behavior, the resume JSON format, persistence, export, review states, or routing.
- Keep `src/styles/resume.css` untouched.
- Add regression coverage before production changes and observe each new test fail for the intended reason.
- Preserve one feature-card column through 640px, two columns from 641px through 920px, and four columns from 921px upward.
- Preserve a 32px default Button on desktop and a minimum 44px target at widths up to 640px.
- All primitive wrappers that advertise a DOM `ref` must resolve that ref under React 18.
- Treat narrow-screen behavior as graceful degradation and breakpoint resilience: navigation and controls remain usable, page-level overflow is prevented, and the fixed resume stays inside its designated horizontal scroller.
- Narrow-screen base CSS with `min-width` enhancements is an implementation technique for inclusive boundaries, not a mobile-first product-priority decision.

## Inclusive Breakpoint Correction

Tailwind v4 compiles arbitrary `max-[640px]` and `max-[920px]` variants as strict below-boundary queries (`not all and (min-width: ...)`). The selected correction uses narrow-resilience base styles and explicit `min-[641px]` and `min-[921px]` enhancements. This makes 640px and 920px inclusive without changing Presume's desktop-first hierarchy or expanding mobile scope.

---

### Task 1: Lock responsive landing contracts

**Files:**
- Modify: `e2e/unconfigured.spec.ts`
- Modify: `src/components/LandingPage.tsx`

**Interfaces:**
- Consumes: feature cards identified by `[data-slot="card"]` and the header action named `Open editor`.
- Produces: explicit layout contracts at 640px, 641px, 920px, and 921px plus a 44px narrow-screen header action.

- [x] Add Playwright assertions for header direction/action height, preview visibility, feature-grid columns, workflow orientation, overlap, and document overflow at 640px, 641px, 920px, and 921px while retaining the 358px and 1120px checks.
- [x] Run `npx playwright test -c playwright.unconfigured.config.ts -g "landing workflow"` and confirm failures for the 640px header/action/preview contract and the 920px workflow orientation.
- [x] Use narrow-resilience base styles with `min-[641px]` enhancements for landing spacing, header layout, action height, hero padding, and preview visibility; retain explicit `min-[641px]`/`min-[921px]` feature-grid thresholds.
- [x] Use a vertical workflow base layout with the horizontal workflow enabled at `min-[921px]`.
- [x] Rebuild and rerun the focused Playwright test; one test passes with the complete boundary contract.

### Task 2: Restore React 18 primitive ref contracts

**Files:**
- Create: `src/tests/uiPrimitives.test.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/separator.tsx`
- Modify: `src/components/ui/card.tsx`

**Interfaces:**
- Consumes: the current primitive exports and their existing public props.
- Produces: React 18-compatible `forwardRef` wrappers whose refs resolve to their rendered DOM elements; Badge passes the forwarded ref to `useRender`.

- [x] Add Testing Library tests using `React.createRef` for Button, Badge, Separator, Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, and CardFooter.
- [x] Run `NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/uiPrimitives.test.tsx` and confirm refs are null and React emits the expected function-component ref warning.
- [x] Convert each wrapper to `React.forwardRef`, preserve existing prop types and variants, pass Badge's ref through the `useRender` `ref` option, and set useful `displayName` values.
- [x] Rerun the focused primitive test and confirm all ref assertions pass without warnings.

### Task 3: Consume the semantic primary hover token

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/tests/uiPrimitives.test.tsx`

**Interfaces:**
- Consumes: the existing `--primary-hover` CSS variable.
- Produces: Tailwind color `primary-hover` and default Button class `hover:bg-primary-hover`.

- [x] Add a source contract assertion that the default Button variant includes `hover:bg-primary-hover`.
- [x] Run the focused primitive test and confirm the new assertion fails because the variant uses `hover:bg-primary/80`.
- [x] Map `--color-primary-hover` to `--primary-hover` in `@theme inline` and update the default Button variant.
- [x] Rerun the focused primitive test and confirm it passes.

### Task 4: Verify and update PR #23

**Files:**
- Modify: `docs/superpowers/plans/2026-07-09-pr23-review-remediation.md` only to mark completed steps if useful.

**Interfaces:**
- Consumes: all remediation changes.
- Produces: a clean, pushed PR branch ready for the review agent.

- [x] Run `NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run`; 161 tests pass across 13 files.
- [x] Run `npm run build`; TypeScript and the production Vite build pass.
- [x] Run `npm run test:e2e`; all 7 configured and unconfigured browser tests pass.
- [x] Verify `dist/index.html` and `dist/404.html` are byte-identical, protected files have no diff from `origin/main`, and `git diff --check` passes. The recurring Playwright `test-results/` directory is ignored and excluded from staging.
- [x] Obtain a no-actionable-findings remediation review authorizing commit and push. Git history and PR #23 record execution of those release actions.

## Manual QA Status

Status: automated exact-width QA is complete. Visual QA is complete in cmux at the nearest controllable CSS viewport widths; the embedded browser exposed no exact viewport control, so exact-width visual confirmation remains pending for the review agent or user before merge. At the time this QA evidence was recorded, no commit or push had occurred.

Exact automated landing checks:

- [x] `/presume/` at 1120px: horizontal workflow and desktop ordering
- [x] `/presume/` at 921px: four feature columns, horizontal workflow, two-column hero, visible in-bounds preview with no overlap
- [x] `/presume/` at 920px: two feature columns, vertical workflow, no page-level overflow
- [x] `/presume/` at 641px: row header, 32px header action, visible preview, two feature columns
- [x] `/presume/` at 640px: stacked header, 44px header action, hidden preview, one feature column, no page-level overflow
- [x] `/presume/` at 358px: usable navigation, hidden preview, one feature column, no page-level overflow

cmux visual observations:

- [x] Desktop landing at 1149px: document preview remains the primary visual anchor; hierarchy and density remain document-adjacent.
- [x] Above the desktop transition at 933px: hero and preview remain viable without overlap; four feature columns and horizontal workflow remain coherent.
- [x] Below the workflow transition at 878px: vertical rail has clear spacing, aligned markers, and no awkward wrapping.
- [x] Around the 641px transition at 649px and 622px: row-to-stacked navigation, preview visibility, and spacing adapt cleanly.
- [x] Narrow landing at 355px: navigation is stacked and usable, the action is prominent, decorative preview is absent, and no clipping is visible.

Editor spot checks:

- [x] `/presume/editor/` visually at 996px and automatically at 960px: command deck, fixed canvas, and desktop density remain intact.
- [x] `/presume/editor/` visually at 355px and automatically at 358px: document width is 355px, resume width remains 816px, scroller client/scroll widths are 300px/836px, and horizontal overflow is contained by `overflow-x: auto`.
- [x] Header action navigation opens `/presume/editor/`; browser back returns to `/presume/`.
- [ ] Exact-width manual visual confirmation at 1120/921/920/641/640/358px in a browser with viewport controls.

The latest remediation review reported no actionable findings and authorized commit and push. Exact-width manual visual confirmation remains a pre-merge release gate.
