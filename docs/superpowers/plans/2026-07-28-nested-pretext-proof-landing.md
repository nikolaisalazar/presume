# Nested Pretext Proof Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved interactive Pretext living-flow demonstration into the Measurement subsection of “Why Presume Exists,” remove the redundant standalone exhibit and Operating Sequence, and preserve accessible interaction across themes and responsive layouts.

**Architecture:** Reuse the existing `PretextLivingFlow` component and pure `layoutLivingFlow()` adapter. Convert `PretextLivingFlow` from a standalone labeled section into a subsection-owned interactive passage, then render it inside the existing Measurement chapter in `LandingPage`; landing-specific CSS owns the Nested Proof grid and responsive stacking. Keep pointer and keyboard positioning local to the component, and preserve a normal semantic paragraph as the fallback contract.

**Tech Stack:** React 18, TypeScript, `@chenglou/pretext` 0.0.5, CSS, Vitest, Testing Library, Playwright.

## Global Constraints

- Root `DESIGN.md` is visual authority; root `PRODUCT.md` is product authority.
- Preserve Precision Workbench, Document Anchor, Ten-Percent Verdigris, no glass, rectilinear 2px structural/4px control geometry, borders before shadows, and restraint over decoration.
- Preserve the Working Stack hero, its copy, assets, saved/unsaved behavior, and established `641/640` image-loading boundary.
- Preserve routing, saved-resume behavior and wording, theme persistence, editor/Review/Fit behavior, API/storage/export/PDF/resize contracts, and GitHub Pages SPA fallback.
- Do not modify `src/styles/resume.css`.
- Do not add diagnostics, width controls, a meter, shader, Canvas overlay, logo object, glow, badge, card, or ornamental motion.
- Use one continuous editable Pretext passage and the approved uniform two-band stair containing `Text responds to` / `its surroundings.`
- Keep pointer/touch drag, arrow-key movement, and `Shift` plus arrow-key movement.
- Add `Reset position` only after movement; reset is immediate and returns to the current responsive default.
- The draggable title is a native button, not a semantic heading.
- Preserve a normal semantic paragraph and show it when Pretext layout is unavailable.
- Desktop uses the two-column Nested Proof at `921px` and above; tablet and compact layouts stack in one reading order.
- Responsive variants preserve the same case-study content.
- No merge, deployment, branch deletion, worktree deletion, or other integration action without explicit approval for that exact action.
- Keep the parent thesis sticky only on sufficiently tall desktop viewports at
  `921px` and above; use native CSS positioning with no scroll listener or
  animation.
- Measurement and Advisory Review must share prose metrics, color, measure,
  inset, vertical rhythm, and destination-link baseline.
- Tighten the uniform two-band stair horizontally around its two text lines;
  preserve equal bands and the approved headline typography.

---

### Task 5: Refine the approved Nested Proof hierarchy and passage parity

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/components/landing/PretextLivingFlow.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `src/tests/pretextLivingFlow.test.tsx`
- Modify: `src/tests/themeContrast.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

- [ ] Add failing CSS-contract tests for the desktop sticky parent, short
  viewport opt-out, reduced subsection scale, shared muted prose treatment,
  content-derived stage, and tighter stair dimensions.
- [ ] Add a component assertion that fallback prose does not acquire private
  padding or a different class contract.
- [ ] Add browser assertions that Measurement and Advisory Review prose share
  computed font size, line height, color, and effective inline start at desktop;
  verify stickiness at a tall desktop viewport and normal flow at `920px`.
- [ ] Implement the shared passage tokens, native sticky parent, quiet
  subsection scale, aligned action rows, content-derived stage, and tighter
  uniform stair.
- [ ] Verify Light, Dark, and System; `921/920`, `641/640`, compact width, 200%
  zoom, keyboard/pointer interaction, edit/reset, and reduced-motion emulation.
- [ ] Request an independent read-only review before pushing the existing PR.

---

### Task 1: Subsection-owned Pretext interaction and recovery

**Files:**
- Modify: `src/components/landing/PretextLivingFlow.tsx`
- Modify: `src/tests/pretextLivingFlow.test.tsx`

**Interfaces:**
- Consumes: `layoutLivingFlow(input: LivingFlowLayoutInput): LivingFlowLine[]` from `src/components/landing/pretextLivingFlowLayout.ts`.
- Produces: `PretextLivingFlow`, an unlabeled subsection-owned passage with projected visual lines, semantic fallback, a native draggable title button, passage edit/view toggle, contextual reset action, and `onMovedChange`-free internal state.

- [ ] **Step 1: Replace standalone-section expectations with failing subsection-owned semantics tests**

Add tests that assert the component no longer creates its own `section`, kicker,
external link, or heading; that the visible title is a button; and that the
semantic passage remains available:

```tsx
render(<PretextLivingFlow />)

expect(screen.queryByText('A working example')).not.toBeInTheDocument()
expect(
  screen.queryByRole('link', { name: /Explore Pretext/i })
).not.toBeInTheDocument()
expect(
  screen.queryByRole('heading', {
    name: 'Text responds to its surroundings.',
  })
).not.toBeInTheDocument()

expect(
  screen.getByRole('button', {
    name: /Move “Text responds to its surroundings” by dragging or using the arrow keys/i,
  })
).toBeInTheDocument()
expect(
  screen.getByText(/Changing a sentence changes where every line ends/i)
).toBeInTheDocument()
```

- [ ] **Step 2: Add failing reset and keyboard-parity tests**

Exercise one arrow movement, assert that `Reset position` appears, activate it,
and assert that the original `data-position` is restored. Preserve the existing
fine and accelerated keyboard steps:

```tsx
const title = screen.getByRole('button', {
  name: /Move “Text responds to its surroundings”/i,
})
const initialPosition = title.getAttribute('data-position')

fireEvent.keyDown(title, { key: 'ArrowRight' })
expect(title).not.toHaveAttribute('data-position', initialPosition)
expect(
  screen.getByRole('button', { name: 'Reset position' })
).toBeInTheDocument()

fireEvent.click(screen.getByRole('button', { name: 'Reset position' }))
expect(title).toHaveAttribute('data-position', initialPosition)
expect(
  screen.queryByRole('button', { name: 'Reset position' })
).not.toBeInTheDocument()
```

Add a second assertion that `Shift + ArrowRight` moves farther than
`ArrowRight`.

- [ ] **Step 3: Run the focused component tests and confirm the new expectations fail**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlow.test.tsx
```

Expected: FAIL because the component still owns the standalone header/section,
uses a semantic heading around the title, has the old passage copy, and has no
reset action.

- [ ] **Step 4: Implement subsection-owned markup, approved copy, and contextual reset**

Use an outer `div` instead of `section`, remove the standalone header and link,
remove the wrapping heading, and store the responsive default point separately
from the current point:

```tsx
const INITIAL_PASSAGE =
  'Changing a sentence changes where every line ends, but browsers usually reveal those measurements only after the text appears. Pretext calculates multiline layout in JavaScript using the browser’s own font engine. It predicts line breaks and text height, then routes one continuous passage through changing geometry. Move the title through this passage to see each line find the available space again.'

const defaultPointRef = useRef<Point>({ x: 360, y: 64 })
const [hasMoved, setHasMoved] = useState(false)

const applyPoint = (point: Point) => {
  setHasMoved(true)
  setTitlePoint(clampPoint(point, stageSize, titleSize))
}
```

When the stage first measures or resizes, compute and store the approved
responsive default before clamping it:

```tsx
const defaultPoint = clampPoint(
  {
    x: nextStage.width >= 560 ? nextStage.width * 0.52 : nextStage.width * 0.16,
    y: nextStage.width >= 560 ? 64 : Math.max(160, nextStage.height * 0.46),
  },
  nextStage,
  nextTitle
)
defaultPointRef.current = defaultPoint
```

Render the controls in a subsection action group:

```tsx
<div className="pretext-living-flow__actions">
  <button type="button" onClick={() => setEditing(current => !current)}>
    {editing ? 'View flow' : 'Edit passage'}
  </button>
  {hasMoved ? (
    <button
      type="button"
      onClick={() => {
        setTitlePoint(defaultPointRef.current)
        setHasMoved(false)
      }}
    >
      Reset position
    </button>
  ) : null}
</div>
```

Keep pointer updates batched with `requestAnimationFrame`. Set `hasMoved` for
pointer and keyboard movement, but not during responsive clamping. Use this
accessible name on the stair button:

```tsx
aria-label='Move “Text responds to its surroundings” by dragging or using the arrow keys.'
```

- [ ] **Step 5: Preserve semantic fallback and remove the interaction when layout is unavailable**

When `projectedLines` is unavailable after font preparation, show the normal
paragraph and do not render the stair button. While fonts are still resolving,
keep the semantic paragraph available without announcing a false error:

```tsx
const layoutAvailable = projectedLines !== null

<p className={layoutAvailable ? 'sr-only' : 'pretext-living-flow__fallback'}>
  {passage}
</p>
{layoutAvailable ? (
  <>
    <div aria-hidden="true">{/* projected lines */}</div>
    <button className="pretext-living-flow__title" ... />
  </>
) : null}
```

- [ ] **Step 6: Run the component tests and confirm they pass**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlow.test.tsx src/tests/pretextLivingFlowLayout.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the interaction change**

```bash
git add src/components/landing/PretextLivingFlow.tsx src/tests/pretextLivingFlow.test.tsx
git commit -m "refactor: prepare Pretext proof for nested landing section"
```

---

### Task 2: Integrate the proof into “Why Presume Exists”

**Files:**
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/tests/appIntegration.test.tsx`

**Interfaces:**
- Consumes: `PretextLivingFlow` from Task 1.
- Produces: one `landing-origins` parent section containing Measurement with the interactive proof and Advisory Review as its second subsection; no standalone `landing-fit-study` and no `landing-workflow`.

- [ ] **Step 1: Add failing landing-structure tests**

Render `LandingPage` and assert that the case-study content is nested under the
single parent section while the standalone and redundant sections are absent:

```tsx
render(<LandingPage hasSavedResume={false} onOpenEditor={vi.fn()} />)

const origins = screen
  .getByRole('heading', { name: 'The document came first.' })
  .closest('section')

expect(origins).toContainElement(
  screen.getByRole('heading', { name: 'Pretext made fit observable.' })
)
expect(origins).toContainElement(
  screen.getByRole('button', {
    name: /Move “Text responds to its surroundings”/i,
  })
)
expect(origins).toContainElement(
  screen.getByRole('heading', {
    name: 'Hiring Agent made the review boundary tangible.',
  })
)
expect(screen.queryByText('A working example')).not.toBeInTheDocument()
expect(screen.queryByText('Operating sequence')).not.toBeInTheDocument()
expect(screen.queryByText('Write → Measure → Review → Export')).not.toBeInTheDocument()
```

Keep the existing assertions for hero copy, saved/unsaved editor-action wording,
theme control, capability content, and final editor action.

- [ ] **Step 2: Run the integration test and verify it fails for the old page structure**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/appIntegration.test.tsx
```

Expected: FAIL because `PretextLivingFlow` remains in `landing-fit-study` and
Operating Sequence still renders.

- [ ] **Step 3: Move `PretextLivingFlow` into Measurement and add closing actions**

Replace the Measurement paragraph with the component and preserve descriptive
destination links at the subsection boundary:

```tsx
<section className="landing-origins__chapter landing-origins__chapter--measurement">
  <header className="landing-origins__chapter-heading">
    <span>01 / Measurement</span>
    <h3>Pretext made fit observable.</h3>
  </header>
  <PretextLivingFlow />
  <footer className="landing-origins__chapter-footer">
    <a href="https://github.com/chenglou/pretext">
      Explore Pretext<span aria-hidden="true"> ↗</span>
    </a>
  </footer>
</section>
```

Give Advisory Review the same heading and footer structure:

```tsx
<section className="landing-origins__chapter">
  <header className="landing-origins__chapter-heading">
    <span>02 / Advisory review</span>
    <h3>Hiring Agent made the review boundary tangible.</h3>
  </header>
  <p>...</p>
  <footer className="landing-origins__chapter-footer">
    <a href="https://github.com/interviewstreet/hiring-agent">
      Explore Hiring Agent<span aria-hidden="true"> ↗</span>
    </a>
  </footer>
</section>
```

Delete the standalone `landing-fit-study` markup, the `WORKFLOW` constant, and
the complete `landing-workflow` section. Preserve the capability register and
all editor actions unchanged.

- [ ] **Step 4: Run the integration test and confirm it passes**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/appIntegration.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the landing structure**

```bash
git add src/components/LandingPage.tsx src/tests/appIntegration.test.tsx
git commit -m "feat: nest Pretext proof in landing origins"
```

---

### Task 3: Implement the approved responsive and theme treatment

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `src/tests/themeContrast.test.ts`
- Modify: `src/tests/pretextLivingFlow.test.tsx`

**Interfaces:**
- Consumes: the `landing-origins__chapter*` structure from Task 2 and existing semantic theme tokens.
- Produces: the approved two-column desktop Nested Proof, stacked tablet/compact layouts, balanced stair geometry, compact touch targets, visible Light/Dark focus, and content-sized Measurement rhythm.

- [ ] **Step 1: Add failing CSS-contract tests for Nested Proof structure**

In `responsiveLayout.test.ts`, read `src/styles/app.css` and assert:

```ts
expect(css).toMatch(
  /\.landing-origins\s*\{[^}]*grid-template-columns:\s*minmax\([^;]+1fr/
)
expect(css).toMatch(
  /@media \(max-width:\s*920px\)[\s\S]*\.landing-origins\s*\{[^}]*grid-template-columns:\s*1fr/
)
expect(css).toMatch(
  /@media \(max-width:\s*640px\)[\s\S]*\.pretext-living-flow__title\s*\{[^}]*min-height:\s*44px/
)
expect(css).not.toContain('.landing-fit-study')
expect(css).not.toContain('.landing-workflow')
```

Also assert that subsection headings, prose, and footers use the new class
names, and that compact layout does not introduce fixed page width or horizontal
overflow.

- [ ] **Step 2: Add failing theme/focus and no-motion contract tests**

In `themeContrast.test.ts` and `pretextLivingFlow.test.tsx`, assert that the
stair uses semantic background/foreground/primary tokens, keeps the existing
two-pixel focus-visible outline, and does not add a transition or animation:

```ts
expect(css).toMatch(
  /\.pretext-living-flow__title-shape polygon\s*\{[^}]*fill:\s*var\(--background\)[^}]*stroke:\s*var\(--primary\)/
)
expect(css).toMatch(
  /\.pretext-living-flow__title:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--ring\)/
)
expect(titleRule).not.toMatch(/transition|animation/)
```

- [ ] **Step 3: Run focused CSS and component tests and verify they fail**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts src/tests/pretextLivingFlow.test.tsx
```

Expected: FAIL because the stylesheet still contains the standalone section,
uses the old origins chapter structure, and lacks contextual action/reset and
new compact rules.

- [ ] **Step 4: Replace standalone exhibit CSS with Nested Proof CSS**

Implement:

- desktop `landing-origins` columns matching the approved parent/right-column
  relationship;
- `landing-origins__chapters` top rule;
- consistent `landing-origins__chapter-heading`,
  `landing-origins__chapter-footer`, heading scale, prose measure, and link
  treatment;
- `pretext-living-flow` as a transparent subsection-owned block;
- a content-sized stage using a responsive `min-height` derived from the
  approved passage and stair geometry, without the former oversized blank
  field;
- a balanced title around `280 × 74` design units on desktop, scaled down at
  compact widths while retaining equal stair bands;
- unobtrusive edit/reset actions with a 44px compact hit area;
- two-column layout from `921px`, one-column layout through `920px`;
- compact one-column reading order at `640px` and below.

Keep the existing token-based shape:

```css
.pretext-living-flow__title-shape polygon {
  fill: var(--background);
  stroke: var(--primary);
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
}

.pretext-living-flow__title:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
  box-shadow: 0 0 0 2px var(--focus-contrast);
}
```

Do not add transitions to pointer movement or reset.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlowLayout.test.ts src/tests/pretextLivingFlow.test.tsx src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit responsive and theme styling**

```bash
git add src/styles/app.css src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts src/tests/pretextLivingFlow.test.tsx
git commit -m "style: refine nested Pretext proof across themes"
```

---

### Task 4: Verification, direct QA, review, and PR update

**Files:**
- Modify only when verification or review identifies a scoped defect.
- Track: `docs/superpowers/specs/2026-07-28-nested-pretext-proof-landing-design.md`
- Track: `docs/superpowers/plans/2026-07-28-nested-pretext-proof-landing.md`

**Interfaces:**
- Consumes: completed Tasks 1–3.
- Produces: a verified follow-up commit on the existing open PR branch and an updated PR description; no merge or deployment.

- [ ] **Step 1: Track the approved spec and plan**

```bash
git add docs/superpowers/specs/2026-07-28-nested-pretext-proof-landing-design.md docs/superpowers/plans/2026-07-28-nested-pretext-proof-landing.md
git commit -m "docs: record nested Pretext proof design"
```

- [ ] **Step 2: Run repository verification**

Run:

```bash
npm run verify
```

Expected: all configured type checks, unit tests, backend checks, build checks,
and protected-contract checks pass. If the repository’s composite command
reports an environment-only prerequisite failure, run the documented isolated
equivalent and record both the original failure and the passing scoped command.

- [ ] **Step 3: Run production build and browser tests**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: PASS with unchanged routing, saved-resume, editor, Review, Fit,
storage, export, PDF, resize, theme persistence, and SPA fallback behavior.

- [ ] **Step 4: Audit existing motion**

Review the final diff against `review-animations`:

- direct manipulation uses immediate transforms;
- no new CSS transition, keyframe, spring, or automatic movement exists;
- reduced-motion emulation preserves direct manipulation;
- no pointer-hover motion is introduced.

Any motion finding blocks completion until corrected and reverified.

- [ ] **Step 5: Perform direct browser QA**

Inspect the real production build in the available browser:

- Light, Dark, and System;
- saved and unsaved landing states;
- `1120`, `921`, `920`, `641`, `640`, and `358` CSS-pixel widths;
- at least one 200% zoomed desktop state;
- pointer drag, arrow keys, and `Shift` plus arrow keys;
- visible focus order and contrast;
- edit passage, View flow, contextual Reset position, and retained edited text;
- reduced-motion browser emulation only;
- practical Pretext failure/fallback behavior;
- no page-level horizontal overflow;
- unchanged hero image loading at `641/640`;
- unchanged open/continue-editing wording and actions.

Automated geometry checks do not replace this visual inspection. Do not alter
macOS System Settings; leave Reduce Motion off.

- [ ] **Step 6: Request independent read-only review**

Provide the reviewer:

- base and head SHAs;
- `PRODUCT.md`, `DESIGN.md`, the approved spec, and this plan;
- preserved behavior contracts;
- explicit instruction to inspect the exact diff and report
  Critical/Important/Minor findings without modifying files.

- [ ] **Step 7: Address valid findings with TDD and rerun affected verification**

For each valid behavioral defect, first add or tighten a failing test, reproduce
the failure, implement the smallest correction, and rerun the focused test.
Then rerun:

```bash
npm run verify
npm run build
npm run test:e2e
git diff --check
```

- [ ] **Step 8: Push the verified branch and update the existing PR**

```bash
git push
gh pr view --json number,url,state,headRefName,baseRefName
```

Update the existing PR description with the Nested Proof change, removal of
Operating Sequence, verification results, direct-QA matrix, and exact reviewed
head SHA. Do not open a duplicate PR.

- [ ] **Step 9: Stop before integration**

Report the updated PR URL, commit SHA, verification evidence, direct-QA
evidence, and review verdict. Do not merge, deploy, delete the branch, delete
the worktree, or perform any other integration action without explicit user
approval for that exact action.
