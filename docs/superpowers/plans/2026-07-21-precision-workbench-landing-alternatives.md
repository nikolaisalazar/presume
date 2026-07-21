# Precision Workbench Landing Alternatives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three equally complete browser-rendered Phase D landing alternatives, select one with the user, consolidate it into the sole production `/presume/` page, and open PR D after the full release and review gates.

**Architecture:** Keep routing and editor behavior in `App.tsx` unchanged. `LandingPage.tsx` temporarily maps a comparison-only `?concept=` value to one of three composition components, all of which consume the same typed copy, shared functional sections, saved-state action helper, and real Pretext Fit Lab. After selection, delete the comparison router and unselected compositions so the final tree exposes one landing page only.

**Tech Stack:** Vite 6, React 18, TypeScript 5.7, Tailwind CSS 4, shadcn 4/Base UI, `@chenglou/pretext`, Phosphor React, Vitest/Testing Library, Playwright.

## Global Constraints

- `PRODUCT.md` is product authority, root `DESIGN.md` is visual authority, and `docs/superpowers/specs/2026-07-21-precision-workbench-landing-design.md` is the approved Phase D design.
- No literal resume, resume thumbnail, or resume skeleton may appear anywhere on the landing page.
- Keep the product-to-provenance balance approximately `70/30` in all three alternatives.
- Use Phosphor `PenNib` with `weight="regular"` inside the existing deep-Verdigris brand field.
- Use Geist only for application text. Do not introduce a monospace or serif landing voice.
- Use `2px` structural corners, `4px` controls, opaque semantic surfaces, no glass, and less than roughly ten percent Verdigris.
- Preserve exactly three editor actions and the specified saved/unsaved wording.
- Preserve route behavior, browser Back, theme persistence, saved-resume behavior, editor/Review/Fit behavior, and every resume/PDF/export/storage/API/resize contract.
- Through `640px`: stacked masthead, at least `44px` masthead action, hidden hero mechanics, one ledger column, vertical workflow, no overflow.
- From `641px–920px`: horizontal masthead, exactly `36px` masthead action, visible stacked hero mechanics, two ledger columns, vertical workflow.
- At `921px+`: two-column hero, four ledger columns, horizontal workflow, no overlap.
- The Fit Lab uses `180px`, `240px`, and `300px`, initially `240px`, with a two-line target.
- Ordinary motion stays within `150–250ms`; reduced motion renders completed/static states.
- Add no visual snapshots. Automated tests protect behavior and geometry; direct browser QA decides visual quality.
- Unselected concepts and all comparison-only routing/tests must be removed before PR D.
- Do not modify `src/styles/resume.css`, `src/types.ts`, `src/storage.ts`, `src/export.ts`, `src/pdf/**`, `src/reviewApi.ts`, or `src/useResizeEngine.ts`.

## Locked Content

The alternatives may change section order and composition, but they use the following complete production copy.

### Hero copy

| Concept | Eyebrow | H1 | Supporting copy |
| --- | --- | --- | --- |
| Instrumented Workbench | `A local-first resume workbench` | `Write against the constraints that shape the final page.` | `Presume keeps direct editing, fit guidance, optional review, and stable export on one precise surface—without an account.` |
| Open Technical Manual | `Presume · System overview` | `A resume workbench, documented from the inside out.` | `Edit the final document directly, measure its fit while you write, request advisory evidence when configured, and export from the same controlled surface.` |
| Interactive Project Exhibit | `An open technical project you can use` | `The mechanics behind a finished document, made visible.` | `Presume turns text measurement, direct editing, optional review, and deterministic export into one local-first resume workflow.` |

Every hero includes `No account required` and `Stored locally in your browser` beside the primary action.

### Precision Ledger

| Capability | Copy |
| --- | --- |
| `Edit directly` | `Work on the document itself instead of translating your history through a separate form.` |
| `Fit continuously` | `Keep page count, bullet wrapping, and minimum type size visible while the content changes.` |
| `Review without rewriting` | `When configured, request advisory evidence that never edits or replaces your words.` |
| `Export predictably` | `Produce a stable Letter PDF and a portable JSON backup from the same source.` |

### Workflow

| Stage | Copy |
| --- | --- |
| `Write` | `Edit names, dates, sections, and bullets directly on the document.` |
| `Measure` | `Pretext-powered fit checks expose wrapping and page pressure while you work.` |
| `Review` | `Optionally run the configured Hiring Agent boundary and inspect evidence without mutation.` |
| `Export` | `Create the PDF or carry the resume data forward as JSON.` |

### Provenance

**Pretext**

Heading: `Measured with Pretext`

Copy: `Presume uses Cheng Lou's open-source text layout engine to measure multiline wrapping without treating browser layout as a guess. The Fit Lab below exposes the same line-statistics family used by the editor's fit system.`

Link: `Explore Pretext` → `https://github.com/chenglou/pretext`

**Hiring Agent**

Heading: `Reviewed through an open boundary`

Copy: `Presume's optional Review workflow adapts HackerRank's open-source Hiring Agent behind a normalized service boundary. It returns category scores and evidence for the user to assess; Presume does not present it as an ATS or let it rewrite the resume.`

Link: `Explore Hiring Agent` → `https://github.com/interviewstreet/hiring-agent`

### Privacy and final action

Heading: `A complete resume workbench, ready when you are.`

Copy: `Resume data stays in this browser unless you explicitly request a configured Review. JSON export gives you a backup you control.`

---

### Task 1: Establish the shared PenNib brand primitive

**Files:**
- Create: `src/components/BrandMark.tsx`
- Modify: `src/components/AppHeader.tsx`
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/styles/app.css`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `src/tests/appIntegration.test.tsx`

**Interfaces:**
- Produces: `BrandMark(): JSX.Element`, a decorative PenNib inside the existing `.app-header__brand-mark` field.
- Preserves: both masthead links remain named `Presume home`.

- [ ] **Step 1: Write the failing brand test**

In the existing landing and editor integration tests, assert each `.app-header__brand-mark` contains one SVG and does not expose the text node `P`:

```ts
const brandMark = container.querySelector('.app-header__brand-mark')
expect(brandMark?.querySelector('svg')).toBeInTheDocument()
expect(brandMark).not.toHaveTextContent('P')
expect(screen.getByRole('link', { name: 'Presume home' })).toBeInTheDocument()
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-phase-d-brand npm test -- --run src/tests/appIntegration.test.tsx
```

Expected: FAIL because the existing field contains `P` and no SVG.

- [ ] **Step 3: Install the official icon package**

Run:

```sh
npm install @phosphor-icons/react
```

- [ ] **Step 4: Implement `BrandMark` and replace both text marks**

```tsx
import { PenNib } from '@phosphor-icons/react'

export function BrandMark() {
  return (
    <span className="app-header__brand-mark" aria-hidden="true">
      <PenNib weight="regular" />
    </span>
  )
}
```

Use `<BrandMark />` in `AppHeader` and the temporary landing masthead. Keep the current link names and callbacks.

- [ ] **Step 5: Verify GREEN**

Run the focused integration test and `npm run typecheck`. Expected: PASS.

- [ ] **Step 6: Commit**

```sh
git add package.json package-lock.json src/components/BrandMark.tsx src/components/AppHeader.tsx src/components/LandingPage.tsx src/styles/app.css src/tests/appIntegration.test.tsx
git commit -m "feat: add shared PenNib brand mark"
```

### Task 2: Build the isolated Pretext Fit Lab

**Files:**
- Create: `src/components/landing/FitLab.tsx`
- Create: `src/components/landing/fitLabMeasurement.ts`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/tests/fitLab.test.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces: `FitLab()` with an `aria-labelledby` region, labeled Textarea, `Measurement width` ToggleGroup, and a polite result status.
- Produces: `prepareFitLabText(text: string): PreparedTextWithSegments` and `measurePreparedFitLab(prepared: PreparedTextWithSegments, width: FitLabWidth): FitLabMeasurement` so width-only changes reuse the prepared text.

```ts
export type FitLabWidth = 180 | 240 | 300
export type FitLabMeasurement = {
  lineCount: number
  maxLineWidth: number
  targetLines: 2
  status: 'within' | 'over'
}
```

- [ ] **Step 1: Add the official shadcn/Base UI Textarea source**

Run:

```sh
npx shadcn@latest add textarea
```

Read the generated file completely and retain semantic tokens, `4px` control geometry, visible focus, and disabled styling.

- [ ] **Step 2: Write failing measurement and interaction tests**

Cover:

```tsx
expect(screen.getByRole('region', { name: 'Pretext Fit Lab' })).toBeInTheDocument()
expect(screen.getByRole('textbox', { name: 'Text to measure' })).toHaveValue(
  'A precise tool should make invisible constraints visible before they become surprises.'
)
expect(screen.getByRole('group', { name: 'Measurement width' })).toBeInTheDocument()
expect(screen.getByRole('button', { name: '240px' })).toHaveAttribute('aria-pressed', 'true')
expect(screen.getByText(/2 line target/)).toBeInTheDocument()
```

Change the text and width and assert the reported line count or widest line changes. Mock `measureLineStats` to throw once and assert `Measurement unavailable` while the textbox remains editable.

- [ ] **Step 3: Verify RED**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-phase-d-fitlab npm test -- --run src/tests/fitLab.test.tsx
```

Expected: FAIL because Fit Lab modules do not exist.

- [ ] **Step 4: Implement measurement and UI**

Use `useMemo(() => prepareFitLabText(text), [text])` so `prepareWithSegments(text, '14px Geist')` runs only when text changes. Use a second memo for `measurePreparedFitLab(prepared, width)`, round `maxLineWidth` for display, compare `lineCount <= 2`, await `document.fonts?.ready ?? Promise.resolve()` before enabling output, and catch measurement failures into the explicit unavailable state without touching resume data.

- [ ] **Step 5: Verify GREEN and refactor**

Run the focused test and typecheck. Keep measurement logic outside the component and remove duplicated status derivation.

- [ ] **Step 6: Commit**

```sh
git add src/components/landing/FitLab.tsx src/components/landing/fitLabMeasurement.ts src/components/ui/textarea.tsx src/tests/fitLab.test.tsx src/styles/app.css
git commit -m "feat: add interactive Pretext Fit Lab"
```

### Task 3: Establish shared landing content and the comparison router

**Files:**
- Create: `src/components/landing/landingContent.ts`
- Create: `src/components/landing/LandingShared.tsx`
- Create: `src/components/landing/InstrumentedWorkbenchLanding.tsx`
- Create: `src/components/landing/OpenTechnicalManualLanding.tsx`
- Create: `src/components/landing/InteractiveProjectExhibitLanding.tsx`
- Create: `src/tests/landingConcepts.test.tsx`
- Modify: `src/components/LandingPage.tsx`

**Interfaces:**

```ts
export type LandingConcept = 'workbench' | 'manual' | 'exhibit'
export type LandingCompositionProps = {
  hasSavedResume: boolean
  onOpenEditor: () => void
}
export function getLandingConcept(search: string): LandingConcept
```

Shared exports include `LandingHeader`, `HeroMechanics`, `PrecisionLedger`, `Workflow`, `Provenance`, and `LandingFinalAction`. Composition components own section order, wrappers, headings, and spatial hierarchy.

- [ ] **Step 1: Write failing comparison-contract tests**

For each query value, render `App` at `/presume/?concept=<value>` and assert:

- its exact H1 from the Locked Content table;
- exactly three editor `Button` elements outside the appearance ToggleGroup;
- exactly four `Card` roots in the Precision Ledger;
- four workflow list items;
- one `figure[data-slot="hero-mechanics"]`;
- one Fit Lab;
- primary links to `https://github.com/chenglou/pretext` and `https://github.com/interviewstreet/hiring-agent`;
- no `Presume editor preview`, resume headings, `.resume-page`, or resume skeleton;
- saved state produces three `Continue editing` actions.

- [ ] **Step 2: Verify RED**

Run the new test. Expected: FAIL on missing concept selection, four-stage workflow, Fit Lab, and provenance.

- [ ] **Step 3: Implement shared content and comparison selection**

`getLandingConcept()` accepts only the three explicit values and falls back to `workbench`. It reads `window.location.search` without writing history or storage. Build all shared semantic sections with the approved primitives and complete copy.

- [ ] **Step 4: Add structural CSS hooks**

Use a `landing-*` BEM-like namespace in `app.css` for the landing shell, masthead, mechanics figure, ledger, workflow, Fit Lab, provenance, and final action. Avoid component-level raw colors and radii.

- [ ] **Step 5: Verify GREEN**

Run `landingConcepts.test.tsx`, `fitLab.test.tsx`, `appIntegration.test.tsx`, and typecheck.

- [ ] **Step 6: Commit**

```sh
git add src/components/LandingPage.tsx src/components/landing src/tests/landingConcepts.test.tsx src/styles/app.css
git commit -m "feat: add Phase D landing comparison framework"
```

### Task 4: Complete Alternative A — Instrumented Workbench

**Files:**
- Modify: `src/components/landing/InstrumentedWorkbenchLanding.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/landingConcepts.test.tsx`

- [ ] **Step 1: Add failing A-specific structure assertions**

Assert the section order is hero → ledger → workflow → Fit Lab → provenance → final action, the H1 is product-led, and the mechanics figure is the hero's second direct child.

- [ ] **Step 2: Verify RED**

Run the concept test and confirm the structure assertions fail.

- [ ] **Step 3: Implement the complete A composition**

Use an asymmetric `921px+` hero, an immediately adjacent joined ledger, a quiet process rail, and the Fit Lab as the strongest secondary shell. Use numeric labels and measurement rules without monospace type.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and typecheck, then commit as `feat: build instrumented workbench landing concept`.

### Task 5: Complete Alternative B — Open Technical Manual

**Files:**
- Modify: `src/components/landing/OpenTechnicalManualLanding.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/landingConcepts.test.tsx`

- [ ] **Step 1: Add failing B-specific structure assertions**

Assert chapter labels, specification-style ledger semantics, worked-example Fit Lab placement, numbered procedure workflow, and source-note provenance.

- [ ] **Step 2: Verify RED**

Run the concept test and confirm failure on missing manual structure.

- [ ] **Step 3: Implement the complete B composition**

Create editorial hierarchy through rules, numbering, tabular numerals, and alignment only. Keep the primary editor action visible in the first viewport and retain the same shared content depth and interactions as A.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and typecheck, then commit as `feat: build open technical manual landing concept`.

### Task 6: Complete Alternative C — Interactive Project Exhibit

**Files:**
- Modify: `src/components/landing/InteractiveProjectExhibitLanding.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/landingConcepts.test.tsx`

- [ ] **Step 1: Add failing C-specific structure assertions**

Assert an accessible system-flow figure, early Fit Lab placement, provenance inputs feeding a Presume-owned boundary, and a final workflow that returns the story to the user task.

- [ ] **Step 2: Verify RED**

Run the concept test and confirm failure on missing exhibit structure.

- [ ] **Step 3: Implement the complete C composition**

Keep measurement as the largest, highest-contrast object in the hero flow. Show Pretext and Hiring Agent as upstream inputs using text and rules, never partner logos. Preserve the four joined ledger cards and exact responsive contracts.

- [ ] **Step 4: Verify GREEN and commit**

Run focused tests and typecheck, then commit as `feat: build interactive project exhibit landing concept`.

### Task 7: Compare all three alternatives in the browser

**Files:**
- Modify only to correct concrete defects found during comparison.

- [ ] **Step 1: Run the comparison test gate**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-phase-d-concepts npm test -- --run src/tests/landingConcepts.test.tsx src/tests/fitLab.test.tsx src/tests/appIntegration.test.tsx
npm run typecheck
npm run build
```

- [ ] **Step 2: Start the local production preview**

Serve the built app and open the three complete query URLs in the browser.

- [ ] **Step 3: Inspect every alternative equally**

For each concept, inspect Light and Dark at `1120px`, `921px`, `640px`, and `358px`, plus reduced motion and keyboard focus. Check exact copy depth, section completeness, Fit Lab behavior, CTA states, overflow, mechanics containment, Verdigris restraint, and lack of resume imagery.

- [ ] **Step 4: Present the live alternatives to the user**

Stop implementation at the selection gate. Record whether the user chooses A, B, C, or a precise combination.

### Task 8: Consolidate the selected production direction

**Files:**
- Modify: `src/components/LandingPage.tsx`
- Modify selected files under: `src/components/landing/`
- Delete: two unselected composition files
- Delete: `src/tests/landingConcepts.test.tsx`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write failing final landing contract assertions**

Update conservative integration assertions for selected headings, three action labels in saved/unsaved states, four Card roots, Badge, Separator, PenNib, Fit Lab, provenance links, and absence of a resume preview.

- [ ] **Step 2: Remove the comparison router and unselected concepts**

`LandingPage` renders the selected composition directly. Remove all `concept` parsing, comparison-only selectors, unreachable CSS, and temporary tests.

- [ ] **Step 3: Verify the focused production tests**

Run app integration, Fit Lab, theme, and typecheck. Commit as `feat: apply Precision Workbench landing identity`.

### Task 9: Protect final responsive and navigation contracts

**Files:**
- Modify: `e2e/unconfigured.spec.ts`
- Modify: `src/tests/appIntegration.test.tsx`

- [ ] **Step 1: Update E2E assertions before production CSS changes**

Protect exact `640/641` and `920/921` boundaries, four workflow stages, mechanics `figure` visibility, `44px`/`36px` masthead action sizing, one/two/four ledger columns, no overlap, no overflow, theme persistence into editor, browser Back, and same warm-white mechanics surface in Light/Dark.

- [ ] **Step 2: Verify RED against any remaining outdated geometry**

Run the unconfigured E2E test and confirm it fails for the intentional changed contracts, including the old `32px` masthead action and three-stage workflow.

- [ ] **Step 3: Make the minimal final CSS/markup corrections**

Fix only evidenced contract gaps and keep the selected visual direction intact.

- [ ] **Step 4: Verify GREEN and commit**

Run unconfigured E2E and focused integration tests. Commit as `test: preserve landing responsive boundaries`.

### Task 10: Release gate, independent review, and PR D

**Files:**
- Modify only for concrete test, QA, or review findings.

- [ ] **Step 1: Run the complete release gate**

Use Python 3.13 in the isolated worktree environment, then run the exact gate from the design specification, including verify, build, both E2E configurations, SPA fallback comparison, protected-file diff, `git diff --check`, and status.

- [ ] **Step 2: Perform the exact final visual matrix**

Inspect `/presume/` in Light and Dark at `1120`, `921`, `920`, `641`, `640`, and `358`, including saved/unsaved, keyboard, reduced motion, Fit Lab, theme persistence, editor navigation, and browser Back.

- [ ] **Step 3: Request independent rigorous review**

Review the complete branch diff from `ddaa03b` to HEAD. Resolve and re-review every Critical or Important finding.

- [ ] **Step 4: Re-run fresh verification after fixes**

No completion or PR claim is allowed without fresh passing output.

- [ ] **Step 5: Push and open PR D**

Push `feat/precision-workbench-landing`, open the pull request against `main`, include automated verification, direct visual QA, and independent review as separate evidence, and preserve the worktree for review iteration.
