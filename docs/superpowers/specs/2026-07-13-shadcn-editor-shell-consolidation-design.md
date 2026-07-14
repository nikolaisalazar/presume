# Shadcn Editor-Shell Consolidation Design

## Purpose

PR #4 consolidates Presume's remaining editor-shell presentation after the landing page, shared controls, and ReviewPanel migrations. It replaces layered generations of shell CSS with a deliberate application-chrome composition while preserving the resume document, editing model, export behavior, and review contract.

This is a desktop-first, presentation-and-layout PR. It may make the approved shell interaction changes documented here, but it must not become a resume-template, data-model, provider, or backend migration.

The fixed 816px resume remains the primary product surface. Fit Constraints is an input to the document, and Review is a secondary advisory output.

Temporary brainstorming renderings created outside the repository are non-normative. Implementers and reviewers must use this written geometry, the real component behavior, and exact-width browser QA as the source of truth; they must not reproduce incidental typography, proportions, or placeholder controls from a sketch.

## Current-State Diagnosis

The editor is functionally sound, but `src/styles/app.css` contains several generations of overlapping shell rules:

- Early `.app`, `.app-header`, `.workspace`, `.editor-panel`, `.resume-canvas-scroll`, and `.resume-canvas` definitions remain beneath later redesign overrides.
- Premium-redesign, visual-pass, full-width-stage, and unified-command-deck sections redefine the same geometry.
- Some selectors, including `.app-header__status`, no longer have live markup.
- The command deck and resume stage are framed by an additional `.editor-panel` surface, creating nested shell chrome.
- Responsive source tests assert implementation strings from these layered rules instead of only the user-facing geometry they are intended to protect.

The shadcn foundation is already present. PR #4 does not need another component package or a new design-system dependency.

### Superseded shell guidance

This specification supersedes earlier editor-shell placement guidance where the documents conflict:

- `docs/EDITOR_REDESIGN_SPEC.md` and `docs/EDITOR_VISUAL_PASS_2_BRIEF.md` remain historical product context, but their command-deck and conditional Review-rail composition is replaced by this approved design.
- `docs/superpowers/specs/2026-07-10-shadcn-review-panel-design.md` remains authoritative for Review report content and state presentation, but its header-trigger and 1221/1220 placement contract is replaced by PR #4's persistent rail and derived wide-workspace boundary.

The earlier documents' data, export, editing, accessibility, and fixed-canvas guardrails remain in force.

## Approved Product Direction

### Composition

The approved desktop composition is a document workbench with three functional regions:

```text
Fluid framed header
  Presume brand and product promise
  Saved locally status

Wide workspace, when all regions genuinely fit
  Fit Constraints     Fixed document editor     Collapsed or expanded Review

Constrained workspace
  Fit Constraints
  Fixed document editor
  Collapsed or expanded Review
```

The document editor remains centered on the browser centerline. Side regions occupy space around it; they do not determine its center.

### Header

- Retain the approved framed header shell.
- The header is a page-level surface: fluid within the application's outer gutters and wider than the document editor whenever space permits.
- Do not make it full-bleed. Preserve deliberate page gutters.
- Its maximum width follows the maximum wide-workspace composition rather than the old 1220px cap.
- Keep the brand lockup and product promise.
- Keep `Saved locally` visually non-interactive.
- Remove the Review action from the header. Review owns a persistent workspace rail instead.
- Do not add a Review service-status dot to the header in this PR.

### Central editor workbench

- The central editor shell remains approximately 896px wide at desktop geometry:

  ```text
  816px fixed resume canvas
  + 24px stage padding on each side
  + 32px shell allowance
  = 896px editor shell
  ```

- The editor shell does not stretch to fill the browser.
- Compose document actions and the resume stage as one coherent workbench rather than a framed panel containing two more framed panels.
- Keep document actions above the resume stage.
- Preserve the existing action hierarchy: Export PDF primary; Export JSON and Import JSON secondary; Reset template quiet/destructive.
- Remove the decorative `Letter · fixed canvas` / `Direct edit` metadata row. The document format and direct-editing behavior are already apparent and do not justify another horizontal band.
- Do not add a replacement `Letter` marker.
- The resume remains plain white, physically staged, and visually dominant.

### Fit Constraints

- On genuinely wide screens, Fit Constraints is a compact card/panel to the left of the document editor.
- Preserve its local, closed-by-default `Collapsible` behavior.
- The collapsed state remains a concise summary of the active limits.
- The expanded state keeps the existing stepper semantics, bounds, helper copy, focus behavior, and touch sizing.
- Formatting warnings belong with Fit Constraints because they explain a failure to satisfy those constraints. Compose the existing warning summary within the Fit region rather than restoring a permanent formatting-status row over the document.
- An active warning remains visible even when the Fit controls are collapsed. It may sit below the collapsed trigger inside the same Fit region; it must not be hidden inside closed `CollapsibleContent`.
- Healthy formatting remains silent. Do not add a persistent `Formatting looks good` line.
- Fit Constraints never overlays or compresses the fixed resume canvas.

### Review rail and dashboard

Review becomes a persistent secondary workspace region rather than a header action that disappears from the workbench.

#### Collapsed rail geometry

- The collapsed Review rail is a fixed-height, single-line surface. Target 52px at desktop and never below the existing 44px narrow touch-target requirement.
- Its dimensions remain stable across checking, ready, reviewing, complete, stale, unavailable, and failure states.
- Use the application's system font stack consistently.
- Keep primary text around 13px and secondary text around 12px with restrained 600/700 emphasis.
- Scores use tabular numerals, a stable minimum width, and `white-space: nowrap`; `84 / 100` must never split across lines.
- Do not add a permanent green service-status dot. Normal availability does not need an “all clear” light.
- Unavailable/setup-needed Review receives explicit amber copy and surface treatment. Request/configuration failures preserve the existing destructive semantics. Never rely on color alone.
- A visual service-status dot is deferred. A future PR may evaluate one inside the Review rail or header.

#### Rail state language and actions

The rail has one primary message and at most one available action per state:

- Ready: `Review resume` with a clear start affordance.
- First review in progress: `Reviewing` with restrained `In progress` copy.
- Complete: `Review ready`, a non-wrapping score such as `84 / 100`, and a `View` affordance.
- Stale result: `Review stale`, the preserved score when available, and a `View` affordance.
- Unconfigured or disabled: `Review unavailable` with a `Details` affordance and the existing setup/unavailable explanation inside the expanded dashboard.
- Configuration or request error without a result: concise failure copy with a `Details` affordance.
- Error while preserving a previous result: keep the previous result accessible and label the update failure accurately.
- Checking: fixed inert rail that communicates availability is being checked.

The wording may receive small clarity edits during implementation, but it must not add stacked status text or repeat `Review`, `Ready to review`, and `Review resume` as three competing labels.

#### Initial review behavior

- Activating `Review resume` begins the request without first requiring the user to open an empty dashboard.
- During the first review, the rail stays collapsed and temporarily cannot expand.
- The approved 3px progress sweep runs along the rail's bottom edge.
- Use `Reviewing`, not `Reviewing...`.
- Reduced-motion mode removes the animation while retaining a visible busy state.
- Completion updates the fixed rail to its score/`View` state and announces availability accessibly.
- Do not auto-expand or auto-scroll the dashboard when results arrive.

#### Rerun behavior

- Previous results remain accessible while a rerun is in progress.
- If the dashboard is open when a rerun begins, it may remain open with the previous result labeled as updating.
- If collapsed, the rail must still allow the user to reopen the previous result while the update runs.
- A failed rerun preserves and accurately labels the previous result, including the existing stale warning behavior.

#### Expansion and collapse

- The Review rail expands in place into the existing advisory dashboard.
- On wide screens it occupies the right workspace region without moving the centered editor.
- On constrained screens it expands below the editor in normal document flow.
- The expanded dashboard retains the approved PR #3 score grid, evidence selection, adjustment ledger, findings, disclosures, and state alerts.
- Use a quiet, accessible collapse affordance in the dashboard header. Do not preserve the square mockup chevron or introduce a decorative `×` merely because it appeared in a sketch.
- The collapse control needs an accessible name, visible focus treatment, and the existing inclusive 560px touch-target behavior.

## Responsive Geometry

### Base layout: Fit, editor, Review in document order

The constrained layout is the CSS base, even though Presume remains desktop-first:

1. Fit Constraints above the editor.
2. The fixed-width document editor centered beneath it.
3. The collapsed or expanded Review region below the editor.

This is an implementation technique for deterministic reflow, not a change in product priority. The document remains the primary experience.

Placing Fit before the document and Review after it is intentional:

- Fit is an input that changes how the document is laid out.
- Review is an advisory output derived from the document.
- The resume receives uninterrupted horizontal space.
- Panels never cover the document or force the fixed canvas into a narrower desktop viewport.

The cost is scrolling between the document and Review. This is accepted graceful degradation when the three-column workbench cannot fit.

### Wide enhancement

Enable the three-region layout only when the geometry truly fits. The starting boundary is derived rather than device-named:

```text
28px left gutter
+ 320px left balancing track
+ 22px gap
+ 896px editor shell
+ 22px gap
+ 320px right Review track
+ 28px right gutter
= 1636px
```

Use the constrained document-order layout through 1639px and enable the wide enhancement inclusively at `min-width: 1640px`. If implementation reveals that the real box model cannot satisfy the stated tracks at 1640px, stop and amend the documented geometry before changing the boundary; do not silently substitute a device breakpoint.

- The two side tracks remain symmetric so the 896px editor stays on the browser centerline.
- Fit uses a narrower 220–240px card aligned toward the editor within the left track.
- Review uses the existing 320px minimum and may grow to 360px within the right track.
- The persistent collapsed Review rail occupies the right region even before a review exists, so opening Review does not create a new column or shift the document.
- The header spans the broad page frame above this composition.

Do not preserve the previous 1221/1220 right-inspector breakpoint merely because it exists today. The new layout has an additional left panel and a larger minimum geometry. Replace the old boundary contract with the derived PR #4 contract.

### Narrow resilience

- At narrower widths, Fit and Review remain in the same linear order around the editor.
- Do not introduce drawers, overlays, bottom sheets, or sticky controls in this PR.
- The fixed resume remains 816px wide.
- Horizontal overflow remains exclusively inside `.resume-canvas-scroll`.
- No document-level horizontal overflow is permitted.
- Preserve the inclusive 560px control-height contract: at 560px and below, touch-critical controls are at least 44px; at 561px and above, the approved compact desktop sizing may resume.
- Narrow behavior is graceful degradation, not a separate mobile-first composition.

## Component and Styling Strategy

### Semantic structure

Use semantic application containers:

- `<header>` for the masthead.
- `<main>` for the editor workspace.
- Appropriately labeled `<section>` / `<aside>` regions for Fit, the document editor, and Review.

Do not force the masthead or central editor shell into a shadcn `Card` if a semantic container with utilities expresses the design more clearly.

### Existing primitives

Use only the installed vocabulary where it materially helps:

- `Card` composition already used by the Review dashboard.
- `Collapsible` for Fit and supporting Review disclosures.
- `Button`, `Badge`, `Alert`, and `Separator` through their existing shared variants.

No new shadcn component, registry package, icon dependency, animation library, or Tailwind configuration is required.

### CSS boundary

- Move straightforward shell spacing, border, background, typography, and responsive composition to utilities where readable.
- Retain small custom CSS for geometry that benefits from named variables or media-query contracts, including the fixed editor-shell width, wide-workspace tracks, canvas scroller, and progress sweep.
- Reconcile shell values through the existing semantic tokens in `globals.css`.
- Remove superseded shell selectors only after confirming no live markup or tests rely on them.
- Do not mechanically migrate every remaining rule to utilities.
- In-document editor chrome (`.editor-control`, `.add-btn`, `.remove-btn`, editor rails, and their print hiding) remains custom.
- Do not move application chrome into `src/styles/resume.css`.
- Do not modify resume measurement, print, PDF-capture, or document typography rules.

## State and Behavior Boundaries

PR #4 may change only the presentation ownership and disclosure behavior explicitly approved above. It must preserve:

- The existing `ResumeReviewState` state machine and normalized result contract.
- Advisory, non-mutating review behavior.
- Existing review request, stale-result, and failed-rerun semantics.
- Fit constraint values, bounds, resize behavior, and warning calculations.
- Direct inline editing and contenteditable behavior.
- PDF export and JSON import/export semantics.
- LocalStorage keys and persistence behavior.
- `/presume/` and `/presume/editor/` routing.
- GitHub Pages base path and SPA fallback.

Showing a persistent Review rail for unconfigured/unavailable states is an explicitly approved presentation change. It replaces the current behavior in which `unconfigured` Review is completely absent. The rail opens the existing explanatory state; it does not add configuration, credentials, or provider functionality.

## Accessibility

- Preserve semantic landmarks and coherent heading order.
- Fit and Review disclosure controls expose `aria-expanded` and `aria-controls` where applicable.
- The Review start action is a real button or a single semantically equivalent control, not a clickable non-interactive card.
- Do not nest interactive buttons inside another button. If the rail contains separate start and disclosure actions for a state with existing results, use valid sibling controls with distinct accessible names.
- Loading uses `aria-busy` and an appropriate polite status announcement without repeatedly announcing animation frames.
- Completion announces that results are available without moving focus or scrolling the page.
- Scores and unavailable states remain understandable without color.
- Preserve visible focus treatment and reduced-motion behavior.
- Preserve the inclusive 560px touch-target boundary.
- Visual and DOM order match: Fit, editor, Review in constrained mode; Fit, editor, Review across wide mode.

## Testing Strategy

Testing remains conservative and contract-oriented. Do not add a test for every utility class, text fragment, or visual state.

### Existing coverage to preserve

- Direct editing, LocalStorage, resize bounds, warning behavior, export/import, review states, annotations, routing, and SPA fallback.
- Fixed 816px resume width and intentional narrow canvas scroller.
- Configured and unconfigured review flows.

### Focused updates

Replace brittle source-string assertions that encode obsolete `app.css` implementation details with behavioral or narrowly scoped structural contracts.

Add only enough focused coverage to protect the new risks:

- Derived wide-layout boundary: at the approved wide width, Fit is left of the centered editor and Review is right of it without overlap.
- One pixel below that boundary, DOM/visual order is Fit above, editor centered, Review below.
- Header is wider than the editor when space permits; the editor shell does not stretch beyond its approved maximum.
- The resume remains 816px at wide, constrained, and 358px widths.
- At 358px, overflow remains inside `.resume-canvas-scroll` and the page itself does not overflow horizontally.
- The Review rail retains the same dimensions before review, during the first loading state, and when results become available.
- First-review loading does not auto-expand the dashboard; previous results remain accessible during a rerun.
- The inclusive 560px touch-target contract remains intact for Fit, Review, and dashboard controls affected by the migration.

Prefer component tests for state routing and Playwright for actual geometry. Do not add visual snapshots, network-dependent tests, broad primitive retests, or redundant assertions for every review state.

### Release gate

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
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
  src/reviewApi.ts \
  src/reviewTypes.ts \
  src/useResumeReview.ts \
  src/useResizeEngine.ts
git diff --check
```

Manual QA prioritizes desktop geometry, then graceful degradation:

1. `/presume/editor/` at 1640px and the exact pixel below the implemented wide boundary.
2. 1440px, 1120px, and 960px constrained desktop/laptop layouts.
3. 561px, the inclusive 560px touch boundary, and 358px.
4. Review checking, ready, first loading, success, stale, unavailable/setup, configuration error, request error, and rerun-with-existing-result states.
5. Fit closed/open, active formatting warning, toolbar actions, keyboard focus, reduced motion, direct editor navigation, and browser back.
6. `/presume/` at desktop and 358px for global-style regressions.

## Protected Files and Explicit Non-Goals

Do not change:

- `src/styles/resume.css`.
- `src/types.ts` or the resume JSON format.
- `src/storage.ts` or LocalStorage keys.
- `src/export.ts` or PDF/JSON semantics.
- `src/reviewApi.ts`, provider behavior, credentials, authentication, or backend services.
- Review scoring, HackerRank evaluation semantics, normalized result types, or annotations.
- Resize-engine behavior or constraint calculations.
- Resume ordering, stable IDs, schema migrations, or reorder UI.
- Landing-page design except for regression repairs caused by shared global styles.

Import PDF remains a separate product feature and is not introduced by this migration.

Also deferred:

- A Review service-status dot in the rail or header.
- Tooltip or icon-library additions.
- Bottom sheets, drawers, sticky mobile rails, or a mobile-specific information architecture.
- Resume-document component migration to shadcn.
- A new color direction or replacement of the approved slate-and-teal identity.

## Rollback Strategy

Implementation should remain reversible in focused commits:

1. Shell structure and responsive geometry.
2. Fit-region relocation and warning composition.
3. Persistent Review rail and state presentation.
4. Dead shell-CSS and obsolete test cleanup.

If a surface regresses, revert the affected presentation commit without reverting the shadcn foundation or merged ReviewPanel work. There are no data, schema, provider, or persistence migrations to undo.

## Acceptance Summary

PR #4 is successful when:

- The resume remains the visual and geometric anchor.
- Wide screens receive the balanced Fit/editor/Review workbench without shifting the editor centerline.
- Constrained screens follow the intuitive Fit/editor/Review document order without overlays.
- The header is a broader page-level frame while the editor retains its content width.
- Review is a stable, single-line secondary rail with accurate state behavior and no persistent service dot.
- Fit and formatting diagnostics no longer create horizontal command-deck clutter.
- Decorative stage metadata and redundant outer shell framing are gone.
- Dead shell CSS is removed without disturbing in-document editor controls or print/export rules.
- Automated and manual verification prove routing, persistence, export, review, resizing, and fixed-canvas behavior remain intact.
