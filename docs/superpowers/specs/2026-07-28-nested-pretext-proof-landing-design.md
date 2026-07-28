# Nested Pretext Proof Landing Design

## Status

Approved by the user through iterative visual review on July 28, 2026.

Root `DESIGN.md` remains the visual authority and `PRODUCT.md` remains the
product authority. This document replaces the earlier assumption that the
Pretext living-flow exhibit should remain a standalone “Working Example”
section. It does not authorize unrelated landing-page, editor, storage, export,
PDF, Review, Fit, resize, routing, or deployment changes.

## Purpose

Integrate the approved interactive Pretext living-flow exhibit into the
existing “Why Presume Exists” section so that it functions as evidence for the
Pretext case-study claim instead of repeating that claim in a separate landing
section.

The resulting section must read as one parent argument with two supporting
technology subsections:

1. Presume began with the live document.
2. Pretext made the document’s text fit measurable.
3. HackerRank Hiring Agent helped define an advisory, non-mutating Review
   boundary.

The landing page remains a hybrid: the content communicates a portfolio case
study, while the presentation retains the clarity and finish of a premium SaaS
landing page.

## Selected Composition

Use the approved **Nested Proof** composition.

- Preserve the parent kicker `Why Presume exists`.
- Preserve the dominant parent thesis `The document came first.`
- Preserve the parent’s left-hand position at desktop widths.
- Place `01 / Measurement` and `02 / Advisory review` as consecutive,
  structurally related subsections in the right column.
- Integrate the Pretext living-flow passage directly into the Measurement
  subsection beneath `Pretext made fit observable.`
- Remove the separate `landing-fit-study` / “A working example” section
  boundary.
- Keep the Hiring Agent subsection directly after Measurement.
- Do not introduce a third headline, separate promotional card, diagnostic
  panel, meter, badge, or explanatory control bar.

The approved hierarchy is:

1. `The document came first.` — the only oversized parent thesis.
2. `Pretext made fit observable.` and
   `Hiring Agent made the review boundary tangible.` — bold subsection
   headings that are clearly smaller than the parent thesis and clearly larger
   than body copy.
3. `Text responds to its surroundings.` — a draggable title inside the Pretext
   passage, smaller than both the parent thesis and the technology subsection
   heading.
4. Explanatory prose — one consistent body treatment across Measurement and
   Advisory Review.

## Pretext Passage

Use one continuous prose passage. Do not divide the demonstration into
diagnostic blocks, multiple samples, controls for measurement width, or
rendered-line statistics.

The approved default copy direction is:

> Changing a sentence changes where every line ends, but browsers usually
> reveal those measurements only after the text appears. Pretext calculates
> multiline layout in JavaScript using the browser’s own font engine. It
> predicts line breaks and text height, then routes one continuous passage
> through changing geometry. Move the title through this passage to see each
> line find the available space again.

Implementation may make minor grammatical corrections if required, but may not
change the explanation into résumé marketing, library diagnostics, or a
developer tutorial without another content review.

The visible projected lines are demonstrative. A normal semantic paragraph
must remain available to assistive technology and must become the visible
fallback when Pretext layout is unavailable.

## Draggable Stair Title

Retain the approved uniform two-band staircase.

- The upper and lower bands have identical height and width.
- The lower band is offset horizontally while preserving the uniform stair
  construction.
- The outline hugs the two text lines with balanced horizontal and vertical
  inset.
- The title is exactly two lines:
  - `Text responds to`
  - `its surroundings.`
- The text uses the same Geist headline character as other bold landing
  headings, at a deliberately smaller size.
- Use the approved balanced treatment: larger than a quiet annotation, smaller
  than a demonstration headline.
- The initial position sits slightly right of center after an uninterrupted
  opening portion of the passage.
- The title fill matches the section background in both themes. Do not use a
  card fill, shadow, glass, glow, or logo treatment.

The title’s exclusion geometry must match its visible geometry closely. The
passage must not reserve unexplained extra height or width around the object.

## Interaction Contract

The demonstration uses direct manipulation only.

- Pointer and touch dragging move the stair through the passage.
- Arrow keys move the focused stair by the existing fine step.
- `Shift` plus an arrow key moves by the existing larger step.
- Arrow-key support remains because the drag interaction otherwise has no
  keyboard-equivalent movement. Do not add visible directional controls.
- Do not move, float, pulse, or tour the title automatically.
- Do not animate the passage or title into place.
- Batch pointer-driven layout updates with `requestAnimationFrame`.
- Clamp the title to the measured passage bounds.
- Preserve immediate response during direct manipulation; do not interpolate or
  spring between pointer positions.

The title is an interactive object, not another document heading. Use a native
button with a descriptive accessible name. The visible two-line title remains
available as part of that name, and the accessible instruction communicates
drag and arrow-key operation without adding visible instructional clutter.

## Passage Editing and Recovery

Preserve passage editing as a quiet secondary capability.

- Keep `Edit passage` as an understated text action within the Measurement
  subsection’s closing action row.
- In edit mode, use the existing visible labeled textarea behavior and the
  action `View flow`.
- Preserve entered text while toggling between edit and flow views.
- Add `Reset position` as a contextual action only after the stair has moved
  from its default placement.
- Reset returns the stair to the current responsive default without animation.
- Do not add a permanent instruction bar, control card, toolbar, or status
  display.

`Explore Pretext ↗` remains the destination link at the opposite side of the
Measurement subsection’s closing action row. `Explore Hiring Agent ↗` remains
the corresponding closing link for Advisory Review.

## Section Height and Rhythm

The Measurement subsection may be taller than Advisory Review because it
contains interactive evidence, but empty height may not create that emphasis.

- Size the interaction field from the rendered passage, responsive line
  metrics, title geometry, and required padding.
- Avoid the former oversized fixed minimum that left the Pretext link detached
  below a large blank field.
- Keep approximately one normal section spacing interval between the final
  occupied line and the closing action row.
- Keep Measurement and Advisory Review consistent in heading alignment, prose
  measure, rule treatment, and link placement.
- Do not pad Advisory Review merely to match Measurement’s total height.

## Responsive Behavior

### Desktop: `921px` and above

- Use the approved two-column Nested Proof.
- Keep the parent thesis in the left column and both technology subsections in
  the right column.
- Use the balanced stair scale and slightly right-of-center initial position.
- Cap prose at a readable measure consistent with the landing system.

### Tablet: `641px` through `920px`

- Stack the parent thesis above the two technology subsections.
- Preserve Measurement before Advisory Review.
- Retain the complete passage, editing behavior, pointer dragging, and keyboard
  movement.
- Recompute the stair’s default position from the measured passage width.
- Do not compress the original desktop columns into a narrow side-by-side
  imitation.

### Compact: `640px` and below

- Use one reading column with no page-level horizontal overflow.
- Preserve the same content and semantic order as desktop.
- Scale the stair and its title down while preserving the uniform two-band
  geometry and a minimum 44px interactive target.
- Keep the title inside the measured passage bounds.
- Keep `Edit passage`, the contextual reset action, and destination links
  usable at touch size without turning them into large cards or buttons.
- Preserve the established `641/640` hero-image loading and hiding boundary.
  This section must not modify that behavior.

Responsive layout may change measure, scale, position, and stacking. It may not
silently shorten, replace, or reorder the case-study content.

## Theme Treatment

Light, Dark, and System are equal authorities.

### Light

- Use the existing landing `--background` field.
- Use existing foreground, muted-foreground, border, primary, ring, and
  focus-contrast roles.
- The stair fill matches `--background`.

### Dark

- Use the existing Dark Surround and dark semantic roles.
- Keep the stair fill matched to the dark section field.
- Use the existing reduced-chroma Verdigris role for the outline, links, and
  focus treatment.
- Preserve legible separation through borders and type contrast, not shadow,
  glow, or a raised card.

### System

System resolves through the existing theme system. Do not add theme-specific
component state or new persistence behavior.

## Accessibility

- Maintain a coherent heading outline:
  - parent section heading;
  - Measurement and Advisory Review subsection headings;
  - no semantic heading role for the draggable title.
- Use a native button for the stair and native buttons for edit/reset actions.
- Use real links with descriptive names for external destinations.
- Preserve a two-pixel visible focus indicator with adequate contrast in Light
  and Dark.
- Preserve pointer, touch, and keyboard operation.
- Keep touch-critical targets at least 44px at the compact boundary.
- Keep the semantic passage available when visual lines are projected.
- When layout is unavailable, show the semantic passage and remove or disable
  the unavailable interaction rather than presenting a misleading draggable
  object.
- Support 200% zoom and narrow reflow without page-level horizontal scrolling.
- Do not rely on color or motion to communicate availability or state.

## Motion

No ornamental motion is authorized.

- Direct pointer movement may update the title transform and projected line
  transforms because those updates are the interaction itself.
- No CSS transition, spring, keyframe, or automatic animation may trail the
  drag.
- Reset is immediate.
- Reduced-motion emulation preserves direct manipulation while disabling any
  unrelated landing animation through the existing global contract.
- Do not change macOS System Settings.

## Landing Flow

The intended page narrative after this integration is:

1. Hero promise and editor action.
2. “Why Presume Exists” parent thesis.
3. Nested Measurement claim and interactive Pretext proof.
4. Nested Advisory Review claim.
5. Workbench capabilities.
6. Final editor action.

Remove the redundant `Operating sequence` section as part of this iteration.
Its Write / Measure / Review / Export content repeats the capability register
and final action without adding meaningful product evidence.

Preserve all open/continue-editing calls, saved-state wording, and final-action
behavior.

## Explicit Exclusions

This design does not authorize:

- changes to the hero composition, hero copy, hero assets, or `641/640` image
  boundary;
- changes to `src/styles/resume.css`;
- changes to editor, Fit, Review, resize, API, storage, export, PDF, routing,
  theme persistence, or SPA fallback contracts;
- use of the Presume logo or another unrelated icon as the draggable object;
- Pretext diagnostics, width controls, line metrics, meters, shaders, Canvas,
  WebGL, glass, glow, badges, or ornamental animation;
- a resume editor or editable resume artifact on the landing page;
- a shared component or CSS abstraction unless implementation reveals a real
  repeated seam;
- deployment, merge, branch deletion, worktree deletion, or any other
  integration action.

## Implementation Boundary

Expected production scope:

- integrate `PretextLivingFlow` into the Measurement subsection in
  `LandingPage`;
- adapt `PretextLivingFlow` semantics, copy, controls, default placement, and
  responsive geometry;
- update landing-specific styles;
- remove the standalone Pretext section and Operating Sequence;
- update focused component, landing integration, responsive, theme, and
  accessibility tests;
- add a focused follow-up implementation plan before changing production code.

Reuse the existing focused Pretext layout module and component. Do not create a
new shared design system or replace Presume’s visual vocabulary with stock
shadcn styling.

## Verification

Direct visual QA must cover:

- `/presume/` in Light, Dark, and System;
- saved and unsaved states;
- representative desktop, tablet, and mobile widths, including `921`, `920`,
  `641`, `640`, and `358` CSS pixels;
- at least one zoomed desktop state;
- pointer dragging, touch-equivalent pointer behavior, arrow keys, and
  `Shift` plus arrow keys;
- visible focus order and focus contrast;
- passage editing, `View flow`, contextual reset, and preserved edited text;
- reduced-motion emulation without changing macOS settings;
- Pretext-unavailable fallback;
- no page-level horizontal overflow;
- unchanged hero image behavior at `641/640`;
- unchanged open/continue-editing wording and saved-resume behavior.

Automated layout and geometry checks support this review but do not replace
direct visual inspection in the available browser.

## Decision Record

Rejected during exploration:

- retaining the standalone “Working Example” section;
- a diagnostic Pretext Fit Lab;
- a résumé editor or résumé content inside the exhibit;
- multiple sample passages;
- the Presume logo, pen nib, drafting triangle, paragraph mark, and unrelated
  geometric icons as the draggable object;
- automatic movement;
- a permanent instruction/control strip;
- a second oversized Pretext headline below the passage;
- a card or popup around the demonstration;
- the quiet small stair treatment, which understated the proof;
- the oversized stair treatment, which competed with the subsection heading;
- compressing the complete exhibit into the old right column without
  consolidating the duplicate Pretext claim;
- responsive variants that change or shorten the case-study content.

Selected:

- one “Why Presume Exists” parent section;
- Measurement and Advisory Review as two nested technology subsections;
- the Pretext passage integrated directly into Measurement;
- one continuous editable passage;
- the uniform two-band stair containing
  `Text responds to / its surroundings.`;
- the balanced stair scale and default placement;
- pointer/touch dragging plus quiet arrow-key parity;
- contextual reset after movement;
- no automatic or ornamental motion;
- removal of the redundant Operating Sequence section.
