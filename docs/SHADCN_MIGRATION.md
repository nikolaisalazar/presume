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

Status: implementation, automated verification, task-level review, and exact-width manual QA complete; whole-branch review and publication remain pending. See [`docs/superpowers/specs/2026-07-10-shadcn-review-panel-design.md`](superpowers/specs/2026-07-10-shadcn-review-panel-design.md) and [`docs/superpowers/plans/2026-07-10-shadcn-review-panel.md`](superpowers/plans/2026-07-10-shadcn-review-panel.md).

Automated evidence (2026-07-10):

- Vitest: 13 files and 168 tests passed with the documented Node local-storage workaround.
- Playwright: 7 tests passed under `CI=1` (4 unconfigured and 3 configured-review). The disabled-service contract proves the inspector is right of and contained with the editor at 1221px, stacks above with the same left edge at 1220px, and retains 44px Review/Close actions at 560px.
- The final default unconfigured production build transformed 354 modules. Output was `index.html` 0.70 kB (0.39 kB gzip), CSS 65.21 kB (12.83 kB gzip), and JavaScript chunks of 22.03/159.64/202.38/299.48/358.14 kB (8.72/53.38/47.71/94.52/116.81 kB gzip).
- The default build was restored after configured-review E2E; `dist/index.html` and `dist/404.html` were byte-identical. Protected resume, data, export, and review implementation files were unchanged, `git diff --check` passed, and `test-results` was removed.
- The new boundary contract initially caught a 1220px left-edge mismatch. The stacked ReviewPanel now shares `--editor-shell-width` with the editor, and the focused contract and full release gate pass.

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

Status: not started.

- This is the shell-consolidation follow-up after the ReviewPanel presentation PR.
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
