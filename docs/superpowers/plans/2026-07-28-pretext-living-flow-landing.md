# Pretext Living Flow Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the diagnostic Fit Lab landing section with the approved interactive Pretext passage and draggable two-level headline staircase.

**Architecture:** A focused `PretextLivingFlow` component owns passage editing, pointer/keyboard movement, responsive geometry measurement, and accessible fallback semantics. A pure `pretextLivingFlowLayout` module converts passage text plus a measured obstacle into positioned lines using Pretext, so geometry behavior can be tested without pointer-event setup. `LandingPage` keeps the existing section boundary and product behavior while replacing only the Working Example contents.

**Tech Stack:** React 18, TypeScript, `@chenglou/pretext` 0.0.5, Vitest, Testing Library, CSS.

## Global Constraints

- Preserve Precision Workbench, Document Anchor, Ten-Percent Verdigris, rectilinear geometry, borders before shadows, and restraint over decoration.
- Preserve routing, saved-resume behavior and wording, theme persistence, editor/Review/Fit behavior, API/storage/export/PDF/resize contracts, responsive hero image loading at 641/640, and SPA fallback.
- Do not modify `src/styles/resume.css`.
- Use no glass, glow, badge, shader, Canvas overlay, diagnostics, or ornamental motion.
- The title is “Text responds to / its surroundings.” inside two identical 252 × 35 design-unit bands, with the lower band offset 24 design units.
- The passage remains editable and the title remains draggable by pointer and movable by arrow keys.
- Reduced motion must not disable interaction and no automatic movement is allowed.

---

### Task 1: Pure Pretext living-flow layout

**Files:**
- Create: `src/components/landing/pretextLivingFlowLayout.ts`
- Create: `src/tests/pretextLivingFlowLayout.test.ts`

**Interfaces:**
- Consumes: `prepareWithSegments`, `layoutNextLine`, and `LayoutCursor` from `@chenglou/pretext`.
- Produces: `layoutLivingFlow(input: LivingFlowLayoutInput): LivingFlowLine[]`, where input includes passage, stage dimensions, line metrics, padding, and the measured obstacle polygon.

- [ ] **Step 1: Write failing tests for natural lines, obstacle slots, text exhaustion, and unavailable Pretext layout**

```ts
expect(layoutLivingFlow(baseInput)).toEqual([
  expect.objectContaining({ x: 28, y: 28, text: expect.any(String) }),
])
expect(layoutLivingFlow(withCenteredObstacle)).toSatisfy(lines =>
  lines.some(line => line.x > withCenteredObstacle.obstacle.x)
)
```

- [ ] **Step 2: Run the layout tests and confirm they fail because the module does not exist**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlowLayout.test.ts`

- [ ] **Step 3: Implement polygon band intersections, available line slots, and Pretext cursor walking**

```ts
export function layoutLivingFlow(input: LivingFlowLayoutInput): LivingFlowLine[] {
  const prepared = prepareWithSegments(input.text, input.font)
  // Walk each baseline and each available interval, advancing one cursor.
}
```

- [ ] **Step 4: Run the layout tests and confirm they pass**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlowLayout.test.ts`

### Task 2: Accessible draggable passage component

**Files:**
- Create: `src/components/landing/PretextLivingFlow.tsx`
- Replace: `src/tests/fitLab.test.tsx` with `src/tests/pretextLivingFlow.test.tsx`
- Delete: `src/components/landing/FitLab.tsx`
- Delete: `src/components/landing/fitLabMeasurement.ts`

**Interfaces:**
- Consumes: `layoutLivingFlow()` from Task 1.
- Produces: `PretextLivingFlow`, a labeled section with a semantic passage, visual projected lines, measured staircase button, edit/view control, and GitHub link.

- [ ] **Step 1: Write failing interaction tests**

```tsx
render(<PretextLivingFlow />)
expect(screen.getByRole('heading', { name: 'Text responds to its surroundings.' }))
  .toBeInTheDocument()
fireEvent.keyDown(screen.getByRole('button', { name: /movable headline/i }), {
  key: 'ArrowRight',
})
expect(screen.getByRole('button', { name: /movable headline/i }))
  .toHaveAttribute('data-position')
```

Also assert edit/view behavior, semantic passage availability, external Pretext link, visible fallback after a layout exception, and no automatic movement.

- [ ] **Step 2: Run the component tests and confirm they fail because the component does not exist**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlow.test.tsx`

- [ ] **Step 3: Implement the minimal component**

```tsx
<button
  aria-label="Movable headline. Drag it or use the arrow keys."
  onPointerMove={handlePointerMove}
  onKeyDown={handleArrowKey}
>
  <h2>Text responds to <span>its surroundings.</span></h2>
</button>
```

Use `ResizeObserver` for stage and title measurements, `requestAnimationFrame` to batch pointer updates, `document.fonts.ready` before layout, and a normal semantic paragraph beneath the visual `aria-hidden` projection.

- [ ] **Step 4: Run the component tests and confirm they pass**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlow.test.tsx`

### Task 3: Landing integration and responsive visual system

**Files:**
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `src/tests/themeContrast.test.ts`

**Interfaces:**
- Consumes: `PretextLivingFlow` from Task 2.
- Produces: the production Working Example section in light/dark/system and desktop/tablet/mobile layouts.

- [ ] **Step 1: Add failing landing and responsive tests**

Assert that the landing page renders “A working example,” the draggable headline, editable passage, and Explore Pretext link; assert the old “Pretext Fit Lab,” diagnostics, and width controls are absent. Add CSS-contract assertions for full-width section placement, 44px mobile target sizing, visible focus, transparent section treatment, and reduced-motion behavior without ornamental animation.

- [ ] **Step 2: Run the focused integration tests and verify the expected failures**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts`

- [ ] **Step 3: Replace the Fit Lab integration and add production CSS**

```tsx
<section className="landing-fit-study" aria-labelledby="pretext-living-flow-title">
  <PretextLivingFlow />
</section>
```

Use the approved 18px/30px passage, two equal staircase bands, `var(--background)` fill, `var(--border-strong)` outline, headline tokens (`650`, `-0.045em`, `0.99`), compact inline edit action, visible focus, and responsive title scaling based on the measured rendered object.

- [ ] **Step 4: Run focused tests and confirm they pass**

Run: `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/pretextLivingFlowLayout.test.ts src/tests/pretextLivingFlow.test.tsx src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts`

### Task 4: Verification, visual QA, review, and PR

**Files:**
- Modify only if verification or review identifies a scoped defect.

**Interfaces:**
- Consumes: completed production implementation.
- Produces: verified commit and an open PR; no merge or deployment.

- [ ] **Step 1: Run repository verification**

Run: `npm run verify`

- [ ] **Step 2: Run production build and browser tests**

Run: `npm run build`

Run: `npm run test:e2e`

- [ ] **Step 3: Perform direct browser QA**

Inspect light, dark, and system; saved and unsaved landing states; desktop, tablet, mobile, 641/640 boundary, keyboard focus, reduced-motion emulation, zoomed desktop, editing, pointer drag, arrow keys, and practical fallback behavior. Automated geometry checks do not replace direct inspection.

- [ ] **Step 4: Request independent read-only review**

Provide the reviewer the base SHA, head SHA, this plan, preserved product contracts, and the instruction to report Critical/Important/Minor findings without modifying files.

- [ ] **Step 5: Address valid Critical and Important findings, then rerun verification**

Run: `npm run verify && npm run build`

- [ ] **Step 6: Commit, push, and open the PR**

Create a focused commit, push `feat/pretext-living-flow-landing-pr41`, and open a PR against `main`. Do not merge, deploy, delete worktrees, or delete branches.
