# Editor Visual Pass 2 Brief

## Purpose

PR #21 improved structure and interaction behavior, but the visual result is still too close to the original utility UI. This brief defines a more ambitious visual overhaul for Presume while preserving the app's existing behavior and product identity.

The goal is not subtle polish. The goal is a clear before/after transformation: Presume should feel like a premium, portfolio-quality inline document editor.

## Product Identity To Preserve

Presume remains a direct-editing resume document editor, not a form builder.

The resume page is the product surface. Users edit the final document directly. Presume handles fit constraints, export, persistence, and optional advisory review.

Do not change:

- Direct inline editing.
- Public Resume JSON format.
- LocalStorage persistence.
- JSON export/import.
- PDF export behavior.
- Pretext/global resizing behavior.
- Review advisory/non-mutating behavior.
- `/presume/` routing.
- Fixed-width resume canvas with intentional horizontal scrolling on narrow screens.

## Visual Direction

Use a stronger concept: **premium document workbench**.

Presume should feel like a carefully designed workspace around a physical sheet of paper. The app chrome should feel precise and modern; the resume should feel staged, printable, and important.

Keywords:

- premium
- focused
- editorial
- precise
- calm
- dimensional
- professional
- portfolio-quality

Avoid:

- default SaaS dashboard
- generic bordered panels
- plain developer utility UI
- over-carded layout
- loud startup branding
- gradients as decoration
- glassmorphism
- making the resume look like a form

## Desired Before/After Difference

A user should immediately notice that the UI changed.

The redesign should visibly change:

- page background and workspace staging,
- app header presence,
- constraints/toolbar composition,
- resume canvas presentation,
- review affordance/panel treatment,
- editor control visual language,
- overall rhythm, contrast, and spatial hierarchy.

Small spacing/button tweaks are not enough.

## App Shell Concept

### Current issue

The shell still feels like simple panels above a document.

### Target

Create a staged workbench:

```txt
Full viewport workspace
  Top masthead / command surface
    Brand + promise
    Save/local status
    Review status/action

  Main workbench
    Editor command deck
      Fit constraints
      Document actions
      Warning state, if any

    Resume stage
      Fixed-width paper page
      Subtle measurement/editor chrome

    Review inspector, only when useful/open
```

The editor column should feel like a designed work surface, not a stack of boxes.

## Background And Workspace

Use a more intentional cool neutral background.

Recommended direction:

- Body background: deeper cool blue/slate neutral than current.
- Add a subtle radial or linear light field only if it feels like workspace lighting, not decorative gradient branding.
- Resume stage should sit on this background with deliberate spacing.
- The page shadow should be more physical and premium.

Example tone:

```css
--app-bg: #e7ecf3;
--app-bg-deep: #dbe3ed;
--ink: #0f172a;
--muted: #5b677a;
--surface: #ffffff;
--surface-subtle: #f7f9fc;
--line: #c9d3df;
--accent: #0f5f5c;
```

The app can use a very restrained background treatment, but the resume page must remain plain white and printable.

## Header / Masthead

The header should feel like a compact premium product masthead.

Recommended changes:

- Make `Presume` more visually intentional, not just a plain h1.
- Use a compact brand lockup:
  - small mark or monogram-like treatment, e.g. a square `P` glyph or document icon built with CSS/text.
  - `Presume` title.
  - product promise.
- Right side contains status pills:
  - `Saved locally`
  - review affordance/status when applicable.

Possible copy:

```txt
Presume
Direct-editing resume workspace
```

or:

```txt
Presume
Edit the final resume. Let the page fit itself.
```

Header should not dominate the page, but it should finally look designed.

## Constraints And Toolbar: Command Deck

### Current issue

Settings and toolbar read like generic panels.

### Target

Merge their visual language into a compact command deck above the document.

Structure:

```txt
Fit: 1 page · 1 line/bullet · 8px floor        [Edit constraints]
[Export PDF] [Export JSON] [Import JSON]       [Reset template]
```

Design:

- One cohesive surface, not two unrelated cards.
- Constraints strip feels like document state.
- Toolbar feels like commands for the current document.
- Export PDF is clearly primary.
- Reset is quiet and separated.

This can still be implemented with existing `SettingsPanel` and `Toolbar` components, but visually they should read as one command surface.

## Formatting Warning Treatment

Warnings should feel like precise fit diagnostics.

Target:

- Warning summary integrated into command deck.
- Use warm amber/brown with icon/label, not red.
- Copy remains practical:

```txt
Cannot fit under current constraints
1 bullet exceeds 1 line per bullet even at the 8px minimum. Shorten it or loosen constraints.
```

Visual style:

- compact, full-width within editor column,
- warm background and border,
- not a generic alert card,
- clearly distinct from review.

## Resume Stage

### Current issue

The resume page is correct but not staged enough.

### Target

Make the resume feel like a physical sheet on a premium desk/workbench.

Changes:

- Stronger but tasteful paper shadow.
- Slight canvas/stage padding around the page.
- Possible subtle stage border or inset shadow around canvas scroll area.
- Keep the actual resume page white and document-like.
- Avoid rounding the page too much; paper should still feel like paper.

The page should be the strongest visual object.

## Editor Controls

### Current issue

Controls are functional but still not a premium editing layer.

### Target

Controls become a consistent non-printing editor chrome layer.

Visual model:

- Small pill buttons for add actions.
- Icon-like round buttons for remove actions.
- Controls float in contextual gutters/rails.
- Add actions can be slightly more visible.
- Remove actions remain quiet until hover/focus.
- On touch/narrow screens, controls must remain discoverable and hit targets must be large enough.

Important:

- Controls must not look like resume text.
- Controls must not participate in bullet/contact text flow.
- Controls must be hidden from print/PDF capture.
- Keyboard focus must reveal controls.

## Review Affordance And Inspector

Review is useful but secondary.

Target:

- Header/status affordance feels like an inspector toggle.
- Full review panel should look like an inspector, not a generic card rail.
- Use review blue/teal distinct from formatting amber.
- Keep advisory language.
- Avoid making review visually dominant.

Panel style:

- sticky right inspector on desktop,
- stacked/collapsible on narrow screens,
- compact, dense, readable,
- less generic card nesting.

## Typography

App UI:

- Use system sans or Inter-like sans.
- More deliberate weight/letter-spacing.
- Avoid oversized headings.
- Make labels/status text crisp.

Resume:

- Preserve current resume typography and global scaling.
- App typography must not leak into resume content.

## Component/CSS Cleanup

The current PR layered new CSS overrides on top of old rules. Visual pass 2 should clean this up.

Tasks:

- Consolidate duplicated toolbar/button/control rules.
- Remove old `.app-header__status` styling if unused.
- Avoid multiple competing add/remove sections.
- Make tokens the actual source of truth.
- Keep CSS organized by shell, command deck, review, editor controls, responsive, print.

This cleanup matters because layered overrides make the UI harder to reason about and easier to accidentally regress.

## Responsive Behavior

Preserve the fixed-width resume canvas.

Narrow viewport requirements:

- no page-level horizontal overflow,
- only `.resume-canvas-scroll` scrolls horizontally,
- header stacks cleanly,
- command deck wraps cleanly,
- review inspector stacks/collapses only when useful/open,
- editor controls are tap/focus driven, not hover-only.

Do not create a mobile-native resume editor.

## Accessibility Requirements

- Visible focus rings.
- Keyboard access to all controls.
- ARIA labels for icon-only controls.
- `aria-controls` / `aria-expanded` where toggling panels.
- Color is not the only indicator.
- Reduced motion respected.
- Semantic buttons for actions.

## Implementation Approach

This should be a focused visual pass on top of PR #21.

Recommended phases:

1. CSS cleanup and token consolidation.
2. Header/masthead redesign.
3. Command deck redesign for constraints + toolbar + warnings.
4. Resume stage redesign.
5. Editor controls visual upgrade.
6. Review inspector visual alignment.
7. Responsive and accessibility verification.

## Acceptance Criteria

- The app has an obvious before/after visual change.
- It feels premium, deliberate, and portfolio-quality.
- The resume remains the primary surface.
- App chrome supports the document rather than competing with it.
- No product behavior or data contracts change.
- Existing test suite, build, and E2E tests pass.
- Manual visual review confirms the result no longer looks like the original UI with minor button tweaks.

## Explicit Non-Goals

- No Resume JSON changes.
- No stable IDs.
- No migrations.
- No reorder UI.
- No backend/provider/auth/database/queue work.
- No review rewriting/mutation.
- No PDF export behavior changes.
- No route changes.
- No mobile-native editor redesign.
