# Publishing Bureau Editor Visual-System Design

## Status

Design exploration complete. Root `DESIGN.md` is the normative visual authority; where this exploratory record differs, `DESIGN.md` wins. The temporary visualizer remains a decision aid, not production source.

The decisions that were open when this document was first written are resolved:

- **Creative North Star:** The Precision Workbench. “Publishing Bureau” remains only the historical working name of this exploration.
- **Production accent:** Verdigris. Cobalt remains a rejected visualizer reference, not a production alternative.
- **Theme scope:** Light and Dark both ship, first visit follows the system theme, and an explicit System, Light, or Dark choice persists.
- **Typography:** Geist carries the Presume wordmark and all application UI. EB Garamond is reserved for the resume canvas and exported PDF.

## Purpose

This design evolves Presume's editor from a competent application shell into a distinctive, document-led publishing workspace. It is a new visual-system phase after the completed four-PR shadcn migration, not another migration step.

The historical working name was **Publishing Bureau**. The approved North Star is **The Precision Workbench**: the resume is the proof, Fit Constraints governs its measure, and Review is an advisory reading kept separate from editing.

This phase must not change resume data, editing behavior, review semantics, export behavior, storage, routing, or the fixed document geometry.

## Product Scene

A job seeker is making focused edits on a laptop or desktop, comparing every word against the physical limits of a Letter resume. The surrounding interface should feel calm, exact, and materially finished while disappearing behind the document task.

This scene supports both a light workspace and a dark, ink-colored workspace. In either theme, the resume remains white and visually dominant.

## Design Principles

### Page first

- The fixed-ratio resume remains the brightest, largest, and most detailed surface.
- Application chrome frames the document; it does not compete with it.
- Fit is an input to the page and Review is an output from it.
- The resume document and its print/export styling remain custom.

### Editorial, not ornamental

- Use Geist for the Presume wordmark, controls, state, scores, steppers, and all other application UI.
- Use EB Garamond only for the resume canvas and exported PDF.
- Use precise rules, alignment, and proportion to create character.
- Do not add decorative rulers, fake measurement marks, folio labels, manuscript kickers, or numbered section scaffolding unless they communicate real application state.

### Material, not glassy

- Premium finish may use restrained edge gleams, one-pixel inner highlights, explicit surface elevation, and controlled document shadow.
- Dark-mode depth comes primarily from progressively lighter opaque surfaces, not large shadows.
- Avoid decorative blur, glass cards, glow, gradient text, pill-heavy controls, and soft nested cards.
- Border radii remain restrained and consistent with the existing rectangular component vocabulary.

### Distilled language

Every visible line of application copy must do at least one of the following:

1. Name a control or region.
2. Report meaningful state.
3. Explain an unavailable or destructive action when the reason is not otherwise apparent.
4. Present actual resume or review content.

Remove copy that repeats a title, button, visible value, or self-evident interaction. Specific decisions include:

- Keep `Presume`; omit the repeated product tagline in the editor masthead.
- Keep `Fit constraints`; omit editorial introductions and measure kickers.
- While Fit is expanded, show its three labels and values without repeating an active-limit summary.
- Keep `Review unavailable` and `Details`; put setup explanation behind the expanded details surface.
- Omit decorative canvas metadata such as `US Letter`, `Direct edit`, canvas percentage, and folio numbering.
- Keep `Saved locally` because it communicates persistence state.

Accessibility labels may remain more descriptive than the visible copy.

## Color System

### Strategy

Use a restrained product palette. Neutral surfaces carry most visual weight. The brand accent is reserved for:

- The Presume mark.
- The primary Export PDF action.
- Keyboard focus.
- Active selection and disclosure state.
- Fit and Review progress cues.
- Rare structural emphasis.

Success, warning, and destructive colors retain fixed semantic meaning and do not change with the brand accent.

### Accent candidates

#### Verdigris — selected

Verdigris is more distinctive to Presume than conventional software blue and connects naturally to the existing deep-teal identity. It should be refined away from generic SaaS teal by pairing it with editorial typography, ink-tinted neutrals, and sparse application.

#### Cobalt — historical alternative

Cobalt felt sharper and more explicitly editorial, but it was not selected because blue is common across productivity software and less ownable for Presume.

Vermilion and Saffron remain visualizer references only. They are not proposed production brand colors.

### Accent and surface relationship

The accent selector in the visualizer changes both the high-chroma accent and the low-chroma tint of the surrounding surface family. A Verdigris selection subtly tints the canvas and panels toward Verdigris; Cobalt does the same toward Cobalt. It must not leave the shell permanently teal while changing only buttons.

The tint remains subtle. It should be felt as cohesion rather than read as a saturated colored background.

### Light and dark themes

Both themes use the same semantic token roles:

- canvas
- base surface
- raised surface
- document stage
- foreground
- muted foreground
- border
- control surface
- primary accent
- semantic success, warning, and destructive roles

Dark mode is not an inverted light palette. It uses a three-step opaque surface scale, slightly reduced text weight, lower accent chroma, and a warm-white document. The document itself does not enter dark mode.

The visualizer's color swatches were review controls and do not imply a production accent picker. The production appearance control offers System, Light, and Dark only.

## Wide Composition

Preserve the approved editor-shell geometry unless a separately reviewed layout change proves necessary:

```text
Fluid masthead
  Presume                                      Saved locally / appearance entry

Wide workspace at 1640px and above
  Fit Constraints      Fixed document editor      Review

Constrained workspace through 1639px
  Fit Constraints
  Fixed document editor
  Review
```

- Keep equal side tracks around the centered editor on wide screens.
- Keep the editor workbench approximately 896px wide around the fixed 816px resume.
- Side surfaces may use the Precision Workbench's flatter rail treatment instead of generic cards.
- Document actions remain in the masthead or a tightly integrated command rail, with Export PDF primary.
- Do not stretch the document workbench to fill the browser.

## Responsive Behavior

- Desktop and laptop remain the primary experience.
- At constrained widths, Fit moves above the document and Review below it.
- The masthead may wrap into two disciplined rows.
- The resume retains its fixed geometry and horizontal overflow remains inside the designated canvas scroller.
- No document-level horizontal overflow is allowed.
- Preserve the inclusive 560px touch-target contract.
- Responsive changes alter composition, not document typography or proportions.

## Component Vocabulary

Continue using the installed shadcn/Base UI primitives where they match the interaction:

- `Button` for document and Review actions.
- `Collapsible` for Fit and Review disclosure.
- `Alert` for unavailable, warning, stale, and error states.
- `Badge` for concise status metadata.
- `Separator` only for genuine structural boundaries.
- `Card` only where a self-contained Review result surface needs card semantics.

Do not force the masthead, rails, canvas stage, or every section into `Card`.

If a production appearance selector is approved, use a proper option-set primitive and semantic theme tokens. Do not reproduce the visualizer's raw swatch markup directly.

## Interaction and Motion

- Keep ordinary control transitions between 150ms and 200ms with an ease-out curve.
- Preserve the approved 3px Review progress sweep and reduced-motion behavior.
- Theme changes may crossfade surface, border, and foreground tokens without animating layout.
- Hover and active states may use restrained edge gleam and inner highlight.
- Every interaction retains visible keyboard focus and a non-color indicator where state requires one.

## Protected Behavior and Files

The first implementation PR must not change:

- Resume JSON format or storage keys.
- `src/styles/resume.css` document geometry, print rules, or contenteditable behavior except under a separately approved document-design task.
- PDF rendering or export semantics.
- JSON import/export semantics.
- Review state machine, request behavior, or advisory/non-mutating contract.
- Resize engine and Fit bounds.
- `/presume/` and `/presume/editor/` routing.
- GitHub Pages fallback generation.

## Proposed Implementation Shape

The implementation should be staged rather than recreated from the visualizer wholesale.

### PR A — semantic visual-system foundation and editor shell

- Implement Verdigris as the production accent.
- Ship complete Light and Dark themes with a persisted System, Light, or Dark preference.
- Load Geist for the Presume wordmark and all application UI while preserving EB Garamond for the resume and PDF.
- Define the semantic surface and accent tokens in the existing Tailwind v4 global stylesheet.
- Restyle the masthead, action rail, Fit surface, document stage, and collapsed Review rail.
- Apply the distilled-copy contract.
- Preserve existing component behavior and responsive geometry.
- Do not redesign the expanded Review report or resume document yet unless token inheritance requires small presentation adjustments.

### Later optional work

- Apply the approved system to the expanded Review report after the shell is stable.
- Evaluate the landing page against the new identity in a separate PR.
- Extend the same approved tokens to additional product surfaces only in separately reviewed phases.

## Verification

Automated verification should remain conservative and behavior-focused:

- Existing unit suite.
- Existing Playwright suite.
- One focused contract for any newly introduced theme preference behavior.
- Existing 1640/1639 layout boundary and fixed-canvas overflow checks.
- Existing 560/561 control-height checks.
- Build output and byte-identical SPA fallback.
- Protected-file diff.

Do not add visual snapshots. Direct visual QA must cover:

- Light and dark palettes that are actually in scope.
- The selected accent and semantic warning/success states.
- 1920px, 1640px, 1639px, 960px, 561px, 560px, and 358px.
- Collapsed and expanded Fit.
- Review ready, loading, complete, stale, unavailable, and failure states.
- Keyboard focus and reduced motion.
- 50% browser zoom for shell-edge integrity while keeping issue #27's resolved document geometry contract intact.

## Rollback

- Keep token changes and surface conversions in reviewable commits.
- Reverting the visual-system PR must restore the current editor shell without data or schema rollback.
- Do not mix unrelated product features into the visual-system branch.

## Resolved Decision Gate

Implementation planning may proceed from root `DESIGN.md`. Verdigris, complete Light and Dark themes, persisted System/Light/Dark preference, and the Geist-application/EB-Garamond-document boundary are approved.
