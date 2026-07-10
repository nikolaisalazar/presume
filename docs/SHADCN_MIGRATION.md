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

Status: planned in `docs/superpowers/plans/2026-07-10-shadcn-shared-editor-controls.md`; implementation not started.

- Migrate the non-interactive saved status to `Badge` and the interactive Review status to semantic `Button` variants.
- Add `Collapsible` and rebuild Fit Constraints as a compact command strip while preserving its local closed-by-default state and custom steppers.
- Migrate Toolbar actions to `Button` and formatting warnings to `Alert`.
- Use `Separator` only for the genuine boundaries inside the newly unified command deck.
- Remove all replaced header, settings, toolbar, warning, and command-deck presentation CSS in the same PR while keeping editor-shell geometry custom.

### PR 3: Review panel presentation

Status: not started.

- Compose `Card`, `Alert`, `Badge`, `Button`, and `Separator` around the existing review state machine.
- Preserve every configured, checking, disabled, config-error, loading, success, stale, and request-error state.
- Keep review advisory and non-mutating.

### PR 4: Editor-shell consolidation

Status: not started.

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
