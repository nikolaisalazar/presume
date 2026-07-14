# shadcn/Base UI Migration Roadmap

## Purpose

This document is the durable source of truth for migrating Presume's application chrome toward shadcn/ui. The migration is incremental, reversible, and presentation-only: it must reduce duplicated component styling without changing resume data, editor behavior, export behavior, review behavior, or GitHub Pages routing.

The first implementation plan is in [`docs/superpowers/plans/2026-07-09-shadcn-base-landing.md`](superpowers/plans/2026-07-09-shadcn-base-landing.md).

## Current State

- Vite 6, React 18, and TypeScript single-page application.
- `/presume/` renders the landing page; `/presume/editor/` renders the editor.
- Application presentation is primarily in `src/styles/app.css`.
- Printable resume and fixed-canvas rules are in `src/styles/resume.css`.
- No Tailwind configuration, Tailwind CSS entry, `components.json`, import alias, or shadcn components existed before this migration.
- GitHub Pages deployment builds `dist/index.html` and copies it to `dist/404.html` for SPA fallback.

## Locked Decisions

### Framework and component foundation

- Use Tailwind CSS v4 through `@tailwindcss/vite`; do not add a Tailwind config file.
- Use shadcn's Base UI foundation, not Radix UI.
- Initialize the `base-nova` preset with CSS variables, TypeScript, React Server Components disabled, and pointer cursors enabled.
- Use the conventional `@/*` alias mapped to `src/*` for generated shadcn source.
- Keep React 18. Base UI supports React 17, 18, and 19; a React upgrade is not part of this migration.
- Store generated primitives in `src/components/ui` and `cn()` in `src/lib/utils.ts`.

### Styling strategy

- The landing page migration is utility-first. Landing layout, typography, spacing, responsive behavior, and decorative preview styling move to Tailwind utilities.
- shadcn components use semantic tokens and built-in variants. `className` on a shadcn component is reserved for layout concerns such as sizing within a grid.
- Presume's existing slate-and-deep-teal visual identity remains the source of truth. The app must not adopt generic rounded shadcn defaults.
- The semantic radius scale starts from `0.375rem` to keep controls rectangular and cards restrained.
- Existing application variables that collide with shadcn semantics are reconciled deliberately:
  - text uses of `--muted` move to `--muted-foreground`;
  - brand uses of `--accent` move to `--primary`;
  - the darker brand hover color becomes `--primary-hover`;
  - legacy application radius variables are renamed so they cannot override Tailwind's derived radius scale.
- Tailwind's global stylesheet loads before `app.css`, and `resume.css` loads last.
- Dark mode is not introduced by this migration.

## Product Guardrails

The migration must preserve:

- Direct inline editing and `contenteditable` behavior.
- Pretext/global resizing and formatting warnings.
- PDF export and JSON import/export.
- The public resume JSON format and LocalStorage keys.
- Advisory, non-mutating review behavior and every configured/unconfigured state.
- `/presume/` and `/presume/editor/` navigation.
- The fixed 816px resume canvas and narrow-screen canvas scroller.
- GitHub Pages base path and `dist/404.html` SPA fallback.
- Existing copy, content order, keyboard access, focus visibility, and reduced-motion behavior unless a PR explicitly documents an approved change.

The migration must not introduce backend, provider, auth, database, queue, stable-ID, schema-migration, reorder, or resume-template changes.

## Migration Phases

### PR 1: Foundation and landing page

Status: complete; merged in PR #23 with automated and exact-width manual visual verification complete.

- Add Tailwind v4, Base UI shadcn configuration, semantic tokens, and the `@/*` alias.
- Add and use `Button`, `Card`, `Badge`, and `Separator`.
- Extract the landing surface from `App.tsx` into `LandingPage.tsx`.
- Convert the landing page to Tailwind utilities while preserving its current design and responsive behavior.
- Remove landing-only CSS after the replacement is verified.
- Do not migrate editor or resume-document components.

### PR 2: Header and command deck

Status: complete; merged in PR #24 with automated verification, exact-width manual QA, and independent whole-branch review complete.

Automated evidence (2026-07-10):

- Vitest: 13 files and 162 tests passed with the documented Node local-storage workaround.
- Playwright: 7 tests passed (4 unconfigured and 3 configured-review). The release-gate run used `CI=1` so Playwright started its own port-4173 preview instead of reusing an unrelated server.
- The production build completed after 353 modules were transformed. The default unconfigured build was restored after configured-review E2E, and `dist/index.html` and `dist/404.html` were byte-identical.
- Protected resume, data, export, and review implementation files remained unchanged; `git diff --check` passed.
- Whole-branch review found one Review-focus defect; commit `3b6c1d3` removed the state-specific override so every Review tone inherits the shared blue keyboard ring. Re-review found no remaining code-level issues.
- Final independent PR review found that ReviewPanel actions still referenced the removed legacy `toolbar-btn` class. Commit `17a4264` migrated both actions to the shared `Button` primitive and added exact-560px touch-target coverage; re-review approved the corrected branch with no actionable findings.

Manual QA evidence (2026-07-10):

- At 1120px and 960px, the command deck remains subordinate to the fixed 816px resume, the desktop hierarchy stays document-led, and no overlap or page-level horizontal overflow appears.
- At 561px, Toolbar and stepper controls measure 36px high. At the inclusive 560px boundary and at 358px, they measure 44px; action groups remain coherent and the collapsed Fit Constraints summary stays usable.
- At 358px, the document width remains 358px, the resume remains 816px, and the intentional canvas scroller measures 302px client width / 836px scroll width with no document-level overflow.
- Fit Constraints starts closed, reveals in 180ms, preserves every bound, and becomes effectively instant under reduced motion. The integrated warning remains readable at 960px and 358px.
- Review idle/loading/success/stale/setup-needed/connection-error tones render blue/blue/green/amber/amber/red as approved. The one-pixel loading sweep runs only while reviewing, becomes static under reduced motion, and every tone shows the shared blue keyboard focus ring.
- JSON export downloaded `resume.json`, PDF export downloaded `resume.pdf`, JSON import replaced the resume and persisted it to LocalStorage, and Reset displayed the existing confirmation without mutating after cancellation.
- Landing routes at 1120px and 358px retained their approved PR #23 composition with no page-level overflow.

- Migrate the non-interactive saved status to `Badge` and the interactive Review status to semantic `Button` variants.
- Add `Collapsible` and rebuild Fit Constraints as a compact command strip while preserving its local closed-by-default state and custom steppers.
- Migrate Toolbar actions to `Button` and formatting warnings to `Alert`.
- Use `Separator` only for the genuine boundaries inside the newly unified command deck.
- Remove all replaced header, settings, toolbar, warning, and command-deck presentation CSS in the same PR while keeping editor-shell geometry custom.

### PR 3: Review panel presentation

Status: complete; merged in PR #25 as merge commit `2b252cc0cba3b5a4ca53aff4938f799e3cce3d9e`. Implementation, automated verification, exact-width manual QA, task-level review, whole-branch review, and independent re-review completed before merge. Independent re-review against head `0cafaad1e7c85eca5dacabfe31799d4e82b6e518` found no remaining actionable code findings. See [`docs/superpowers/specs/2026-07-10-shadcn-review-panel-design.md`](superpowers/specs/2026-07-10-shadcn-review-panel-design.md) and [`docs/superpowers/plans/2026-07-10-shadcn-review-panel.md`](superpowers/plans/2026-07-10-shadcn-review-panel.md).

Automated evidence (2026-07-10):

- Vitest: 13 files and 170 tests passed with the documented Node local-storage workaround after final review remediation.
- Playwright: 7 tests passed under `CI=1` (4 unconfigured and 3 configured-review). The disabled-service contract proves the inspector is right of and contained with the editor at 1221px, stacks above with the same left edge at 1220px, and retains 44px Review/Close actions at 560px.
- The final default unconfigured production build transformed 354 modules. Output was `index.html` 0.70 kB (0.39 kB gzip), CSS 65.08 kB (12.76 kB gzip), and JavaScript chunks of 22.03/159.64/202.38/299.90/358.14 kB (8.72/53.38/47.71/94.60/116.81 kB gzip).
- The default build was restored after configured-review E2E; `dist/index.html` and `dist/404.html` were byte-identical. Protected resume, data, export, and review implementation files were unchanged, `git diff --check` passed, and `test-results` was removed.
- The new boundary contract initially caught a 1220px left-edge mismatch. The stacked ReviewPanel now shares `--editor-shell-width` with the editor, and the focused contract and full release gate pass.
- Whole-branch review found one-sided/sign adjustment ledger defects and a missing stale warning beside failed reruns. Commit `7e4759c` corrected all three with focused regressions; re-review returned `Ready` with no remaining findings.
- A later independent PR review found that the panel title was not a semantic heading and that successful-result metadata/boundaries still bypassed the approved `Badge` and `Separator` primitives. The remediation restores the level-two `Review` heading, migrates the tier and finding severities to semantic Badge variants, replaces ledger punctuation with a conditional Separator, and removes the superseded severity CSS. Fresh verification passed 170 unit tests, 7 E2E tests, the production build, SPA-fallback comparison, protected-file check, and `git diff --check`. Independent re-review against head `0cafaad1e7c85eca5dacabfe31799d4e82b6e518` found no remaining actionable code findings.

Manual QA evidence (2026-07-10):

- At 1440px and 1221px, the Review inspector measured 360px and remained to the right of the document-led editor. At 1220px it stacked above the editor with the same left edge and an 896px width.
- At 960px, 561px, 560px, and 358px the panel remained stacked with no document-level overflow. Review/Close measured 36px at 561px and 44px at 560px and 358px.
- The resume remained 816px at every width. At 358px, overflow stayed inside `.resume-canvas-scroll` (302px client width / 836px scroll width) while the document width remained 358px.
- Successful category selection and evidence replacement, closed/open strengths and adjustment disclosures, keyboard focus, loading, disabled, config-error, stale, request-error with and without preserved results, and empty-result presentation rendered coherently. Reduced motion removed the loading sweep animation.
- Checking and unconfigured copy/semantics are covered by component tests; they are not stable configured-browser destinations for visual capture. Landing pages at 1120px and 358px retained their approved composition with no overflow, and direct editor navigation/browser back remained functional.

- This is the next presentation-only surface PR after PR 2.
- Compose `Card`, `Alert`, `Badge`, `Button`, and `Separator` around the existing review state machine.
- Preserve every configured, checking, disabled, config-error, loading, success, stale, and request-error state.
- Keep review advisory and non-mutating.

### PR 4: Editor-shell consolidation

Status: implementation complete in open PR #26 on `feat/shadcn-editor-shell-consolidation`. Independent whole-branch re-review is complete against corrected implementation/documentation head `49ca2bd0ca6f1e6e4d1447db9021adffe5d40472`, with no Critical, Important, or Minor findings. Merge has not occurred, and exact-width manual in-app-browser QA remains a pre-merge gate. See [`docs/superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md`](superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md).

Manual-QA remediation (2026-07-14):

- Manual QA superseded the original narrow-Fit assumption after measuring an 82px visible Fit/Review mismatch at 1640px and a 120px mismatch at wider viewports. Both wide side surfaces now use the same 360px maximum while the symmetric tracks, centered 896px editor, fixed 816px resume, and constrained layout through 1639px remain unchanged.
- The focused Playwright geometry contract first failed with a received width delta of 82px against the allowed 1px at 1640px, then passed after the Fit cap changed from 240px to 360px. The contract also requires both surfaces to measure 360px at 1920px.
- The complete release gate passed 13 Vitest files and 159 tests plus all 7 Playwright tests. The final default production build transformed 355 modules; `dist/index.html` and `dist/404.html` were byte-identical, protected resume/data/export/review/resize files had no branch diff, and `git diff --check` passed.
- Independent task review and whole-branch re-review of corrected code head `49ca2bd0ca6f1e6e4d1447db9021adffe5d40472` found no Critical, Important, or Minor issues. This later documentation-only review-record commit is not part of that reviewed code head.
- Corrected visual QA at 1640px and the wider mismatch viewport is still pending and must not be inferred from the automated contract.
- Manual QA also found that the active-limit summary duplicated the visible Fit steppers while expanded. The trigger now keeps that summary only while collapsed and uses the installed, unboxed 18px Lucide `ChevronDown`, with a 2.25px stroke, 180-degree expanded rotation, and reduced-motion-safe transition.
- The existing premium-shell interaction test supplied Task 7's TDD contract without adding a test case. RED failed because the SVG disclosure slot was absent; GREEN passed all 14 app-integration tests after the trigger retained its collapsed summary, removed it when expanded, and exposed the presentation-only SVG slot while preserving Base UI's `aria-expanded` state.
- Before review, Task 7's complete release gate passed 13 Vitest files and 159 tests plus all 7 Playwright tests. The restored default build transformed 2112 modules; `dist/index.html` and `dist/404.html` existed and were byte-identical, protected resume/data/export/review/resize files had no branch diff, and `git diff --check` passed.
- Whole-branch review then exposed a narrow max-value edge case: at 358px, `10 page · 10 line/bullet · 16px min` made the collapsed trigger 63px tall while expansion dropped it to 48px. The existing narrow Fit Playwright case reproduced that RED result, and GREEN passed after allowing the summary cluster to shrink and visually truncate while retaining its full DOM text; collapsed and expanded heights both remain 48px at 358px and the inclusive 560px boundary, and no new test case was added.
- The complete post-correction gate again passed 13 Vitest files and 159 tests, all 7 Playwright tests, TypeScript, both prescribed production builds, byte-identical SPA entries, the protected-file check, and `git diff --check`.
- Final post-correction focused and whole-branch reviews found no Critical, Important, or Minor issues. Manual visual QA remains pending before merge.
- Focused visual QA of the collapsed summary, expanded title-and-chevron header, rotation quality, stable header height, keyboard disclosure behavior, and reduced-motion treatment remains pending and must not be inferred from automated coverage.

Automated evidence (2026-07-13):

- The focused editor-shell set passed 4 files and 57 tests. The complete Vitest gate passed 13 files and 159 tests with `NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage`; Node v26.5.0 accepted the prescribed option without a local-storage warning or unhandled rejection.
- Playwright passed 7 tests under `CI=1`: 4 unconfigured and 3 configured-review. The contracts prove the inclusive 1640px three-region layout, the 1639px Fit/editor/Review stack, 44px controls at 560px and 36px controls at 561px, and 358px document overflow containment with the resume fixed at 816px.
- The default production build transformed 355 modules. Output was `index.html` 0.70 kB (0.39 kB gzip), CSS 61.12 kB (12.29 kB gzip), `purify.es` 22.03 kB (8.72 kB gzip), `index.es` 159.64 kB (53.38 kB gzip), `html2canvas.esm` 202.38 kB (47.71 kB gzip), the application index 300.99 kB (94.57 kB gzip), and `jspdf.es.min` 358.14 kB (116.81 kB gzip).
- The default build was restored after configured-review E2E. `dist/index.html` and `dist/404.html` were byte-identical; the protected paths `src/styles/resume.css`, `src/types.ts`, `src/storage.ts`, `src/export.ts`, `src/reviewApi.ts`, `src/reviewTypes.ts`, `src/useResumeReview.ts`, and `src/useResizeEngine.ts` had no diff; and `git diff --check` passed.

Independent review evidence (2026-07-13):

- Whole-branch review of implementation/documentation head `0431dc30a337733ef8cf9154ac1554e2edbee129` against the approved design found no Critical, Important, or Minor issues and concluded the branch is ready to publish as a PR. This later documentation-only review-record commit is not part of that reviewed head.
- Exact-width manual in-app-browser QA remains pending and is still required before merge.

Manual QA evidence (2026-07-13):

- No manual viewport or state was inspected. The required browser-client setup reported `Browser is not available: iab`, and the prescribed browser discovery call returned no available browser surfaces.
- Manual editor checks at 1640px, 1639px, 1440px, 1120px, 960px, 561px, 560px, and 358px are pending, including visible hierarchy, overlap, overflow, and the compact-to-touch boundary. Landing-page spot checks at desktop width and 358px are also pending.
- Manual Fit closed/open and active-warning checks; Review checking, ready, first loading, success, stale, unavailable, configuration-error, request-error, and rerun-with-result checks; keyboard focus and reduced-motion checks; direct navigation and browser Back; JSON import/export; PDF export; Reset cancellation; and LocalStorage persistence are pending. Automated Playwright coverage was not substituted for manual completion.

- The final region composition retains a broader fluid framed header, uses Fit → editor → Review DOM order, places Fit and the fixed-height Review rail in symmetric side tracks around the centered 896px editor at 1640px and above, and stacks Fit above and Review below the centered editor through 1639px.
- Document actions and the fixed 816px resume canvas now share one workbench; formatting diagnostics live with Fit; the persistent Review rail owns state disclosure and explicitly expands the dashboard; and the fixed-canvas scroller, print/export behavior, and protected resume styling remain custom.

- Retain a fluid framed header that is broader than the fixed-width editor workbench.
- On genuinely wide screens, place Fit Constraints left of the centered document editor and the persistent Review rail/dashboard to its right.
- When those regions do not fit, use the approved document order: Fit above, editor centered, Review below.
- Consolidate document actions and the resume stage into one workbench, remove redundant outer shell framing, and remove decorative stage metadata.
- Move formatting diagnostics into the Fit region and keep healthy formatting silent.
- Replace the header Review control with a fixed-height, single-line workspace rail that preserves every review state and the approved loading sweep.
- Convert remaining workspace and resume-stage application chrome to utilities where doing so removes meaningful legacy CSS.
- Audit and remove dead application-chrome selectors after PRs 2 and 3.
- Preserve the fixed resume canvas, scroller, print/export behavior, and `src/styles/resume.css` as custom layout infrastructure.

### Later evaluation

- Add `Tooltip` only for ambiguous icon-only controls.
- Add `Tabs` only if a later information architecture requires tabbed content.
- Do not migrate the resume document itself without a separate approved design and evidence that print/export behavior benefits.

## Components That Stay Custom

- `ResumePage`, `ResumeHeader`, `Section`, `Entry`, `Bullet`, and inline review annotations.
- `src/styles/resume.css`, including print, measurement, contenteditable, and fixed-canvas rules.
- The landing editor-preview illustration and workflow rail composition, even though their styling moves to Tailwind utilities.
- PDF capture/export internals, LocalStorage hooks, resize engine, review API, and review state hooks.

## Testing Contract

Every migration PR must run:

```sh
npm test -- --run
npm run build
npm run test:e2e
```

Acceptance also requires:

- `dist/index.html` and `dist/404.html` both exist and are byte-identical.
- Landing and editor routes work from direct navigation.
- No document-level horizontal overflow at narrow widths.
- Resume canvas remains 816px and scrolls only inside its scroller when necessary.
- PDF export produces a nonblank file.
- LocalStorage, JSON import/export, and review states remain covered.
- No committed visual snapshots or network-dependent tests.
- Manual comparison at desktop, tablet, and 358px mobile widths for UI-only PRs.

CI uses Node 20. On Node 26, the current Vitest/jsdom setup requires:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
```

That local runtime workaround is not part of the design-system migration.

## Rollback and Maintenance

- Keep foundation/configuration and each migrated surface in separate commits.
- Revert the surface commit if a visual migration regresses while retaining the foundation for repair.
- Revert the full PR to remove Tailwind/shadcn; there are no data or schema migrations to undo.
- Update this roadmap's status and link the merged PR after each phase.
- Give each future PR a focused plan under `docs/superpowers/plans/` rather than extending one implementation plan indefinitely.
