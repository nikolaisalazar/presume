# shadcn/Base UI Migration Roadmap

## Purpose

This document is the durable source of truth for migrating Presume's application chrome toward shadcn/ui. The migration is incremental, reversible, and presentation-only: it must reduce duplicated component styling without changing resume data, editor behavior, export behavior, review behavior, or GitHub Pages routing.

The first implementation plan is in [`docs/superpowers/plans/2026-07-09-shadcn-base-landing.md`](superpowers/plans/2026-07-09-shadcn-base-landing.md).
The follow-on production-UI roadmap is in [`docs/superpowers/plans/2026-07-17-precision-workbench-production-ui.md`](superpowers/plans/2026-07-17-precision-workbench-production-ui.md).

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
- The approved Precision Workbench system in root [`DESIGN.md`](../DESIGN.md) is the visual authority. The app must not adopt generic rounded shadcn defaults.
- Structural shells use `2px` corners and ordinary controls use `4px` corners; the resume paper remains square.
- Existing application variables that collide with shadcn semantics are reconciled deliberately:
  - text uses of `--muted` move to `--muted-foreground`;
  - brand uses of `--accent` move to `--primary`;
  - the darker brand hover color becomes `--primary-hover`;
  - legacy application radius variables are renamed so they cannot override Tailwind's derived radius scale.
- Tailwind's global stylesheet loads before `app.css`, and `resume.css` loads last.
- The original four-PR primitive migration did not introduce Dark mode. The follow-on Precision Workbench roadmap adds persisted `System`, `Light`, and `Dark` appearance in Phase A while keeping resume paper theme-independent.

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

Status: complete; merged in PR #26 as merge commit `a1f1122dd899d8e24c03d8e9c2488610d006e335`. The final PR head `0b1ee7b783fd6fb2f70970406a270a9c3bb657d2` passed the complete automated release gate, independent code review, and exact-width agent-driven visual QA before merge. With this phase complete, the planned four-PR shadcn migration is complete; later shadcn work is optional and must be justified by a concrete product need. See [`docs/superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md`](superpowers/specs/2026-07-13-shadcn-editor-shell-consolidation-design.md).

Manual-QA remediation (2026-07-14):

- Manual QA superseded the original narrow-Fit assumption after measuring an 82px visible Fit/Review mismatch at 1640px and a 120px mismatch at wider viewports. Both wide side surfaces now use the same 360px maximum while the symmetric tracks, centered 896px editor, fixed 816px resume, and constrained layout through 1639px remain unchanged.
- The focused Playwright geometry contract first failed with a received width delta of 82px against the allowed 1px at 1640px, then passed after the Fit cap changed from 240px to 360px. The contract also requires both surfaces to measure 360px at 1920px.
- The complete release gate passed 13 Vitest files and 159 tests plus all 7 Playwright tests. The final default production build transformed 355 modules; `dist/index.html` and `dist/404.html` were byte-identical, protected resume/data/export/review/resize files had no branch diff, and `git diff --check` passed.
- Independent task review and whole-branch re-review of corrected code head `49ca2bd0ca6f1e6e4d1447db9021adffe5d40472` found no Critical, Important, or Minor issues. This later documentation-only review-record commit is not part of that reviewed code head.
- Corrected visual QA at 1920px and 1640px confirmed equal Fit/Review surfaces, the centered 896px editor, the broader header, and the fixed 816px resume without overlap or page-level overflow.
- Manual QA also found that the active-limit summary duplicated the visible Fit steppers while expanded. The trigger now keeps that summary only while collapsed and uses the installed, unboxed 18px Lucide `ChevronDown`, with a 2.25px stroke, 180-degree expanded rotation, and reduced-motion-safe transition.
- The existing premium-shell interaction test supplied Task 7's TDD contract without adding a test case. RED failed because the SVG disclosure slot was absent; GREEN passed all 14 app-integration tests after the trigger retained its collapsed summary, removed it when expanded, and exposed the presentation-only SVG slot while preserving Base UI's `aria-expanded` state.
- Before review, Task 7's complete release gate passed 13 Vitest files and 159 tests plus all 7 Playwright tests. The restored default build transformed 2112 modules; `dist/index.html` and `dist/404.html` existed and were byte-identical, protected resume/data/export/review/resize files had no branch diff, and `git diff --check` passed.
- Whole-branch review then exposed a narrow max-value edge case: at 358px, `10 page · 10 line/bullet · 16px min` made the collapsed trigger 63px tall while expansion dropped it to 48px. The existing narrow Fit Playwright case reproduced that RED result, and GREEN passed after allowing the summary cluster to shrink and visually truncate while retaining its full DOM text; collapsed and expanded heights both remain 48px at 358px and the inclusive 560px boundary, and no new test case was added.
- The complete post-correction gate again passed 13 Vitest files and 159 tests, all 7 Playwright tests, TypeScript, both prescribed production builds, byte-identical SPA entries, the protected-file check, and `git diff --check`.
- Final post-correction focused and whole-branch reviews found no Critical, Important, or Minor issues. A later independent review of head `c14896854d395e5136b4d9f695ca0f4bd56e9f6d` found only the release-process gate and missing group semantics; `ff94e4f` resolves the code finding without changing layout.
- Direct inspection of the rebuilt final code state covered 1920px, 1640px, 1639px, 960px, 561px, 560px, and 358px; collapsed/expanded Fit; ready, loading, success, stale, unavailable, configuration-error, collapsed, and expanded Review presentation; keyboard focus; reduced motion; and 50% browser zoom. The shell edges remained aligned, the intended responsive transitions held, and the known resume-content zoom defect remained isolated to issue #27.

Automated evidence (2026-07-13):

- The focused editor-shell set passed 4 files and 57 tests. The complete Vitest gate passed 13 files and 159 tests with `NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage`; Node v26.5.0 accepted the prescribed option without a local-storage warning or unhandled rejection.
- Playwright passed 7 tests under `CI=1`: 4 unconfigured and 3 configured-review. The contracts prove the inclusive 1640px three-region layout, the 1639px Fit/editor/Review stack, 44px controls at 560px and 36px controls at 561px, and 358px document overflow containment with the resume fixed at 816px.
- The default production build transformed 355 modules. Output was `index.html` 0.70 kB (0.39 kB gzip), CSS 61.12 kB (12.29 kB gzip), `purify.es` 22.03 kB (8.72 kB gzip), `index.es` 159.64 kB (53.38 kB gzip), `html2canvas.esm` 202.38 kB (47.71 kB gzip), the application index 300.99 kB (94.57 kB gzip), and `jspdf.es.min` 358.14 kB (116.81 kB gzip).
- The default build was restored after configured-review E2E. `dist/index.html` and `dist/404.html` were byte-identical; the protected paths `src/styles/resume.css`, `src/types.ts`, `src/storage.ts`, `src/export.ts`, `src/reviewApi.ts`, `src/reviewTypes.ts`, `src/useResumeReview.ts`, and `src/useResizeEngine.ts` had no diff; and `git diff --check` passed.

Independent review evidence (2026-07-13):

- Whole-branch review of implementation/documentation head `0431dc30a337733ef8cf9154ac1554e2edbee129` against the approved design found no Critical, Important, or Minor issues and concluded the branch is ready to publish as a PR. This later documentation-only review-record commit is not part of that reviewed head.
- At that review checkpoint, exact-width visual QA was still pending; the 2026-07-14 evidence below records its later completion.

Manual QA evidence (2026-07-14):

- Exact-size production-browser captures were directly inspected at 1920px, 1640px, 1639px, 960px, 561px, 560px, and 358px. The 1640px three-region enhancement and 1639px stack were clean; the resume stayed visually dominant and fixed at 816px; Fit and Review remained balanced; controls wrapped without clipping; and no document-level horizontal overflow appeared.
- Fit was inspected collapsed and expanded at desktop and narrow widths. The summary disappears only while expanded, the chevron remains clear, the header stays stable across 560/561px, and keyboard focus is visible. Reduced-motion emulation reduced the disclosure transition to an effectively instant duration.
- Review was inspected in ready, loading, success, stale, unavailable, configuration-error, collapsed, and expanded states, including the compact rail and the wide and stacked panels. Existing automated coverage continues to exercise request-error and preserved-result rerun behavior.
- The final hard-shadow correction was inspected at 50% browser zoom: shell borders remained aligned without the detached white line. The separately tracked resume-content scaling problem still reproduces at 50% and remains out of scope under issue #27.
- The user reviewed the live final layout during PR QA and accepted the equal side surfaces, distilled Fit disclosure, removed Export label, and corrected shell edges.

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

## Precision Workbench Production UI Closeout

The five-PR follow-on program uses root [`DESIGN.md`](../DESIGN.md) as its visual authority and the [production UI plan](superpowers/plans/2026-07-17-precision-workbench-production-ui.md) as its execution record. Merge evidence is kept separate from implementation checkpoints:

| Phase | PR | Implementation checkpoint | Merge commit | Merge status |
| --- | --- | --- | --- | --- |
| A — semantic foundation and appearance | #35 | `72ec00bba2379bc91b1146f8b12cdd405995700a` | `d03eb29f243482a26f9ac44d5515a275875e8fc2` | Merged |
| B — editor shell and collapsed workbench | #36 | `c4b99ec289292cb6f9bd5439decebb5ef2dfcfb0` | `04cb53eb84bf77e62c8dbd4e86137581c98464cf` | Merged |
| C — expanded Review report | #37 | `8c6b45a5e7d958131bd26846b5e1b6f3b4ae325a` | `ddaa03b6a145d85e4822b615789211168c5cc9f5` | Merged |
| D — landing identity | #38 | `24bb3c131b85f30dae97f0eb71d8c95fc560cd26` | `9536f5d3591d047e3119599b0a6bb4323475764f` | Merged |
| E — CSS retirement and closeout | Pending | Pending | Pending | In progress on `chore/precision-workbench-css-hardening` |

The Node 24 workflow-maintenance follow-up is not a visual phase: PR #39, checkpoint `1b25a38e7ed7cbb0524c8c106d02a701433c027c`, merged as `fc58d0c7743170af303fdbe88b1ed96b54322cbe`; its post-merge verification and Pages deployment passed.

### Phase E evidence — 2026-07-22

Automated verification:

- `npm run verify` passes 22 Vitest files / 224 frontend tests and 50 backend tests. On the local Node 26.5 host, `NODE_OPTIONS=--no-experimental-webstorage` disables Node's incomplete process-level `localStorage` so Vitest's jsdom environment owns the API; repository CI remains pinned to Node 24.
- The production build passes after 6,746 modules are transformed. The existing JavaScript chunk-size advisory remains non-blocking and is not a Phase E visual-system defect.
- Both Playwright configurations pass under `CI=1`: 7 unconfigured contracts and 3 configured-Review contracts.
- The cleanup removes 220 lines from the two application stylesheets while adding 33 contract-preserving or accessibility-correcting lines. Every remaining custom class selector has a source consumer. Superseded shell aliases, unused chart/sidebar/Review tokens, dead Review selector generations, and one duplicated Review declaration are retired; the `--shadow-page` bridge remains because protected resume styling consumes it.
- Focused tests enforce the complete retired-token/selector boundary, semantic `4px` Review-category radius, Light/Dark accent contrast, and the two-color focus edge on custom application and document controls.

Direct visual QA:

- `/presume/` was directly captured and inspected at 1120, 921, 920, 641, 640, and 358px in Light, Dark, and System, including saved and unsaved wording. All three open/continue-editing calls remain present, System follows the OS palette, and the inclusive 921/920 and 641/640 transitions remain intact.
- `/presume/editor/` was directly captured and inspected at 1920, 1640, 1639, 960, 561, 560, and 358px in Light and Dark with Fit open/closed and Review checking, unconfigured, disabled, configuration-error, ready, loading, success, stale, updating, fresh-error, and preserved-result error states.
- Keyboard traversal exposes visible focus, Review focus moves into the expanded panel and returns to the rail on collapse, theme choice persists across reload, and editor → landing → browser-back navigation returns to the editor.
- Reduced-motion inspection shows a static 3px full-width Review progress edge with `animation-name: none`. The existing 220ms Border Notch layout transition remains intentional, infrequent, and reduced-motion-disabled; replacing it would be a material motion redesign without evidence of a defect.
- At the 50%-zoom-equivalent desktop viewport, shell edges remain aligned, the resume remains 816px, and no page-level overflow appears. Normal and zoomed PDF exports are both one-page US Letter documents; extracted text and 144-DPI rendered pixels are identical, confirming theme/zoom-independent output.

Contrast disposition:

- The deferred Phase A contrast note was re-tested. Light `--accent-foreground` on `--accent` measured 4.400:1 and was a confirmed WCAG 2.2 AA defect in focused Fit steppers. Mapping the foreground to the existing `--primary-hover` token raises the pair to 5.552:1 without new art direction. All audited body, muted, action, focus-companion, warning, success, error, and Review text pairs pass their applicable thresholds.
- A fresh context-isolated PR review found that custom Verdigris focus outlines lacked their darker companion edge on Light application surfaces and theme-independent paper surfaces. The standalone ring measured 1.747–1.960:1 against adjacent surfaces. Review disclosures and ordinary landing chrome now pair it with `--focus-contrast`; in-document controls and the paper-backed landing hero use `--paper-ink`. Direct Light/Dark browser inspection of the masthead identity, hero CTA/credit, and document controls confirms the approved two-edge treatment remains visible without changing geometry or behavior.

An earlier independent review of checkpoint `b0346c76f0bddb7c9667d146c848676d1781793b` found no remaining issues after its shadow-token remediation. A later context-isolated review of PR head `8cf79feb52b1653ca3da496f8e18803112c90b53` found the focus-edge defect and incomplete retirement-test coverage. Re-review of first remediation `b2e3088aa0346c77135bd659ed948e8a53a832b3` caught the paper-backed hero context and final retired selector variants; those follow-up findings are also corrected test-first. Final exact-head re-review and merge evidence remain pending for PR #40, and the program is not yet complete.

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

CI uses Node 24. On Node 26, disable Node's experimental process-level Web Storage so the Vitest/jsdom environment owns `localStorage`:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run
```

That local runtime workaround is not part of the design-system migration.

## Rollback and Maintenance

- Keep foundation/configuration and each migrated surface in separate commits.
- Revert the surface commit if a visual migration regresses while retaining the foundation for repair.
- Revert the full PR to remove Tailwind/shadcn; there are no data or schema migrations to undo.
- Update this roadmap's status and link the merged PR after each phase.
- Give each future PR a focused plan under `docs/superpowers/plans/` rather than extending one implementation plan indefinitely.
