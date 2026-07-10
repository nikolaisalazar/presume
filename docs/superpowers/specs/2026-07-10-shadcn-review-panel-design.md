# Shadcn Review Panel Presentation Design

## Purpose

PR #3 migrates the existing Review Panel presentation to Presume's shared shadcn/Base UI vocabulary. It is a presentation-only change: the panel becomes clearer, more compact, and more consistent with the command deck while the review state machine, API contract, annotations, and resume behavior remain unchanged.

Presume remains a desktop-first, document-adjacent editor. The fixed 816px resume is the primary visual anchor; Review is a secondary inspector that explains an advisory evaluation without modifying the document.

## Approved Product Direction

### Inspector placement

- Above 1220px, Review remains a sticky 320–360px inspector to the right of the editor.
- At 1220px and below, the same report stacks above the editor.
- The stacked report keeps the same information architecture and interactions. It does not become a separate mobile product.
- A bottom-sheet treatment is explicitly deferred to a future mobile-accessibility project.
- The fixed 816px resume continues to overflow only inside `.resume-canvas-scroll`.

### Successful-report hierarchy

The successful report appears in this order:

1. Review header, advisory label, Review Again action, and Close action.
2. Stock HackerRank overall evaluation.
3. Selectable 2×2 category grid.
4. Evidence for the selected category.
5. Compact bonus-and-deduction ledger.
6. Areas for improvement.
7. Presume resume findings, when returned.
8. Initially collapsed supporting sections: key strengths and adjustment details.

This ordering is evidence-led without turning the inspector into a dashboard. The category grid supplies a compact scan; the selected evidence explains the model-generated score.

## HackerRank Evaluation Semantics

Presume treats the stock `interviewstreet/hiring-agent` evaluation as the source of truth. PR #3 does not create a Presume-specific grade, percentage, weighting system, or rubric.

The stock categories are:

- Open Source: 0–35
- Self Projects: 0–30
- Production: 0–25
- Technical Skills: 0–10
- Bonus points: up to 20
- Deductions
- Key strengths
- Areas for improvement

The panel displays the evaluation fields delivered by Presume's existing normalized review contract. It does not change the adapter or scoring calculation in this PR. Connecting Presume directly to the upstream agent, local models, or user-supplied credentials remains separate provider/backend work.

The overall result remains prominently labeled as advisory. Bonus and deduction values are presented faithfully rather than converted into a Presume-defined percentage or grade.

## Component Composition

The panel uses only primitives already installed in the project:

- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, and `CardContent` for the inspector shell.
- `Button` for Review Again, Close, and category selection.
- `Badge` for advisory/status metadata and finding severities.
- `Alert`, `AlertTitle`, and `AlertDescription` for service and request states.
- `Separator` for genuine report boundaries.
- `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` for supporting details that start closed.

Do not turn every report section into a card. Categories are interactive score controls, adjustments are a compact ledger, and ordinary report sections use typography and separators for hierarchy.

## Category Selection

The four category controls form a compact 2×2 grid. Each control shows:

- The category label.
- The achieved score.
- The category's actual maximum.
- A restrained proportional indicator.
- Clear hover, selected, focus-visible, and disabled states.

The initial category is the category with the largest raw point deficit:

```text
deficit = maxScore - score
```

Raw point deficit is intentional because the category maxima differ. Ties resolve by the stock rubric order: Open Source, Self Projects, Production, then Technical Skills. If no categories exist, no category is selected and the evidence region is omitted.

Selection rules:

- A new completed review selects the new largest-deficit category.
- Selection persists while the user edits the resume and the current result becomes stale.
- Selecting a category changes only the evidence region.
- Selection never changes the resume, review result, score, or annotations.
- The evidence region has a stable, category-specific heading such as `Open Source evidence`.

The controls must be real accessible buttons, not clickable decorative cards. Keyboard users can tab to each category and activate it with the button's native keyboard behavior. Arrow-key roving behavior is not required for this button grid; native buttons provide the clearest semantics without introducing a tab widget whose panels are not peer navigation destinations.

## Supporting Information and Disclosure

### Always visible

- Overall advisory evaluation.
- Category grid.
- Selected category evidence.
- Compact score-adjustment ledger.
- Areas for improvement.
- Presume resume findings.

### Initially collapsed

- Key strengths.
- Detailed bonus and deduction explanations.

The adjustment summary is a single restrained ledger, for example:

```text
Bonus +9 · Deductions −2 · Show details
```

Bonus and deduction values do not receive separate cards. Empty sections are omitted rather than rendered as empty containers. Disclosure state is local presentation state and does not persist to LocalStorage.

## Review States

The outer shell remains stable across all states. Non-success states use concise semantic alerts and only the space their message requires.

- `checking`: neutral alert explaining that availability is being checked.
- `unconfigured`: setup-needed alert using the existing message.
- `disabled`: unavailable alert using the existing message.
- `config_error`: destructive alert using the normalized error message.
- `loading`: stable shell and existing Reviewing treatment; no spinner, fake percentage, or decorative progress animation is added.
- `success`: the approved score grid and evidence-led report.
- `stale`: previous results remain visible with an amber stale alert.
- `error` without a result: destructive alert only.
- `error` with a previous result: destructive alert plus the preserved report, including the existing stale explanation when applicable.
- Result with no detailed arrays: overall score remains visible with a restrained `No detailed findings returned.` message.

Service and request failures must not tint the entire inspector. Review is secondary to editing, and a service problem must not visually overpower the resume.

## Responsive Behavior

The layout remains desktop-first.

- Above 1220px: sticky right-side inspector, maximum width 360px.
- At 1220px and below: full-width inspector above the editor, bounded by the existing 816px review-panel maximum.
- At 560px and below: Review Again and Close retain the shared 44px editor touch-target height.
- Above 560px: those controls retain the shared 36px editor height.
- The 2×2 category grid remains two columns at narrow widths unless exact-width visual QA demonstrates unreadable content. Category labels may wrap; scores and maxima must remain legible.
- No page-level horizontal overflow is permitted.
- The resume remains 816px wide and its overflow remains contained by `.resume-canvas-scroll`.

The PR does not add a collapsed mobile summary or bottom sheet. Those are different interaction models and require a separate accessibility design exercise.

## Accessibility

- Preserve the complementary landmark and `Resume review` accessible name.
- Preserve `aria-controls` and `aria-expanded` behavior on the header Review control.
- Use semantic headings in document order inside the panel.
- Category controls expose a visible selected state and `aria-pressed` reflecting selection.
- Button focus uses the shared focus-visible treatment in every state.
- Alerts preserve readable contrast and appropriate alert semantics without repeatedly announcing static successful content.
- Collapsible triggers expose expanded state through Base UI and remain keyboard operable.
- Review Again and Close meet the inclusive 560px touch-target contract.
- Existing reduced-motion behavior remains intact; no new motion is necessary for this PR.

## Architecture and File Boundaries

`ReviewPanel.tsx` remains the public component receiving `ResumeReviewState` and the existing callbacks. Presentation helpers may be extracted when doing so keeps the main state routing readable, but the review hook and normalized result types remain untouched.

Expected presentation units are:

- Review shell and state router.
- Successful result summary.
- Category selector and evidence region.
- Adjustment ledger and disclosure.
- Strength, improvement, and finding sections.
- Compact alert/empty states.

Pure selection helpers, including largest-deficit selection, should be exported only if direct testing materially improves clarity. Do not create generalized scoring utilities or a new state-management layer.

## Explicit Non-Goals

PR #3 does not change:

- The review API, normalized result schema, or state machine.
- HackerRank scoring or prompt behavior.
- Provider setup, authentication, credentials, local-model integration, or backend services.
- Advisory/non-mutating behavior.
- Inline annotation matching or rendering inside the resume.
- Resume JSON, stable IDs, LocalStorage, import/export, or PDF generation.
- Resume ordering, direct editing, resizing, or formatting warnings.
- `src/styles/resume.css`, fixed-canvas geometry, or print rules.
- Landing-page presentation.

## Styling and Cleanup

- Preserve Presume's restrained slate-and-teal visual language.
- Avoid generic rounded shadcn styling, nested cards, heavy state fills, and decorative motion.
- Use semantic tokens and primitive variants for component styling.
- Use utility classes for ReviewPanel composition where practical.
- Remove legacy ReviewPanel presentation selectors only after their replacements are verified unused.
- Keep editor-shell geometry custom; do not expand PR #3 into the PR #4 shell-consolidation work.

## Testing Strategy

Testing remains conservative and contract-oriented.

Preserve existing coverage for every review state, result visibility, annotation behavior, and advisory actions. Add focused coverage for:

- Largest-raw-deficit default selection, including deterministic tie order.
- Category selection replacing the evidence region without mutating the result.
- Default disclosure state for strengths and adjustment details.
- Existing 560px ReviewPanel action sizing if refactoring changes the relevant markup.

Do not add broad primitive tests, visual snapshots, or a separate test for every CSS class. Extend E2E only for a concrete browser contract not reliably covered by component tests.

Run the full release gate:

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
  src/reviewApi.ts
git diff --check
```

Manual QA prioritizes `/presume/editor/` at 1440px and 1221px where the right inspector is active, followed by the exact stacking boundary at 1220px, then 960px, 561px, 560px, and 358px. Verify the successful report, every service/request state, stale results, keyboard focus, disclosure behavior, no page overflow, and the fixed 816px resume scroller. Spot-check `/presume/` for global-style regressions.

## Rollback

Keep state routing, successful-report composition, and legacy CSS cleanup in focused commits. If the surface migration regresses, revert the ReviewPanel presentation commits without reverting the shared shadcn foundation or PR #2 command deck.
