# Precision Workbench Landing Page Design

**Date:** 2026-07-21
**Phase:** D — Landing Page Identity
**Branch:** `feat/precision-workbench-landing`
**Base:** `origin/main` at `ddaa03b6a145d85e4822b615789211168c5cc9f5`
**Status:** Approved direction pending browser comparison among three complete alternatives

## Purpose

Redesign only Presume's public landing page so it reads as the public face of the finished Precision Workbench: precise, calm, document-led, and technically credible. The page should explain a usable local-first resume editor while also acknowledging the open-source work that made Presume possible.

Presume is not being framed as a conventional subscription SaaS product. It is a complete product experience and a technical showcase built from a personal resume project. The content balance is approximately 70 percent usable product and 30 percent project story and provenance.

The landing page must use the same material and interaction language as the editor without redesigning the editor, Review report, resume document, API, storage, export, PDF, or resize behavior.

## Authorities and Approved Exceptions

`PRODUCT.md` is the product authority. Root `DESIGN.md` is the visual authority. `docs/superpowers/plans/2026-07-17-precision-workbench-production-ui.md` remains the execution authority except where the user explicitly amended Phase D during the design conversation.

The following user-approved decisions supersede narrower Phase D plan language:

1. No literal resume, resume thumbnail, or resume skeleton appears anywhere on the landing page. The hero's visual anchor becomes a document-mechanics exhibit. This exhibit is the responsive "preview" for the Phase D breakpoint contract and is hidden through `640px`.
2. The existing information architecture may be distilled and extended to include an interactive Pretext Fit Lab and an explicit open-source provenance section. These additions replace redundant marketing comparison copy rather than creating an unrelated feature area.
3. The shared teal `P` mark becomes the official Phosphor `PenNib` icon in Regular weight. Updating the icon inside the existing editor masthead is a narrow shared-brand exception; editor layout, behavior, and copy remain unchanged.
4. Three complete browser-rendered alternatives will be developed with equal care before the final production composition is selected. Unselected alternatives and comparison-only routing must not remain in the PR's final production tree.

## Scope

### In scope

- Public `/presume/` landing identity, copy, structure, responsive layout, and restrained motion.
- A Phosphor PenNib Regular brand mark shared by the landing and existing editor mastheads.
- A non-resume document-mechanics hero exhibit.
- A joined four-cell Precision Ledger for product capabilities.
- A four-stage Write → Measure → Review → Export workflow.
- An interactive Pretext Fit Lab using the Pretext library already installed in Presume.
- Honest attribution to Pretext and HackerRank's open-source Hiring Agent.
- Three complete local browser alternatives and a temporary comparison mechanism.
- Focused landing integration and E2E contract updates.

### Out of scope

- Editor, Fit, Review, or resume-document redesign beyond the shared brand icon.
- Review service, Hiring Agent adapter, API, storage, export, PDF, JSON, resume geometry, resize behavior, or route-contract changes.
- New account, cloud storage, pricing, lead capture, testimonial, customer-logo, or conversion-funnel behavior.
- A literal resume preview anywhere on the landing page.
- The deferred Phase A contrast note unless Phase D directly touches that behavior.
- Sites or the Sites skill.

## Product Framing and Voice

The page should sound like the maker of a serious instrument explaining what it does and how it was constructed. It should not sound like a growth-marketing page promising an effortless career outcome.

### Voice rules

- Describe concrete behavior: direct editing, fixed document geometry, live fit constraints, local persistence, stable export, and advisory review.
- Prefer concise technical clarity over slogans, but keep the opening legible to a visitor who does not know Presume's architecture.
- Do not claim that Presume beats applicant-tracking systems, guarantees compatibility, improves hiring outcomes, or provides deterministic AI judgments.
- Call the upstream review project `HackerRank's open-source Hiring Agent`, not an ATS.
- Explain that Review is optional, advisory, and non-mutating.
- Explain that resumes remain in browser storage unless the user explicitly invokes a configured Review service.
- Credit upstream work visibly and link to its primary source; do not imply authorship of Pretext or Hiring Agent.

### Content ratio

The opening, capabilities, workflow, privacy, and final call to action form the product-led 70 percent. The Pretext explanation, Hiring Agent provenance, and construction notes form the project-story 30 percent. Provenance should deepen trust after the product is already understandable.

## Shared Information Architecture

Every alternative includes the same substantive content and interactions so the comparison evaluates composition rather than missing features.

1. **Masthead**
   - PenNib Regular brand mark and `Presume` wordmark.
   - Existing System, Light, and Dark appearance control.
   - Existing saved/unsaved editor action.
2. **Hero**
   - Product description and primary editor action.
   - Local-first/no-account reassurance.
   - A warm-white document-mechanics exhibit showing text, a width constraint, line geometry, and a measurement result without resembling a resume.
3. **Precision Ledger**
   - Four joined capability cells: edit directly, fit continuously, review without rewriting, and export predictably.
   - Existing `Card` primitives remain in the DOM for primitive composition, but CSS removes the impression of four floating cards.
4. **Workflow**
   - Write → Measure → Review → Export.
   - Review is visibly optional without breaking the sequence.
5. **Pretext Fit Lab**
   - Editable neutral prose, not resume content.
   - Three explicit measurement widths presented as one ToggleGroup.
   - Live line count, widest measured line, target line count, and plain-language fit state.
   - Uses `prepareWithSegments()` and `measureLineStats()` from `@chenglou/pretext`, the same library and measurement family already used by `useResizeEngine`.
6. **Open-source provenance**
   - Pretext: credited for fast, DOM-independent multiline measurement and line geometry.
   - Hiring Agent: credited for the open resume-to-score pipeline adapted behind Presume's optional Review boundary.
   - Clearly distinguish inspiration/dependency from Presume's own editor, fit, persistence, export, and normalized service boundary.
7. **Privacy and final action**
   - Local-first explanation, explicit JSON backup, and configured-only Review qualification.
   - Third editor action.

## Required Action Copy and Behavior

There must be exactly three editor actions built with the existing `Button` primitive.

| Location | Unsaved state | Saved state |
| --- | --- | --- |
| Masthead | `Open editor` | `Continue editing` |
| Hero | `Start editing` | `Continue editing` |
| Final section | `Open the editor` | `Continue editing` |

All three call the existing `onOpenEditor` callback. No action may replace `pushState`, add a new route, open a new tab, or modify resume storage. Theme selection must continue to persist into `/presume/editor/`, and browser Back must return to `/presume/`.

## Shared Visual System

- Use Geist for all landing text. EB Garamond remains exclusive to the real resume/PDF and must not be used to make the landing feel editorial.
- Use the existing Light/Dark semantic tokens rather than raw component-level colors.
- Structural shells use `2px` corners; controls use `4px` corners.
- Use opaque surfaces, one-pixel borders, inset edges, and sparse ambient shadows. No blur, glass, glow, gradient text, or decorative vertical stripe.
- Verdigris remains below roughly ten percent of a normal screen and is reserved for action, focus, selection, measurement, and active state.
- Warm white `--paper` may appear only inside the document-mechanics exhibit and Fit Lab measurement surface. It must remain the same in Light and Dark.
- Prose stays at or below `70ch`. Headline wrapping should feel editorial but remain concise and understandable.
- Feature organization is structural and joined, never a bento grid or a collection of unrelated elevated cards.
- External project marks or logos are not introduced. Provenance uses text, links, rules, and system diagrams in Presume's visual language.

## Brand Mark

Create one shared brand-mark component using the official `PenNib` export from `@phosphor-icons/react` with `weight="regular"`.

- Preserve the existing deep-Verdigris square field, border, inset edge, and accessible `Presume home` link.
- Render the icon as decorative within the already named link.
- Do not redraw, trace, rotate, animate, or modify the icon geometry.
- Do not use the Bold weight unless direct browser comparison demonstrates that Regular loses legibility at the final rendered size; the approved default is Regular.
- The mark remains stable on hover. Existing field and border tonal feedback may remain.

## Hero Mechanics Exhibit

The exhibit must make Presume's core idea understandable without depicting a resume.

It contains:

- A short neutral sentence arranged against a visible maximum-width boundary.
- Two or three measured line ranges, rendered as real text or precise text rows rather than skeleton bars.
- A width annotation and a line-count/fit readout using tabular numerals.
- A restrained measurement rule that visually connects the text width to the result.

It must not contain a person's name, job title, employment history, education, contact information, or conventional resume sections. Its warm-white field represents a measurement surface, not a sheet of resume paper.

At `641px–920px`, the exhibit is visible below or beside the hero copy according to the alternative's composition. At `921px+`, hero copy and exhibit form two non-overlapping columns. Through `640px`, the exhibit is hidden and the copy must remain complete without it.

## Pretext Fit Lab

The Fit Lab is the landing page's strongest proof that the technology is real.

### Interaction

- Start with neutral editable text such as: `A precise tool should make invisible constraints visible before they become surprises.`
- Let the visitor edit the text in a labeled multiline field.
- Offer three width choices through an accessible single-choice ToggleGroup. Do not use a freely draggable control that makes exact keyboard values difficult.
- Prepare the text only when the text/font changes; reuse the prepared value for width-only measurements.
- Report line count and widest line using `measureLineStats()`.
- Compare line count with an explicit two-line target and state `Within constraint` or `Over constraint` in text, never color alone.
- Keep measurement output deterministic and synchronous after fonts are ready.

### Failure and fallback

- If font readiness or measurement throws, retain the editable text and present `Measurement unavailable` without breaking the page or editor actions.
- Do not log repeated errors on every keystroke.
- The lab must not touch resume state, constraints, persistence, Review, or the editor's resize engine.

## Motion

Use the approved **Measured Instrumentation** direction.

1. On first render, the hero measurement rule resolves once from `scaleX(0.88)` to `scaleX(1)` over `240ms` using `var(--ease-standard)`. The result readout resolves through opacity over `180ms` after a short delay.
2. Fit Lab text and line wrapping update immediately. Only the status readout crossfades when the semantic state changes, over `160ms` using `var(--ease-standard)`.
3. Existing button active feedback remains a one-pixel downward translation using the shared token.

No section reveal, scroll-triggered entrance, staggered feature animation, parallax, pinning, scrubbed text, workflow drawing, brand-icon motion, looping animation, bounce, or elastic easing is permitted. CSS is sufficient; do not add GSAP or another motion dependency.

Under `prefers-reduced-motion: reduce`, the hero renders directly in its completed state and Fit Lab status changes are immediate. Motion must never be the only carrier of measurement state.

## Three Complete Alternatives

The alternatives share all contracts above but make materially different decisions about hierarchy, sequencing, and spatial rhythm. None is a low-fidelity wireframe or a superficial theme swap.

### Alternative A — Instrumented Workbench

**Thesis:** Lead with Presume as a precise product instrument.

- Asymmetric two-column hero with copy on the left and the measurement exhibit on the right.
- Precision Ledger immediately follows the hero as a joined horizontal instrument panel.
- Workflow is a restrained process rail.
- Fit Lab occupies the page's strongest secondary surface and is followed by provenance.
- Numeric readouts, rules, and measurement annotations provide the technical character.
- Product-to-provenance emphasis remains approximately 70/30, with product mechanics receiving the first and strongest visual positions.

This is the safest continuation of the finished editor's visual language and the baseline recommendation.

### Alternative B — Open Technical Manual

**Thesis:** Present Presume as a carefully documented open technical project that happens to be fully usable.

- Wide editorial hero with a smaller mechanics figure and chapter-like numbering.
- Precision Ledger reads like a compact specification table rather than a control panel.
- Fit Lab appears as a worked example embedded in the document flow.
- Workflow reads as a numbered operating procedure.
- Provenance appears as explicit source notes with primary links and concise implementation boundaries.
- Uses only Geist; technical-manual character comes from hierarchy, alignment, rules, and tabular numerals, not a monospace or serif font.
- Product-to-provenance emphasis is approximately 70/30.

This direction may communicate authorship and technical seriousness most clearly, but it must not become a documentation site that hides the editor action.

### Alternative C — Interactive Project Exhibit

**Thesis:** Make the construction of Presume visible as part of understanding the product.

- Hero centers a system flow that connects writing, Pretext measurement, optional Hiring Agent review, and stable artifact export.
- Fit Lab appears earlier and acts as the primary proof surface.
- Capabilities are interwoven with the system flow while remaining a four-cell Precision Ledger at the required breakpoints.
- Provenance is presented as two upstream inputs feeding a Presume-owned boundary, not as partner logos or endorsements.
- Workflow and final action resolve the exhibit back into the usable product.
- Product-to-provenance emphasis remains approximately 70/30; the earlier provenance cues are offset by keeping the product system and Fit Lab visually dominant.

This is the most distinctive technical-showcase direction and therefore carries the greatest risk of making the project story compete with the user task.

## Browser Comparison Architecture

During comparison only, `LandingPage.tsx` may select among three full concept components using a development-only query parameter:

- `/presume/?concept=workbench`
- `/presume/?concept=manual`
- `/presume/?concept=exhibit`

Requirements:

- The pathname and editor route remain unchanged.
- The parameter must not be written to storage or survive selection as a product preference.
- Each concept receives the same `hasSavedResume` and `onOpenEditor` props.
- Shared functional pieces may be reused, but each alternative owns its composition and section ordering.
- Default `/presume/` may show Alternative A during comparison.
- Before PR D, remove the concept parameter, unselected concept components, and any comparison-only UI or tests. The selected landing page becomes the sole `/presume/` implementation.

## Responsive Contracts

These inclusive boundaries apply to all three alternatives and to the selected production page.

### Through `640px`

- Stacked masthead.
- Masthead editor action at least `44px` high.
- Hero mechanics exhibit hidden.
- One Precision Ledger column.
- Vertical workflow.
- Fit Lab controls stack without clipping.
- No page-level horizontal overflow at `640px` or `358px`.

### `641px–920px`

- Desktop-oriented masthead.
- Masthead editor action exactly `36px` high.
- Hero mechanics exhibit visible and contained.
- Two Precision Ledger columns.
- Vertical workflow through and including `920px`.
- Fit Lab may use two internal columns only when its text field and measurements remain readable.

### `921px+`

- Two-column hero with no copy/exhibit overlap.
- Four Precision Ledger columns.
- Horizontal four-stage workflow.
- Fit Lab and provenance use the alternative's deliberate wide composition without equal-weight card proliferation.

## Accessibility

- Target WCAG 2.2 AA and preserve the existing visible focus vocabulary.
- Keep one semantic `h1` and coherent descendant heading order.
- Use real buttons, links, labels, lists, and regions; do not communicate structure only through styled `div` elements.
- The mechanics exhibit is explanatory, not a misleading product screenshot. Give it an accessible name that describes text measurement rather than `Presume editor preview`.
- Fit Lab width selection is one named option set with keyboard behavior from the existing ToggleGroup primitive.
- External provenance links identify their destination and use ordinary browser link behavior.
- Status does not rely on color, and reduced motion preserves every state.
- Coarse pointers receive no hover-only information.

## Primitive Composition

- Reuse existing `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `Badge`, `Separator`, `ToggleGroup`, and `ToggleGroupItem` primitives where their semantics fit.
- Add the official shadcn/Base UI `Textarea` primitive because the audited project has no installed multiline field; do not hand-roll a lookalike while adding avoidable behavior.
- Preserve four `Card` roots for the Precision Ledger, styled as one joined structural group.
- Use `Badge` only for compact status such as `No account required`; do not turn ordinary prose into chips.
- Use `Separator` only for real structural boundaries.
- The Phosphor brand icon is the explicit exception to the project's ordinary Lucide icon library.

## Testing Strategy

Implementation follows test-driven development for behavior and geometry contracts. Visual judgment remains a direct browser gate, not a snapshot test.

### Alternative comparison tests

- Write a focused component/integration test that proves each development concept renders the shared masthead, exactly three editor actions, four ledger cards, four workflow stages, Fit Lab controls, and both provenance links.
- Prove saved state changes all three editor actions to `Continue editing`.
- Prove Fit Lab output changes when text or width changes and failure state remains usable.
- Prove the PenNib mark renders in both landing and editor mastheads without changing their accessible link name.
- Run representative Light/Dark browser checks for every alternative at `1120px`, `921px`, `640px`, and `358px` before selection.

### Selected production tests

- Remove alternative-switch tests with the comparison harness.
- Conservatively update `src/tests/appIntegration.test.tsx` for selected copy, three actions, four Cards, Badge, Separator, PenNib brand, Fit Lab behavior, provenance links, and absence of a resume preview.
- Update `e2e/unconfigured.spec.ts` to protect exact `640/641` and `920/921` boundaries, including `44px` versus `36px` masthead action sizing, mechanics-exhibit visibility, one/two/four feature columns, vertical/horizontal four-step workflow, containment, and no overflow.
- Add a warm-white mechanics-surface assertion only if needed to protect theme independence.
- Add no visual snapshots.

## Direct Visual QA

Before selection, compare all three alternatives with equal scrutiny in a local browser. Check real content, Light and Dark, focus, motion, reduced motion, and responsive transitions rather than judging static thumbnails.

After selection, inspect `/presume/` in Light and Dark at exactly:

- `1120px`
- `921px`
- `920px`
- `641px`
- `640px`
- `358px`

At each relevant width verify saved and unsaved CTA wording, hierarchy, feature/workflow transitions, touch sizing, mechanics-exhibit containment, Fit Lab usability, focus, theme persistence into `/presume/editor/`, and browser-back navigation. Confirm the warm-white measurement surface does not tint in Dark mode.

## Release Gate and Protected Contracts

Run the full release gate before opening PR D:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm run verify
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

Obtain an independent rigorous read-only review and resolve every Critical or Important finding before opening PR D. Preserve the worktree after the PR opens for review iteration.

## Success Criteria

- A new visitor can explain what Presume does before encountering project provenance.
- The landing page feels like the same product as the editor without showing a resume.
- The hero mechanics exhibit communicates measurement and constraints, not generic marketing decoration.
- The Fit Lab demonstrates real Pretext behavior with neutral text and accessible controls.
- Pretext and HackerRank Hiring Agent receive accurate, visible, primary-source attribution.
- The page remains product-led, technically distinctive, calm, rectilinear, and materially consistent in Light and Dark.
- All responsive, route, saved-state, theme, editor, Review, document, export, PDF, storage, API, and resize contracts remain intact.

## Primary References

- Pretext library and API: <https://github.com/chenglou/pretext>
- Pretext example chosen for the Fit Lab, `Detect Text Overflow Before Render`: <https://www.pretext.cool/pretext-examples/>
- HackerRank Hiring Agent source and architecture: <https://github.com/interviewstreet/hiring-agent>
- Official Phosphor React package: <https://github.com/phosphor-icons/react>
- shadcn/Base UI component documentation: <https://ui.shadcn.com/docs/components/base>
