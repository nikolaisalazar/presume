# Resume Zoom-Geometry Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the resume's canonical Letter-page proportions, typography, wrapping, and global scale when Safari/WebKit browser zoom decreases from 100% through 50%.

**Architecture:** Add a document-specific `ResumeViewport` around the existing `ResumePage`. The page lays out at a constant 2.25× CSS zoom and is presented through an exact inverse transform, while the viewport exposes only the canonical 816px width and complete canonical height to the canvas scroller. The existing page ref remains attached to `ResumePage`, so Fit Constraints, PDF export, and Review keep their current interfaces.

**Tech Stack:** Vite, React 18, TypeScript, CSS, Vitest, Playwright, html2canvas, jsPDF, cmux WebKit browser.

## Global Constraints

- The current 100% browser-zoom resume composition is authoritative.
- Browser zoom may change apparent size but must not change resume proportions, wrapping, page count, or selected `--global-scale`.
- Use a constant 2.25× internal layout scale and its exact inverse presentation scale; do not detect browser zoom, device-pixel ratio, or user agent.
- Preserve direct inline editing, Pretext/global resizing, PDF export, Review capture, JSON import/export, LocalStorage, routing, and the fixed-width narrow-screen scroller.
- Treat 816×1056px as one Letter-page unit; do not clip legitimate multi-page content.
- Do not change resume data schemas, constraint bounds, typography, margins, colors, or editor-shell composition.
- Do not add dependencies, visual snapshots, or a repetitive browser-test matrix.
- Keep export source unchanged unless direct canonical PDF verification demonstrates a concrete capture defect.

---

## File Structure

- Create `src/components/ResumeViewport.tsx`: own the canonical viewport height and observe the transformed page's complete visual geometry.
- Modify `src/App.tsx`: compose `ResumeViewport` around the existing `ResumePage` while leaving `pageRef` on `ResumePage`.
- Modify `src/styles/resume.css`: define the 2.25× internal scale, inverse presentation scale, fixed viewport geometry, and transformed page layer.
- Modify `e2e/unconfigured.spec.ts`: extend the existing fixed-canvas contract to catch leaked internal dimensions, clipping, and narrow-screen regressions without adding another broad E2E case.
- Modify this plan: record completed commands and direct cmux QA evidence during execution.
- Modify `src/export.ts` and `src/tests/export.test.ts` only if Task 3 proves html2canvas does not capture canonical geometry.

---

### Task 1: Add a failing canonical viewport browser contract

**Files:**
- Modify: `e2e/unconfigured.spec.ts:258-330`

**Interfaces:**
- Consumes: existing `.resume-page`, `.resume-canvas-scroll`, and fixed-width browser contract.
- Produces: an E2E requirement for `.resume-viewport` with canonical visible geometry and complete-height synchronization.

- [ ] **Step 1: Extend the existing narrow-canvas metrics with the viewport contract**

Inside `keeps viewport overflow inside the fixed resume canvas scroller at narrow widths`, add the viewport lookup and metrics to the existing `page.evaluate` block:

```ts
const viewport = document.querySelector('.resume-viewport') as HTMLElement
const viewportRect = viewport.getBoundingClientRect()
const resumeRect = resume.getBoundingClientRect()

return {
  // Preserve every existing metric.
  viewportWidth: Math.round(viewportRect.width),
  viewportHeight: Math.round(viewportRect.height),
  resumeHeight: Math.round(resumeRect.height),
}
```

Add these assertions inside the existing width loop:

```ts
expect(metrics.viewportWidth, `resume viewport width at ${width}px`).toBe(816)
expect(metrics.viewportHeight, `resume viewport height at ${width}px`).toBe(
  metrics.resumeHeight
)
expect(metrics.scrollerScrollWidth, `internal scale leak at ${width}px`).toBeLessThan(1000)
```

After the existing width loop, add a complete-height synchronization check without creating a second test case:

```ts
await page.setViewportSize({ width: 960, height: 1100 })
await page.goto('./editor/')

const viewport = page.locator('.resume-viewport')
const resume = page.locator('.resume-page')
await resume.evaluate(element => {
  element.style.minHeight = '1400px'
})

await expect.poll(async () =>
  Math.round(await viewport.evaluate(element => element.getBoundingClientRect().height))
).toBe(1400)
```

This deliberate height change exercises the geometry observer. It does not claim to simulate browser zoom.

- [ ] **Step 2: Build and run the focused E2E test to verify it fails**

Run:

```sh
npm run build
CI=1 npx playwright test -c playwright.unconfigured.config.ts --grep "keeps viewport overflow inside the fixed resume canvas scroller"
```

Expected: FAIL because `.resume-viewport` does not exist on the baseline branch.

- [ ] **Step 3: Confirm the failure is specific**

The failure must identify the missing viewport lookup or viewport geometry. If it fails because the preview server cannot bind, rerun with the established localhost permission rather than changing the test.

---

### Task 2: Implement the canonical high-resolution presentation boundary

**Files:**
- Create: `src/components/ResumeViewport.tsx`
- Modify: `src/App.tsx:1-10,127-138`
- Modify: `src/styles/resume.css:1-35`
- Test: `e2e/unconfigured.spec.ts`

**Interfaces:**
- Consumes: `pageRef: React.RefObject<HTMLElement | null>` and a single `ReactNode` child containing `ResumePage`.
- Produces: `ResumeViewport`, a fixed-width document-specific wrapper that exposes the page's canonical complete height.
- Preserves: the existing `pageRef` target and every public interface in `useResizeEngine`, `Toolbar`, `useResumeReview`, and `ResumePage`.

- [ ] **Step 1: Create `ResumeViewport`**

Create `src/components/ResumeViewport.tsx`:

```tsx
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'

const LETTER_PAGE_HEIGHT = 1056

interface ResumeViewportProps {
  pageRef: RefObject<HTMLElement | null>
  children: ReactNode
}

export function ResumeViewport({ pageRef, children }: ResumeViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const page = pageRef.current
    if (!viewport || !page) return

    const syncHeight = () => {
      const canonicalHeight = Math.max(
        LETTER_PAGE_HEIGHT,
        page.getBoundingClientRect().height
      )
      viewport.style.height = `${canonicalHeight}px`
    }

    syncHeight()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(syncHeight)
    observer.observe(page)
    return () => observer.disconnect()
  }, [pageRef])

  return (
    <div ref={viewportRef} className="resume-viewport">
      {children}
    </div>
  )
}
```

The `ResizeObserver` fallback keeps jsdom integration tests operational. It does not add browser-zoom detection.

- [ ] **Step 2: Compose the viewport without moving `pageRef`**

Import the component in `src/App.tsx`:

```tsx
import { ResumeViewport } from './components/ResumeViewport'
```

Replace only the current `ResumePage` block with:

```tsx
<ResumeViewport pageRef={pageRef}>
  <ResumePage
    ref={pageRef}
    resume={resume}
    onResumeChange={setResume}
    warnings={warnings}
    reviewAnnotations={reviewAnnotations}
  />
</ResumeViewport>
```

Do not attach `pageRef` to the viewport. The measured and exported element remains `.resume-page`.

- [ ] **Step 3: Add the canonical layer CSS**

Add the constants beside the existing page variables in `src/styles/resume.css`:

```css
--resume-layout-scale: 2.25;
--resume-presentation-scale: 0.4444444444444444;
```

Add the viewport and direct-child layer rules immediately before the existing `.resume-page` rule:

```css
.resume-viewport {
  position: relative;
  width: var(--page-width);
  min-height: var(--page-height);
  overflow: clip;
  background: white;
}

.resume-viewport > .resume-page {
  position: absolute;
  top: 0;
  left: 0;
  zoom: var(--resume-layout-scale);
  transform: scale(var(--resume-presentation-scale));
  transform-origin: top left;
}
```

Keep the existing `.resume-page` width, minimum height, padding, white background, font, box sizing, and overflow behavior unchanged. The more specific direct-child rule changes only positioning and presentation.

- [ ] **Step 4: Run the focused E2E test to verify it passes**

Run:

```sh
npm run build
CI=1 npx playwright test -c playwright.unconfigured.config.ts --grep "keeps viewport overflow inside the fixed resume canvas scroller"
```

Expected: PASS at every existing width, with an 816px viewport, no 2.25× scroll-width leak, and a 1400px synchronized deliberate height.

- [ ] **Step 5: Run the complete unit suite**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
```

Expected: all existing test files pass. No new unit test is required because the new behavior is browser layout geometry and the focused Playwright contract exercises it directly.

- [ ] **Step 6: Inspect the source diff**

Run:

```sh
git diff --check
git diff -- src/App.tsx src/components/ResumeViewport.tsx src/styles/resume.css e2e/unconfigured.spec.ts
```

Confirm that no browser-zoom detection, user-agent branching, resume typography changes, or unrelated shell edits entered the diff.

- [ ] **Step 7: Commit the presentation boundary**

```sh
git add src/App.tsx src/components/ResumeViewport.tsx src/styles/resume.css e2e/unconfigured.spec.ts
git commit -m "fix: stabilize resume geometry across browser zoom"
```

---

### Task 3: Verify editing, resize, and capture at native WebKit zoom

**Files:**
- Verify: `src/components/ResumeViewport.tsx`
- Verify: `src/styles/resume.css`
- Conditionally modify only on demonstrated failure: `src/export.ts`, `src/tests/export.test.ts`

**Interfaces:**
- Consumes: the running Issue #27 branch at `/presume/editor/` in cmux's WebKit browser.
- Produces: direct evidence that the canonical layer solves Safari zoom without breaking editing, Fit measurement, PDF export, or Review capture.

- [ ] **Step 1: Start or reuse the Issue #27 development server**

Run:

```sh
npm run dev -- --host 127.0.0.1 --port 5174
```

Open `http://127.0.0.1:5174/presume/editor/` in a new cmux browser tab. Confirm the tab is served from the Issue #27 worktree before evaluating it.

- [ ] **Step 2: Record the canonical 100% baseline**

At 100% native browser zoom, record `.resume-page` width and height, representative bullet computed font size, root `--global-scale`, representative wrapping, page count, and formatting-warning state.

Expected default geometry: 816px wide and 1056px high after fonts and resize calculation settle.

- [ ] **Step 3: Compare every supported native zoom level**

Use cmux browser zoom controls—not viewport resizing or injected CSS—at 90%, 80%, 70%, 60%, and 50%. At each level, reload once and confirm:

- canonical DOM width, height, representative type size, line wrapping, `--global-scale`, page count, and warnings match the 100% baseline;
- the application and surrounding editor shell change apparent size normally;
- the resume does not stretch or reformat.

If any canonical value diverges, stop execution and diagnose the presentation boundary before changing export code.

- [ ] **Step 4: Verify direct editing at 100% and 50%**

At both zoom levels, edit the name and a representative bullet, invoke one add and one remove control, and confirm caret placement, focus, control position, and intended state updates. Reset the sample resume before capture comparison.

- [ ] **Step 5: Compare PDF capture at 100% and 50%**

At each zoom level, export the unchanged default resume. Render or inspect both PDFs and compare Letter page size, page count, line breaks, content positions, hidden editor controls, and absence of clipping or enlarged internal dimensions.

Expected: both exports have the same canonical document composition. Byte identity is not required.

- [ ] **Step 6: Keep export unchanged on success; stop on failure**

If both PDFs are canonical, leave `src/export.ts` and `src/tests/export.test.ts` untouched.

If either PDF exposes enlarged or compounded geometry, do not improvise a workaround inside this task. Record the exact canvas/PDF dimensions and failure, return to systematic debugging, and amend this plan with tested `try/finally` capture normalization before modifying export source.

- [ ] **Step 7: Verify the narrow fixed-canvas contract**

At a 358px viewport with browser zoom reset to 100%, confirm `.resume-page` and `.resume-viewport` are both 816px wide, horizontal overflow remains inside `.resume-canvas-scroll`, no document-level horizontal overflow appears, and the complete default page remains visible vertically.

---

### Task 4: Run the release gate and record evidence

**Files:**
- Modify: `docs/superpowers/plans/2026-07-14-resume-zoom-geometry.md`

**Interfaces:**
- Consumes: the complete Issue #27 implementation and direct QA results.
- Produces: a clean, review-ready branch with an auditable verification record.

- [ ] **Step 1: Run the full unit suite**

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
```

Expected: all test files and tests pass. Record exact counts.

- [ ] **Step 2: Run the production build**

```sh
npm run build
```

Expected: TypeScript and Vite pass, and the SPA fallback script completes. Record module and bundle counts.

- [ ] **Step 3: Run complete E2E verification**

```sh
CI=1 npm run test:e2e
```

Expected: all unconfigured and configured-review tests pass. If localhost binding is blocked, rerun with the established managed permission; do not change application behavior or test configuration.

- [ ] **Step 4: Verify distribution output**

```sh
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
```

Expected: both files exist and are byte-identical.

- [ ] **Step 5: Verify protected files and repository hygiene**

```sh
git diff --exit-code 62cba76ca0a2f8d2cf469c0487a494ea5232e4f0...HEAD -- \
  src/types.ts \
  src/storage.ts \
  src/reviewApi.ts
git diff --check
git status --short --branch
```

Expected: protected files are unchanged, the diff is whitespace-clean, and only the plan's final verification record is uncommitted. `dist/`, `test-results/`, downloads, screenshots, traces, and generated PDFs must not be staged.

- [ ] **Step 6: Record exact results in this plan**

Append this section and replace each instruction after the colon with observed evidence:

```markdown
## Verification Record

- Implementation head: record the exact commit SHA
- Unit tests: record the exact files and tests passed
- E2E tests: record the exact unconfigured and configured counts
- Build: record the exact modules and bundle summary
- SPA fallback: `dist/index.html` and `dist/404.html` present and byte-identical
- Native cmux WebKit zoom: record the exact levels checked and outcome
- Direct editing: record the 100% and 50% outcome
- PDF comparison: record the 100% and 50% page-size, page-count, and composition outcome
- Narrow fixed canvas: record the 358px outcome
- Export normalization: state that it was not required, or link to the amended diagnostic task
- Generated artifacts: not staged
- Manual QA status: complete or accurately pending
```

Do not mark native zoom or visual QA complete based only on automated geometry.

- [ ] **Step 7: Commit the verification record**

```sh
git add docs/superpowers/plans/2026-07-14-resume-zoom-geometry.md
git commit -m "docs: record resume zoom verification"
```

- [ ] **Step 8: Confirm the final branch state**

```sh
git log --oneline --decorate -5
git status --short --branch
git diff --check 62cba76ca0a2f8d2cf469c0487a494ea5232e4f0...HEAD
```

Expected: the worktree is clean and the branch contains the design, implementation, and verification commits only.

---

## Review Handoff

Before opening or merging a PR, request a fresh rigorous review focused on:

- whether the 2.25×/inverse boundary is isolated and browser-zoom agnostic;
- synchronous resize-engine measurement versus asynchronous viewport-height synchronization;
- direct-editing coordinate alignment;
- multi-page visibility and PDF slicing;
- narrow-screen scroll containment;
- whether export remained unchanged or any demonstrated normalization restores state in `finally`;
- the accuracy of native cmux WebKit QA claims.
