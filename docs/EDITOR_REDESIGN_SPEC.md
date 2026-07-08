# Editor Redesign Spec

## Purpose

This spec defines a visual and UX redesign direction for Presume's editor. The goal is to make Presume feel like a minimal, premium document editor while preserving its core identity: users edit the final resume directly, and Presume handles fitting constraints.

The redesign should be implemented through focused React component and CSS polish. It must not become a data-model, routing, export, backend, or review-contract redesign.

## Product Direction

Presume should feel like a quiet, professional editing instrument around a printable resume document.

The chosen direction is a restrained version of a premium inline editor:

- More polished than the current utility-like shell.
- More productized than a bare document preview.
- Still calm, resume-first, and professionally appropriate.
- The resume remains the primary product surface.
- Toolbar, constraints, review, and editor controls remain supportive.

## Current UI Diagnosis

The current app has the correct functional shape but does not yet feel fully intentional:

- The header, toolbar, settings panel, and review panel are useful but visually plain.
- The resume page is appropriately document-like, but editor controls still feel bolted onto the document.
- Add/remove controls are discoverable, but their placement and `+` / `-` labels create visual clutter.
- Formatting constraints are exposed, but users need clearer explanation of how max pages, bullet line limits, and minimum font size interact.
- Impossible-fit warnings need stronger explanation: content may be valid, but it cannot fit under the current constraints.
- Review is useful, but should remain secondary and advisory rather than becoming the main interface.

## Non-Goals And Guardrails

Do not change:

- Public `Resume` JSON format.
- Stable IDs.
- Schema versioning.
- JSON migration.
- Reorder UI.
- Backend/provider/auth/database/queue behavior.
- Review UX as the main focus.
- Network-dependent tests.
- PDF export behavior.
- Direct inline editing.
- Pretext/global resizing.
- `/presume/` routing.
- LocalStorage persistence behavior.
- JSON import/export semantics.
- Review feedback's advisory, non-mutating contract.
- The fixed-width printable resume canvas.

The redesign should prefer CSS and component polish over broad architecture changes.

## App Shell

### Layout Model

Use a three-zone layout:

1. App header.
2. Main editor column.
3. Optional review panel.

Desktop structure:

```txt
App header
  Brand / promise / local status

Workspace
  Editor column
    Constraints/status strip
    Document toolbar
    Horizontally scrollable fixed-width resume canvas
  Review panel, if visible/configured
```

Recommended desktop behavior:

- Keep the resume column fixed to the current `816px` page width.
- Keep the review panel around `320px` to `360px` wide.
- Use a workspace max width around the current `1192px`, with room to grow slightly if needed.
- Increase the gap between editor and review panel to about `20px` to `24px`.
- Keep the review panel sticky on desktop.
- On narrower viewports, stack review above the resume editor and make it non-sticky.

### Header

The header should be compact and reassuring, not dominant.

Recommended content:

- Title: `Presume`.
- Subtitle: `Edit the final resume directly. Presume keeps it fitting.`
- Status cluster:
  - `Saved locally` or `Local draft`.
  - Optional review readiness/staleness indicator if available without adding review complexity.

The header should clarify the product promise while leaving the resume visually central.

### Toolbar

The toolbar should distinguish primary, secondary, and destructive actions.

Recommended hierarchy:

- Primary: `Export PDF`.
- Secondary: `Export JSON`, `Import JSON`.
- Quiet/destructive: `Reset template`.

The toolbar should still fit within the editor column and wrap cleanly on narrow screens.

Recommended visual treatment:

- Primary button: filled accent.
- Secondary buttons: white/subtle border.
- Destructive button: quiet by default, stronger danger treatment on hover/focus.
- Use one consistent button vocabulary across toolbar, settings, review, and editor controls.

## Settings And Constraints

The settings panel should become a constraints/status strip that explains the fitting model.

Collapsed summary should remain visible and accessible:

```txt
Fit constraints   1 page · 1 line/bullet · 8px minimum
```

Expanded settings should preserve the existing numeric inputs while adding concise helper copy:

- Max pages: `PDF exports one Letter page per page-height segment.`
- Max lines per bullet: `Bullets that cannot fit are marked.`
- Minimum font size: `Presume will not shrink text below this size.`

Do not change the constraint data model or resizing behavior.

## Formatting Warnings

Formatting warnings must explain constraint failure, not imply content is semantically wrong.

When content cannot fit under the current constraints, show a compact warning summary near the constraints strip or above the resume canvas:

```txt
Cannot fit under current constraints
1 bullet exceeds 1 line even at the 8px minimum. Shorten it or loosen constraints.
```

Warning behavior:

- Keep impossible bullets highlighted inline.
- Use a warm warning tone for formatting issues.
- Reserve stronger red treatment for truly destructive or blocking errors.
- Keep formatting warnings visually distinct from review annotations.

The minimum font size remains a hard floor. If a bullet cannot fit within max line count at the minimum global scale, the app should continue to hold the resume at minimum scale and warn clearly.

## Resume Editing Surface

The resume must remain printable and document-like.

Recommended behavior:

- Preserve the current Letter-sized fixed canvas.
- Preserve direct `contenteditable` editing.
- Keep app controls outside the perceived resume content wherever possible.
- Use subtle focus rings for editable text that do not change layout.
- Improve placeholder contrast enough to be legible while still reading as placeholder text.
- Preserve the resume typography unless a separate template redesign is explicitly planned.

The resume surface should have two visual states:

- Resting: mostly printable, with controls quiet.
- Editing/hover/focus: relevant controls become visible without shifting content.

## Add And Remove Controls

The current controls should evolve into a contextual editor-control system.

Core rule: controls must be discoverable, keyboard-accessible, and outside resume text flow.

### Shared Control Principles

- Use contextual gutters, side rails, or compact action pills.
- Use consistent labels and sizing.
- Reveal controls on hover and `:focus-within`.
- Keep controls reachable by keyboard.
- Controls must remain visible on `:focus-visible`.
- Controls must be hidden from print and PDF capture.
- Avoid placing controls inside bullet text or other measured text flows.

### Contact Items

Recommended pattern:

- Show `+ Contact` at the right side of the resume header/contact row on header hover or focus-within.
- Show individual remove controls near each contact item only on hover/focus.
- Do not let contact controls participate in the centered contact text layout.

Accessible labels:

- `Add contact item`.
- `Remove contact item` or, if practical, `Remove contact item: <value>`.

### Sections

Recommended pattern:

- Place section removal in the right gutter of the section header.
- Keep the section title and underline as the visual document element.
- Add section at the end of the document with a quiet full-width or right-aligned `Add section` affordance.

### Entries

Recommended pattern:

- Show entry controls on the right edge of the entry block on hover/focus-within.
- Keep `Add bullet` and `Remove entry` grouped consistently.
- Add entry at the bottom of a section with copy like `Add entry to Experience` if feasible without additional data requirements.

### Bullets

Recommended pattern:

- Keep delete controls out of the inline bullet text flow.
- Place bullet delete in a right-side gutter or side rail.
- Show `Add bullet` below the bullet list, aligned with the list text or right-side control group.

This preserves the Issue #20 fix while making the control system more coherent.

## Review Panel

The review panel should remain secondary, advisory, and visually aligned with the redesigned shell.

Recommended treatment:

- Keep as a right rail on desktop.
- Stack above the editor on narrower screens.
- Keep the `Advisory only` label.
- Keep score explanation: `Advisory score, not an ATS guarantee.`
- Use compact cards/lists, avoiding nested-card clutter.
- Preserve long-string wrapping and no-overflow behavior.
- Keep review annotations visually distinct from formatting warnings.

Review feedback must never mutate resume content.

## Visual System

Use a restrained product palette.

Suggested roles:

```css
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
```

Use accent color sparingly for:

- Primary actions.
- Focus/active states.
- Review markers.
- Important status indicators.

Avoid decorative gradients, glassmorphism, heavy color blocks, and anything that makes the app feel less serious.

## Typography

App UI:

- Continue using a system sans or Inter-like stack.
- Keep compact product UI sizing:
  - Header title: `22px` to `24px`.
  - Panel titles: `14px` to `16px`.
  - Labels: `12px` to `13px`.
  - Controls: `13px`.

Resume document:

- Preserve the existing resume type system and global scaling behavior.
- Do not let app UI typography leak into the resume content.

## Spacing And Shape

Recommended app rhythm:

- App padding desktop: about `24px 20px 56px`.
- Workspace gap: about `20px` to `24px`.
- Toolbar/settings padding: about `10px` to `12px`.
- Review panel padding: about `16px`.

Recommended radii:

- App surfaces: `10px` to `12px`.
- Buttons: about `8px`.
- Pills: `999px`.
- Resume page: no radius, or only a very subtle radius if visually necessary. It should continue to read as paper.

## Responsive Behavior

Preserve the fixed-width resume canvas.

Narrow viewport rules:

- The page body should not horizontally scroll.
- Header, toolbar, settings, and review panel should fit the viewport.
- Only `.resume-canvas-scroll` should own horizontal overflow for the fixed `816px` resume canvas.
- Toolbar controls should wrap into usable rows.
- Settings summary should stack or wrap cleanly.
- Review panel should become full-width and non-sticky.
- Do not redesign Presume into a mobile-native resume editor in this redesign.

## Phased Implementation Plan

### Phase 1: Visual Tokens And Shell Polish

Scope:

- Add or refine CSS custom properties for app colors, spacing, borders, radius, and shadows.
- Polish header, workspace, toolbar, settings shell, resume canvas surround, and review panel shell.
- Preserve existing behavior.

Likely files:

- `src/App.tsx`
- `src/components/Toolbar.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/ReviewPanel.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`

Acceptance criteria:

- App feels visually cohesive and premium-minimal.
- Resume remains central.
- Toolbar/settings/review remain supportive.
- Existing tests and build pass.

### Phase 2: Constraints And Warning Clarity

Scope:

- Improve settings copy and helper text.
- Add or improve an impossible-fit warning summary.
- Refine inline warning visual treatment.
- Keep resize engine behavior unchanged.

Likely files:

- `src/App.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/ResumePage.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`
- tests covering warning rendering and responsive behavior as needed.

Acceptance criteria:

- Users can understand max pages, max lines per bullet, and minimum font size.
- Impossible-fit state clearly explains that content cannot fit under current constraints.
- Formatting warnings remain distinct from review annotations.

### Phase 3: Contextual Editor Controls

Scope:

- Redesign add/remove controls for contact items, sections, entries, and bullets.
- Move controls into contextual gutters/action groups.
- Preserve existing add/remove operations and public data shape.
- Ensure controls remain keyboard-accessible.
- Ensure controls are hidden from print and PDF capture.

Likely files:

- `src/components/ResumeHeader.tsx`
- `src/components/ResumePage.tsx`
- `src/components/Section.tsx`
- `src/components/Entry.tsx`
- `src/components/Bullet.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`
- `src/export.ts`, only if new editor-only selectors require capture hiding updates.
- `src/tests/responsiveLayout.test.ts`
- `src/tests/appIntegration.test.tsx`
- `src/tests/export.test.ts`

Acceptance criteria:

- Controls are discoverable but do not dominate the printable resume.
- Controls do not participate in bullet line measurement or resume text flow.
- Keyboard users can access all add/remove actions.
- PDF export and print output do not include editor controls.

### Phase 4: Review Panel Alignment

Scope:

- Align review panel visual styling with the new shell.
- Preserve advisory language and non-mutating behavior.
- Keep long evidence wrapping and narrow viewport behavior intact.

Likely files:

- `src/components/ReviewPanel.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`
- `src/tests/reviewUi.test.tsx`
- `e2e/configured-review.spec.ts`

Acceptance criteria:

- Review panel feels integrated but secondary.
- Review states remain understandable.
- Stale and error states preserve previous-result behavior.
- Review annotations remain distinct from formatting warnings.

### Phase 5: Responsive, Accessibility, Export, And QA Hardening

Scope:

- Verify narrow viewport behavior.
- Verify keyboard navigation and focus states.
- Verify print/export hiding.
- Update tests and manual QA checklist.

Likely files:

- `src/tests/responsiveLayout.test.ts`
- `src/tests/appIntegration.test.tsx`
- `src/tests/reviewUi.test.tsx`
- `e2e/unconfigured.spec.ts`
- `e2e/configured-review.spec.ts`
- docs updates if behavior copy changes materially.

Acceptance criteria:

- Body does not horizontally overflow on narrow screens.
- Only the fixed resume canvas scrolls horizontally.
- Toolbar, settings, and review panel remain usable on narrow screens.
- Export/import/reset/review workflows still pass.
- `npm test -- --run`, `npm run build`, and `npm run test:e2e` pass.

## Testing And Manual QA Checklist

Automated checks:

- Existing frontend test suite.
- Existing production build.
- Existing Playwright E2E suite.
- Responsive CSS contract for narrow viewport overflow.
- Export tests confirming editor-only controls are hidden during capture and restored afterward.
- Integration tests for toolbar/settings accessibility.
- Review UI tests for stale/error/result rendering.

Manual QA:

- Desktop viewport around `1366x1024`.
- Narrow viewport around `358x980`.
- Keyboard-only navigation:
  - toolbar actions,
  - settings toggle and inputs,
  - inline editable fields,
  - add/remove controls,
  - review action.
- PDF export:
  - no editor controls visible in exported PDF,
  - resume content unchanged after export.
- JSON import/export remains unchanged.
- Reset confirmation still protects current draft.
- Review states:
  - unconfigured,
  - disabled,
  - config error,
  - loading,
  - success,
  - stale after edit,
  - request error preserving previous result.

## Subagent Strategy

Do not deploy subagents before the design and implementation plan are agreed.

After approval, subagents can be useful for independent tracks:

- Shell/CSS visual polish.
- Constraint and warning copy/states.
- Review panel alignment.
- Test and QA updates.

The contextual editor controls phase should have one primary owner because `ResumeHeader`, `Section`, `Entry`, `Bullet`, CSS positioning, keyboard accessibility, and PDF/export hiding are tightly coupled.
