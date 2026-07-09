# shadcn Base Foundation and Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize Tailwind v4 and shadcn/Base UI, then migrate the landing page to `Button`, `Card`, `Badge`, `Separator`, and utility-first styling without changing application behavior.

**Architecture:** Add a semantic Tailwind/shadcn layer before the existing custom styles. Extract the landing page into a focused component and replace only its handcrafted CSS; leave the editor shell and printable resume implementation intact. Use existing integration and browser contracts as regression boundaries.

**Tech Stack:** React 18, TypeScript, Vite 6, Tailwind CSS 4, `@tailwindcss/vite`, shadcn `base-nova`, Base UI, Vitest, Testing Library, Playwright.

## Global Constraints

- Preserve `/presume/` and `/presume/editor/` routing.
- Preserve LocalStorage persistence, PDF export, JSON import/export, review behavior, direct editing, and Pretext resizing.
- Do not change the resume JSON format, stable IDs, schema, ordering, backend, provider, auth, database, or queue behavior.
- Keep `src/styles/resume.css` unchanged.
- Keep the 816px fixed resume canvas and narrow-screen scroller behavior.
- Use Base UI `render`, never Radix `asChild`, when a polymorphic primitive is required.
- Use shadcn semantic tokens and variants; do not override component colors or typography at call sites.
- Use `gap-*`, not `space-x-*` or `space-y-*`.
- Do not add Alert, Collapsible, Tooltip, or Tabs in this PR. Do not use icons; retain only icon-library dependencies required by the selected CLI preset.
- Do not add brittle visual snapshots or network-dependent tests.

---

### Task 1: Commit the Durable Migration Documentation

**Files:**
- Create: `docs/SHADCN_MIGRATION.md`
- Create: `docs/superpowers/plans/2026-07-09-shadcn-base-landing.md`
- Modify: `docs/README.md`

**Interfaces:**
- Produces: the long-lived roadmap and this first-PR execution contract.

- [ ] **Step 1: Validate the documents are linked and contain no placeholders**

Run:

```sh
rg -n "SHADCN_MIGRATION|shadcn-base-landing" docs/README.md docs/SHADCN_MIGRATION.md docs/superpowers/plans/2026-07-09-shadcn-base-landing.md
rg -n "T[B]D|T[O]DO|implement lat[e]r|fill i[n]" docs/SHADCN_MIGRATION.md docs/superpowers/plans/2026-07-09-shadcn-base-landing.md
```

Expected: the first command finds the links; the second command returns no matches.

- [ ] **Step 2: Commit the documentation**

```sh
git add docs/README.md docs/SHADCN_MIGRATION.md docs/superpowers/plans/2026-07-09-shadcn-base-landing.md
git commit -m "docs: plan incremental shadcn migration"
```

### Task 2: Add the Tailwind and shadcn/Base Foundation

**Files:**
- Create: `components.json`
- Create: `src/styles/globals.css`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/separator.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `tsconfig.app.json`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Produces: `@/*` imports, semantic Tailwind tokens, Base UI components under `@/components/ui/*`, and `cn()` under `@/lib/utils`.

- [ ] **Step 1: Install and configure Tailwind v4 for Vite**

Run:

```sh
npm install -D tailwindcss@^4.3.2 @tailwindcss/vite@^4.3.2 @types/node
```

Add `tailwindcss()` to the Vite plugins and map `@` to `./src`. Add the matching `baseUrl` and `paths` entries to `tsconfig.json` and `tsconfig.app.json`.

- [ ] **Step 2: Create the global Tailwind entry and import it first**

Create `src/styles/globals.css` with the Tailwind import, shadcn component CSS import, semantic tokens, and `@theme inline` mappings produced by the CLI. Ensure the stylesheet order in `App.tsx` is:

```ts
import './styles/globals.css'
import './styles/app.css'
import './styles/resume.css'
```

- [ ] **Step 3: Initialize the approved Base UI preset**

Run:

```sh
npx shadcn@latest init --base base --preset base-nova --pointer
npx shadcn@latest info --json
```

Expected info: Vite, TypeScript, Tailwind v4, `rsc: false`, Base UI, `@/*` aliases, and no installed components yet.

- [ ] **Step 4: Add only the four approved primitives**

Run:

```sh
npx shadcn@latest add button card badge separator --yes
npx shadcn@latest info --json
```

Expected: the components list contains exactly `button`, `card`, `badge`, and `separator`.

- [ ] **Step 5: Review generated source and reconcile tokens**

Read every generated file. Verify Base UI imports, `render` APIs, full Card composition exports, `data-slot` attributes, semantic classes, and the configured icon library. In `app.css`, replace legacy variable collisions without changing computed colors:

```txt
var(--muted)         -> var(--muted-foreground)
var(--accent)        -> var(--primary)
var(--accent-strong) -> var(--primary-hover)
--radius-sm/md/lg    -> --app-radius-sm/md/lg
```

Set `--radius: 0.375rem`, `--primary: #0f5f5c`, `--primary-hover: #0a4543`, `--primary-foreground: #ffffff`, `--foreground: #0f172a`, `--muted-foreground: #536173`, `--border: #cbd5e1`, `--ring: #2563eb`, and `--destructive: #dc2626` in the global semantic theme.

- [ ] **Step 6: Verify the foundation before landing usage**

Run:

```sh
npm run build
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
```

Expected: build succeeds and all 158 baseline tests pass.

- [ ] **Step 7: Commit the foundation**

```sh
git add components.json package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json src/styles/globals.css src/styles/app.css src/App.tsx src/lib src/components/ui
git commit -m "chore: initialize shadcn base ui"
```

### Task 3: Define the Landing Primitive Contract with a Failing Test

**Files:**
- Modify: `src/tests/appIntegration.test.tsx`

**Interfaces:**
- Produces: a behavioral/structural contract proving the landing uses the four approved primitives while retaining accessible content.

- [ ] **Step 1: Add the primitive-composition test**

Add this test in the landing-page section of `src/tests/appIntegration.test.tsx`:

```tsx
it('composes the landing page from the approved design-system primitives', () => {
  vi.stubEnv('VITE_REVIEW_API_URL', '')
  window.history.pushState({}, '', '/presume/')

  const { container } = render(<App />)

  expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(3)
  expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(4)
  expect(container.querySelector('[data-slot="badge"]')).toHaveTextContent(
    'No account required'
  )
  expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
  expect(screen.getByRole('heading', {
    name: 'Edit your resume like the final document.',
  })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx -t "approved design-system primitives"
```

Expected: FAIL because the current landing page has no `data-slot` primitives.

### Task 4: Migrate the Landing Page and Reach GREEN

**Files:**
- Create: `src/components/LandingPage.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

**Interfaces:**
- Consumes: `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `Badge`, and `Separator`.
- Produces: `LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps)` with unchanged routing callbacks and copy.

- [ ] **Step 1: Extract `LandingPage` without changing its public behavior**

Move the complete current `LandingPage` function from `App.tsx` into `src/components/LandingPage.tsx`. Export both the component and this exact props interface:

```ts
export interface LandingPageProps {
  hasSavedResume: boolean
  onOpenEditor: () => void
}
```

The exported function must remain `export function LandingPage({ hasSavedResume, onOpenEditor }: LandingPageProps)`. Import it into `App.tsx`; keep `hasSavedResume()` and the route callbacks in `App`. Do not alter the moved JSX until Steps 2-5 so the extraction and migration remain separately reviewable in the diff.

- [ ] **Step 2: Replace the three landing actions with Button**

- Navigation action: `variant="outline"`, default size.
- Hero and privacy actions: default variant, `size="lg"`.
- Preserve `Continue editing`, `Open editor`, `Start editing`, and `Open the editor` selection exactly.

- [ ] **Step 3: Replace feature articles with full Card composition**

Render four explicit `Card size="sm"` components using `CardHeader`, `CardTitle`, and `CardDescription`. Preserve the four current headings and descriptions. Use `className="h-full"` only for grid layout.

- [ ] **Step 4: Use Badge and Separator in their approved locations**

- Render `Badge variant="outline"` for `No account required` next to `Stored locally in your browser`.
- Replace the custom top border above `Not a job board, account-gated builder, or resume content farm.` with a decorative `Separator`.

- [ ] **Step 5: Convert landing presentation to semantic Tailwind utilities**

Remove the `app app--landing` dependency from the landing root. Preserve:

- 1120px maximum shell width.
- Asymmetric desktop hero and 58px desktop heading.
- Hidden preview at 640px and below.
- Four/two/one-column feature layout.
- Horizontal desktop and vertical narrow workflow rail.
- Existing comparison and privacy stacking breakpoints.
- Current deep-teal, slate, translucent-white, restrained-radius visual direction.

Use semantic tokens for colors and component variants. Arbitrary utilities are allowed only for established layout dimensions, the document preview illustration, and the workflow connector geometry.

- [ ] **Step 6: Remove obsolete landing CSS and update the CSS source contract**

Delete `.app--landing` and `.landing-*` rules from `app.css`, retaining only selectors still shared by the editor brand mark. Remove the obsolete `formats the landing workflow as a full-width horizontal process rail` source-string test from `responsiveLayout.test.ts`; browser behavior replaces it.

- [ ] **Step 7: Add a responsive browser contract**

In `e2e/unconfigured.spec.ts`, add a test that:

- Loads `/presume/` at 1120px and verifies the three workflow list items share the same top coordinate in ascending horizontal order.
- Changes to 358px and verifies no document overflow, the preview is hidden, feature cards stack vertically, and the Start/Continue action remains visible.
- Uses accessible regions/headings plus `[data-slot="card"]`; do not use screenshot snapshots.

- [ ] **Step 8: Run the focused tests and verify GREEN**

Run:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts
npm run test:e2e:unconfigured
```

Expected: all focused unit tests and unconfigured browser tests pass.

- [ ] **Step 9: Commit the landing migration**

```sh
git add src/App.tsx src/components/LandingPage.tsx src/styles/app.css src/tests/appIntegration.test.tsx src/tests/responsiveLayout.test.ts e2e/unconfigured.spec.ts
git commit -m "feat: migrate landing page to shadcn primitives"
```

### Task 5: Full Verification and Roadmap Update

**Files:**
- Modify: `docs/SHADCN_MIGRATION.md`

**Interfaces:**
- Produces: verified PR-ready branch and accurate roadmap status.

- [ ] **Step 1: Run the full verification suite**

Run under Node 20, or use the documented local Node 26 flag for Vitest:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
npm run test:e2e
test -f dist/index.html
test -f dist/404.html
cmp -s dist/index.html dist/404.html
```

Expected: all unit and E2E tests pass; build succeeds; both HTML files exist and are byte-identical.

- [ ] **Step 2: Perform manual UI review**

Inspect `/presume/` at 1440px, 920px, 640px, and 358px, plus `/presume/editor/` at 960px and 358px. Confirm the landing remains premium and document-adjacent, the editor is unchanged, and the resume remains the visual anchor.

- [ ] **Step 3: Review the diff for accidental scope expansion**

Run:

```sh
git diff origin/main -- src/styles/resume.css src/types.ts src/storage.ts src/export.ts src/reviewApi.ts
git status --short
```

Expected: no diff for protected product/data/export files and only intentional generated test artifacts, if any.

- [ ] **Step 4: Mark PR 1 implemented and commit the status**

Change `PR 1` status in `docs/SHADCN_MIGRATION.md` from `planned` to `implemented; awaiting review`.

```sh
git add docs/SHADCN_MIGRATION.md
git commit -m "docs: update shadcn migration status"
```

## Rollback

- Revert `feat: migrate landing page to shadcn primitives` to restore the landing while retaining the foundation.
- Revert `chore: initialize shadcn base ui` to remove Tailwind/shadcn after the landing commit is reverted.
- No data, schema, LocalStorage, or backend rollback is required.
