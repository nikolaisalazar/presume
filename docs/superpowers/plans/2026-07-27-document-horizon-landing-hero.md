# Document Horizon Landing Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Document Horizon hero: a clearly recognizable
resume printed on the Working Stack foreground sheet, Application Background
Match in Light mode, and Dark Surround in Dark mode.

**Architecture:** Keep the current `LandingPage` information architecture and responsive `<picture>` loading contract. Preserve the exact user-approved Working Stack photograph, print an anonymized resume hierarchy only into its existing loose foreground sheet, and ship that composition at the existing `1120 × 720` and `2200 × 1414` delivery sizes. Use semantic theme tokens plus theme-specific filters and overlays to produce the approved Light and Dark treatments without downloading duplicate theme assets. Protect the reviewed raster, theme, focus, mobile-transfer, and route contracts with focused Vitest and Playwright coverage.

**Tech Stack:** React 18, TypeScript 5.7, Vite 6, semantic CSS tokens, Vitest/Testing Library, Playwright, FFmpeg, and `cwebp`.

## Global Constraints

- `DESIGN.md` is the visual authority, `PRODUCT.md` is the product authority, and `docs/superpowers/specs/2026-07-27-document-horizon-landing-hero-design.md` is the feature authority.
- Preserve the current centered hero composition, content, calls to open/continue editing, saved-resume wording, route behavior, and `720px` desktop height.
- Light mode matches the landing-page field through the existing
  `--background: #edf2f0` token.
- Dark mode uses Dark Surround through the existing dark background/surface token family.
- The functional editor/PDF resume remains `--paper: #fffefb` in every theme.
  The decorative landing raster contains no real personal information and
  follows the approved Application Background Match or Dark Surround grade with the complete
  photograph; it is not covered by the functional paper-independence invariant.
- The printed resume must match the photographed sheet's perspective, lighting, focus, texture, and cropping; a floating UI overlay is not acceptable.
- Preserve the retained Pexels photo `9869075` exactly: the loose foreground
  sheet remains lower-left, the blank paper stack remains upper-right, and the
  upper/central negative space remains uninterrupted.
- Preserve the current `641px` image boundary. Through `640px`, the image, overlay, and any asset credit remain hidden and the image must not download.
- Use one neutral responsive asset set unless browser evidence proves that it cannot produce both approved theme treatments.
- Do not add a measurement rule, meter, ruler, badge, stat, shader, parallax, Canvas UI, WebGL, glow, glass, or ornamental motion.
- Keep Verdigris below the Ten-Percent threshold and restricted to existing semantic action, focus, and approved emphasis roles.
- Do not change `src/styles/resume.css`, runtime resume rendering, saved data, storage, export, PDF, Review, Fit, resize, routing, or GitHub Pages fallback behavior.
- Do not add visual snapshots. Automated geometry and token tests supplement but never replace direct visual QA.
- Every production-code change follows red-green-refactor. The reviewed raster asset is exercised by a failing composition-fingerprint contract before it replaces the incorrect generated scene.
- Implementation occurs on `feat/document-horizon-landing-hero` in an isolated `.worktrees/document-horizon-landing-hero` worktree based on current `origin/main`.

---

## File Structure

- `public/landing/document-horizon-1120.webp` — normal-density responsive hero asset at exactly `1120 × 720`.
- `public/landing/document-horizon-2200.webp` — high-density responsive hero asset at exactly `2200 × 1414`.
- `public/landing/README.md` — approved visual references, source-photo provenance, production treatment, fingerprints, and license disposition.
- `src/components/LandingPage.tsx` — responsive asset references and removal of the obsolete external photograph credit.
- `src/styles/app.css` — Application Background Match and Dark Surround presentation, theme-aware typography/filter/overlay/focus, and unchanged mobile hiding.
- `src/tests/landingHeroAsset.test.ts` — on-disk responsive-asset existence, WebP signature, size ceiling, and obsolete-asset retirement.
- `src/tests/appIntegration.test.tsx` — runtime decorative-picture and copy/behavior contract.
- `src/tests/themeContrast.test.ts` — theme-appropriate hero focus companion edge.
- `e2e/unconfigured.spec.ts` — theme rendering, inclusive image-loading boundary, focus, containment, and failure fallback.
- `docs/superpowers/specs/2026-07-27-document-horizon-landing-hero-design.md` — implementation and verification evidence after the code and visual gates pass.
- `docs/superpowers/plans/2026-07-27-document-horizon-landing-hero.md` — approved execution record committed with the completed feature.

---

### Task 1: Ship the Document Horizon asset and responsive markup

**Files:**
- Create: `public/landing/document-horizon-1120.webp`
- Create: `public/landing/document-horizon-2200.webp`
- Create: `public/landing/README.md`
- Create: `src/tests/landingHeroAsset.test.ts`
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `e2e/unconfigured.spec.ts`
- Delete: `public/landing/handmade-paper-1120.webp`
- Delete: `public/landing/handmade-paper-2200.webp`

**Interfaces:**
- Consumes: Existing `[data-slot="landing-hero"]` and `[data-slot="landing-hero-media"]` selectors, the `(min-width: 641px)` `<source>` boundary, and the transparent fallback `<img>`.
- Produces: `/presume/landing/document-horizon-1120.webp` and `/presume/landing/document-horizon-2200.webp` for Task 2 styling and E2E verification.

- [x] **Step 1: Write the failing on-disk asset test**

Create `src/tests/landingHeroAsset.test.ts`:

```ts
import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicAsset = (name: string) => `${process.cwd()}/public/landing/${name}`

function expectWebp(name: string, maximumBytes: number) {
  const path = publicAsset(name)
  expect(existsSync(path), `${name} exists`).toBe(true)
  const bytes = readFileSync(path)
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF')
  expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP')
  expect(statSync(path).size).toBeLessThanOrEqual(maximumBytes)
}

describe('Document Horizon landing assets', () => {
  it('ships responsive WebP files and retires the envelope photographs', () => {
    expectWebp('document-horizon-1120.webp', 180_000)
    expectWebp('document-horizon-2200.webp', 600_000)
    expect(existsSync(publicAsset('handmade-paper-1120.webp'))).toBe(false)
    expect(existsSync(publicAsset('handmade-paper-2200.webp'))).toBe(false)
  })
})
```

- [x] **Step 2: Add failing runtime assertions for the new decorative picture**

In the existing landing-page primitive test in `src/tests/appIntegration.test.tsx`, add:

```ts
const heroMedia = container.querySelector<HTMLPictureElement>(
  '[data-slot="landing-hero-media"]'
)
const heroSource = heroMedia?.querySelector('source')
const heroImage = heroMedia?.querySelector('img')

expect(heroMedia).toHaveAttribute('aria-hidden', 'true')
expect(heroSource).toHaveAttribute('media', '(min-width: 641px)')
expect(heroSource).toHaveAttribute(
  'srcset',
  '/presume/landing/document-horizon-1120.webp 1120w, /presume/landing/document-horizon-2200.webp 2200w'
)
expect(heroImage).toHaveAttribute('alt', '')
expect(screen.queryByRole('link', { name: /Photograph:/ })).not.toBeInTheDocument()
```

Update the hidden-transfer Playwright test to:

- use `640px`, rather than its inherited `560px`, for the initial navigation;
- listen for `/landing/document-horizon`;
- assert that the initial `640px` navigation makes zero matching requests;
- resize the same page to `641px` and assert that at least one matching request occurs.

Add a test named `keeps live hero content complete when the decorative image fails`. It must install a route for `**/landing/document-horizon-*.webp`, set a local `requestAborted` flag inside that route before aborting the request, navigate at `1120px`, assert that `requestAborted` is `true`, and assert that the live hero heading and primary action remain visible and enabled. This makes the new path fail before the component changes while protecting both the exact inclusive loading boundary and the complete live-content fallback.

- [x] **Step 3: Run the focused tests and verify RED**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/landingHeroAsset.test.ts src/tests/appIntegration.test.tsx
npm run build
npx playwright test -c playwright.unconfigured.config.ts -g "avoids hidden hero image transfer"
npx playwright test -c playwright.unconfigured.config.ts -g "decorative image fails"
```

Expected:

- Vitest fails because the new assets do not exist and the component still references `handmade-paper`.
- The focused Playwright tests fail because no `document-horizon` request occurs at `641px` and the new route-abort matcher does not see the intended asset.
- The production build remains otherwise valid.

- [x] **Step 4: Restore the approved Working Stack source**

Use the exact photograph retained by every approved visual-companion artifact:

```text
https://images.pexels.com/photos/9869075/pexels-photo-9869075.jpeg
```

Preserve the photographed pixels and geometry. Add only abstract resume line
work to the existing loose foreground sheet. Warp that line work to the sheet's
four perspective corners, alpha-composite it into the photograph, and verify at
original detail that:

- the upper-right paper stack is unchanged and blank;
- the loose lower-left sheet has not moved, resized, or changed shape;
- the resume print stays within that sheet and follows its perspective;
- no text is readable and no personal data is present;
- the upper and central negative space is unchanged;
- no lower-right sheet, meter, ruler, or interface ornament is introduced.

- [x] **Step 5: Produce and fingerprint the exact responsive WebP assets**

Center-crop the corrected source to the existing delivery contract:

```sh
ffmpeg -y -i /tmp/presume-approved-document-horizon-composite.png \
  -vf "scale=2200:1414:force_original_aspect_ratio=increase,crop=2200:1414" \
  /tmp/presume-document-horizon-2200.png
cwebp -quiet -q 86 /tmp/presume-document-horizon-2200.png \
  -o public/landing/document-horizon-2200.webp
ffmpeg -y -i /tmp/presume-document-horizon-2200.png \
  -vf "scale=1120:720" \
  /tmp/presume-document-horizon-1120.png
cwebp -quiet -q 84 /tmp/presume-document-horizon-1120.png \
  -o public/landing/document-horizon-1120.webp
sips -g pixelWidth -g pixelHeight \
  public/landing/document-horizon-1120.webp \
  public/landing/document-horizon-2200.webp
shasum -a 256 \
  public/landing/document-horizon-1120.webp \
  public/landing/document-horizon-2200.webp
```

Expected dimensions:

```text
document-horizon-1120.webp  1120 × 720
document-horizon-2200.webp  2200 × 1414
```

Expected fingerprints:

```text
ccce41026d7eae284b392a4fc66be3683ca225d168e4ee56282dc4877f7eb843  document-horizon-1120.webp
245f1d7bb59330ae6a02e7d5e5411eb18aeac5946da41ca50c7cda7bc85f4b15  document-horizon-2200.webp
```

Delete only the two superseded `handmade-paper-*.webp` files after the new files pass inspection.

- [x] **Step 6: Update the component and provenance record**

In `LandingPage.tsx`:

- Change only the `<source srcSet>` to the two `document-horizon` paths.
- Preserve `media="(min-width: 641px)"`, `sizes`, the transparent fallback `<img>`, dimensions, and `aria-hidden`.
- Remove the obsolete Unsplash credit link.
- Preserve every line of hero copy and every editor action.

Create `public/landing/README.md` containing:

- correction date `2026-07-27`;
- the canonical Pexels photo page, photographer, stable photo ID, direct source
  URL, and Pexels License;
- the deterministic perspective-print and responsive-encoding treatment;
- the approved fingerprints above;
- a statement that the asset contains no real resume or personal data;
- the license/attribution disposition without inventing a contributor name.

- [x] **Step 7: Run focused tests and verify GREEN**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/landingHeroAsset.test.ts src/tests/appIntegration.test.tsx
npm run build
npx playwright test -c playwright.unconfigured.config.ts -g "avoids hidden hero image transfer"
npx playwright test -c playwright.unconfigured.config.ts -g "decorative image fails"
git diff --check
```

Expected: all focused tests pass, the build succeeds, the boundary test reports zero hero-image requests at `640px` and at least one request at `641px`, and the route-abort test leaves the live headline and primary action complete.

- [x] **Step 8: Commit**

```sh
git add public/landing src/components/LandingPage.tsx src/tests/landingHeroAsset.test.ts src/tests/appIntegration.test.tsx e2e/unconfigured.spec.ts
git commit -m "feat: add Document Horizon landing artwork"
```

---

### Task 2: Implement Application Background Match and Dark Surround with accessible focus

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/tests/themeContrast.test.ts`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

**Interfaces:**
- Consumes: The responsive Document Horizon assets and unchanged hero DOM from Task 1.
- Produces: Theme-resolved hero background, foreground, filter, overlay, kicker, and focus behavior for the final visual gate.

- [x] **Step 1: Write failing CSS-contract tests**

Add a focused case to `src/tests/responsiveLayout.test.ts`:

```ts
it('matches the Light application field and uses Dark Surround in Dark mode', () => {
  expect(appCss).toMatch(
    /\.landing-hero \{[^}]*background: var\(--background\);[^}]*color: var\(--foreground\);/
  )
  expect(appCss).toMatch(
    /\.landing-hero::after \{[^}]*background: color-mix\(in srgb, var\(--background\) 76%, transparent\);/
  )
  expect(appCss).toMatch(
    /\.dark \.landing-hero \{[^}]*background: var\(--surface\);[^}]*color: var\(--foreground\);/
  )
  expect(appCss).toMatch(
    /\.dark \.landing-hero::after \{[^}]*background: color-mix\(in srgb, var\(--background\) 72%, transparent\);/
  )
  expect(appCss).not.toMatch(/\.landing-hero__media > img \{[^}]*sepia\(/)
})
```

Update `src/tests/themeContrast.test.ts` so the hero button focus contract expects `var(--focus-contrast)` rather than `var(--paper-ink)`, and remove the obsolete hero-credit focus assertion.

- [x] **Step 2: Write a failing rendered theme test**

Add this Playwright test to `e2e/unconfigured.spec.ts`:

```ts
test('matches the Light application field and renders Dark Surround in Dark', async ({ page }) => {
  await page.setViewportSize({ width: 1120, height: 980 })
  await page.goto('./')

  const appearance = page.getByRole('group', { name: 'Appearance' })
  const hero = page.locator('[data-slot="landing-hero"]')

  await appearance.getByRole('button', { name: 'Light' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(hero).toHaveCSS('background-color', 'rgb(237, 242, 240)')
  await expect(hero).toHaveCSS('color', 'rgb(23, 33, 30)')
  expect(await hero.evaluate(element =>
    getComputedStyle(element, '::after').backgroundColor
  )).toBe('color(srgb 1 1 1 / 0.76)')

  await appearance.getByRole('button', { name: 'Dark' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(hero).toHaveCSS('background-color', 'rgb(26, 33, 31)')
  await expect(hero).toHaveCSS('color', 'rgb(240, 243, 241)')
  expect(await hero.evaluate(element =>
    getComputedStyle(element, '::after').backgroundColor
  )).toBe('color(srgb 0.0627451 0.0823529 0.0745098 / 0.72)')

  const heroAction = hero.getByRole('button', { name: /Open the editor|Continue editing/ })
  await heroAction.focus()
  await expect(heroAction).toBeFocused()
  await expect(heroAction).toHaveCSS('outline-style', 'solid')
})
```

If current WebKit/Chromium serializes `color-mix()` differently, capture the actual standards-compliant serialization during the RED run and assert that exact resolved value. Do not weaken the assertion to `not.toBe('transparent')`.

- [x] **Step 3: Run focused tests and verify RED**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts
npx playwright test -c playwright.unconfigured.config.ts -g "Light application field"
```

Expected failures:

- CSS still uses `var(--paper)`, `var(--paper-ink)`, a warm overlay, and `sepia`.
- Dark mode has no Dark Surround override.
- Hero focus still uses the paper-specific companion edge.

- [x] **Step 4: Implement the minimal semantic CSS**

Update only the landing-hero rules in `src/styles/app.css`:

```css
.landing-hero {
  background: var(--background);
  color: var(--foreground);
}

.landing-hero::after {
  background: color-mix(in srgb, var(--background) 76%, transparent);
}

.landing-hero__media > img {
  filter: grayscale(0.5) saturate(0.36) contrast(1.05) brightness(1.1);
}

.landing-hero .landing-kicker {
  color: var(--primary-hover);
}

.dark .landing-hero {
  background: var(--surface);
  color: var(--foreground);
}

.dark .landing-hero::after {
  background: color-mix(in srgb, var(--background) 72%, transparent);
}

.dark .landing-hero__media > img {
  filter: grayscale(0.78) saturate(0.28) contrast(1.12) brightness(0.43);
}

.dark .landing-hero .landing-kicker {
  color: var(--accent-foreground);
}

.landing-hero [data-slot='button']:focus-visible {
  box-shadow:
    0 0 0 2px var(--focus-contrast),
    var(--shadow-control-edge);
}
```

Preserve:

- `min-height: 720px`;
- the current centered content geometry and headline measure;
- image `object-position: center 46%` unless direct production-asset inspection requires one documented adjustment;
- the `220ms` settle animation and existing reduced-motion behavior;
- the `max-width: 640px` rule hiding the media and overlay.

Remove only the unused `.landing-hero__credit` styles and selectors.

- [x] **Step 5: Run focused tests and verify GREEN**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts
npx playwright test -c playwright.unconfigured.config.ts -g "Light application field"
npx playwright test -c playwright.unconfigured.config.ts -g "keeps the landing identity responsive"
git diff --check
```

Expected: all focused tests pass in both themes and at the responsive boundaries.

- [x] **Step 6: Commit**

```sh
git add src/styles/app.css src/tests/responsiveLayout.test.ts src/tests/themeContrast.test.ts e2e/unconfigured.spec.ts
git commit -m "feat: theme the Document Horizon hero"
```

---

### Task 3: Resolve the direct-browser breakpoint defect

**Why this task exists:** User-approved cmux WKWebView QA found one
load-bearing failure after Task 2. At logical `window.innerWidth = 641`,
WKWebView reserves a `17px` scrollbar and the media-query-controlled hero stays
compact until `658px`. Direct cmux comparison also proved that forcing the
decorative landing resume to remain white makes the white Dark-theme headline
cross a white sheet and lose contrast. The user selected the readable existing
Dark Surround and clarified that the paper-independence invariant applies to
the functional editor/PDF resume, not this decorative raster.

**Files:**
- Modify: `src/components/LandingPage.tsx`
- Modify: `src/styles/app.css`
- Modify: `src/tests/appIntegration.test.tsx`
- Modify: `src/tests/responsiveLayout.test.ts`
- Modify: `e2e/unconfigured.spec.ts`

**Interfaces:**
- `LandingPage` uses a local `useSyncExternalStore` viewport snapshot whose
  only invariant is `window.innerWidth >= 641`.
- Render the existing Light asset `<source>` only when the hero is wide. This
  replaces the WebKit-sensitive media attribute and prevents any hero download
  through `640px`.
- A `data-layout="wide|compact"` attribute on the hero becomes the sole compact
  hero geometry switch. Other landing-page responsive rules remain unchanged.

- [x] **Step 1: Write failing markup, CSS, and browser contracts**

Add tests that require:

- at `window.innerWidth = 640`, the hero has `data-layout="compact"` and no
  `<source>`;
- after changing to `641` and dispatching `resize`, it has
  `data-layout="wide"` and exactly one existing Document Horizon source;
- compact hero geometry selectors use `[data-layout='compact']`, not the
  viewport media query;
- the existing Dark Surround filter and overlay remain unchanged;
- the existing Playwright test still reports zero requests at `640px` and a
  Document Horizon request at `641px`.

Run the focused tests and record the expected RED failures before adding
production code.

- [x] **Step 2: Implement the minimal viewport seam**

In `LandingPage.tsx`:

- subscribe locally to `resize` with snapshot `window.innerWidth >= 641`;
- set `data-layout` on the hero;
- render no `<source>` while compact;
- while wide, render exactly the existing responsive source;
- preserve the transparent fallback `<img>`, empty alt, dimensions,
  `aria-hidden`, copy, actions, and route behavior.

Do not export a viewport store or speculative hook framework.

- [x] **Step 3: Make compact geometry attribute-driven**

Move only the hero-specific compact rules out of `@media (max-width: 640px)`
and target `[data-slot='landing-hero'][data-layout='compact']` plus its
descendants. Leave the header and every non-hero responsive rule in its current
media query.

Preserve the Task 2 Dark Surround filter and overlay exactly. Do not add a
second asset, clipped reveal, mask, theme subscription, or theme-specific
composition.

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm test -- --run \
  src/tests/appIntegration.test.tsx \
  src/tests/responsiveLayout.test.ts \
  src/tests/themeContrast.test.ts
npm run build
npx playwright test -c playwright.unconfigured.config.ts -g "Light application field|hidden hero image transfer|decorative image fails|landing identity responsive"
git diff --check
```

- [x] **Step 5: Re-run the failed cmux checkpoints before full QA**

In user-approved cmux WKWebView:

- capture Light and Dark at exact `window.innerWidth` `1120`, `641`, and `640`;
- at `641`, require `data-layout="wide"`, a `720px` hero, visible artwork, and
  one Document Horizon request/source;
- at `640`, require compact geometry, no source/request, and no image/overlay;
- in Dark at `1120`, require the readable approved Dark Surround shown in the
  accepted cmux comparison.

If the breakpoint defect remains, do not commit.

- [x] **Step 6: Run the full suite, self-review, and commit**

Run the complete verification gate once, confirm protected files remain
unchanged, then commit:

```sh
git add \
  src/components/LandingPage.tsx \
  src/styles/app.css \
  src/tests/appIntegration.test.tsx \
  src/tests/responsiveLayout.test.ts \
  e2e/unconfigured.spec.ts
git commit -m "fix: honor Document Horizon theme and breakpoint"
```

---

### Task 4: Complete the visual and release gate

**Files:**
- Modify: `docs/superpowers/specs/2026-07-27-document-horizon-landing-hero-design.md`
- Create: `docs/superpowers/plans/2026-07-27-document-horizon-landing-hero.md`
- Read/verify: all changed files from Tasks 1–3

**Interfaces:**
- Consumes: The completed responsive assets, theme implementation, and
  direct-browser defect fixes.
- Produces: Recorded direct visual QA, automated release evidence, and a review-ready branch.

- [x] **Step 1: Run the full automated release gate**

Run:

```sh
NODE_OPTIONS=--no-experimental-webstorage npm run verify
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

Expected: all commands exit `0`; only intended landing, asset, test, and documentation changes appear.

Pre-correction execution record (July 27, 2026): in one command subshell, the isolated
backend environment was activated with
`source /private/tmp/presume-review-backend-venv-20260727/bin/activate`, then
the exact prescribed
`NODE_OPTIONS=--no-experimental-webstorage npm run verify` command exited `0`.
It passed review-contract generation, both TypeScript checks, `23/23` Vitest
files with `227/227` tests, and `50/50` backend tests (`0.54s`). This replaces
the earlier record that reconstructed the gate from separately successful
component runs.

Final-D correction record (July 27, 2026): the same gate passed with `23/23`
Vitest files and `228/228` tests, `50/50` backend tests, successful production
build and SPA fallback generation, and Playwright unconfigured `9/9` plus
configured `3/3`. SPA fallback parity, protected-path comparisons, asset
dimensions/fingerprints, and `git diff --check` also passed. The correction
commit SHA and corrected whole-branch re-review remain pending until the
following closeout commit.

- [x] **Step 2: Run direct browser visual QA**

Use the user-approved cmux browser surface, not an automated geometry report,
to inspect `/presume/` at exact logical viewports:

```text
1120, 921, 920, 641, 640, and 358 CSS pixels
Light, Dark, and System
saved and unsaved states
```

At each relevant desktop/tablet width confirm:

- Light matches the existing application background, not beige, cream, or a
  separate white panel.
- Dark reads as Dark Surround, not a fixed white folio or teal wash.
- The decorative resume is visibly printed into the photographed sheet; it is
  the application field in Light and follows the approved whole-image Dark Surround
  grade in Dark.
- The resume perspective, focus, lighting, ink absorption, and crop are physically convincing.
- The resume remains subordinate to the live headline and no image detail competes with the copy.
- No meter, ruler, shader, glass, glow, or other rejected element appears.
- The hero remains `720px` high and all live copy stays contained.
- The Dark hero has no low-contrast text or focus companion edge.

At `640px` and `358px`, confirm:

- the decorative image and overlay are absent;
- no hero-image request occurs;
- the established left-aligned mobile hero and `44px` action remain unchanged;
- there is no page-level horizontal overflow.

Also verify:

- keyboard-only navigation and visible hero-action focus;
- reduced motion;
- theme persistence across reload and navigation to `/presume/editor/`;
- browser-back navigation;
- System follows the current OS appearance without a wrong-theme hero flash;
- aborting the hero image request leaves the headline and action complete.

Pre-correction recorded disposition (July 27, 2026): **PASS**. The direct cmux visual matrix,
keyboard, theme, navigation, and failure-fallback checks above are complete. A
fresh structured run retained all `36` width/theme/state cells at
`.superpowers/sdd/cmux-final-qa/structured-matrix-20260727.json`.

Reduced-motion CSS-engine QA was completed separately with browser-level
Playwright WebKit `1.61.1` media emulation against the production build at
`1120 × 980` in Dark mode. The user explicitly directed browser-level handling
instead of changing System Settings, so macOS Reduce Motion stayed off
(`NSWorkspace` accessibility query `false`; both checked preference keys `0`).
With reduced motion emulated, WebKit reported the reduced media query matching,
the no-preference query not matching, no named hero animation, `0.00001s`
animation and button-transition durations, one animation iteration, automatic
scrolling, a `720px` hero, and zero page overflow. The retained
`.superpowers/sdd/cmux-final-qa/reduced-motion-webkit.png` screenshot was
directly inspected at original detail and showed no visual defect.

The same WebKit surface without the reduced preference reported the
`landing-hero-settle` animation at `0.22s` and the button transition at
`0.18s`, confirming that the reduced result exercised the shipped
`prefers-reduced-motion` branch. cmux WKWebView does not expose CSS media
emulation, and its earlier JavaScript `matchMedia` shim did not alter CSS media
evaluation. The recorded PASS therefore applies to browser-level WebKit forced
media plus direct screenshot inspection; it does not claim native
macOS-preference or cmux reduced-motion testing.

Final-D correction checkpoint (July 27, 2026): the user selected the clearer
resume plus Application Background Match direction in the dedicated visual
comparison. The real local build was then inspected directly on cmux surface
`43` in Light and Dark. Light joined the application field without a separate
beige or white panel; Dark retained Dark Surround; the resume hierarchy was
clear, anonymous, and physically integrated; the blank stack and live-copy
hierarchy remained intact. The visible preview was left in Light mode.

- [x] **Step 3: Record exact implementation evidence**

Append an `## Implementation Evidence` section to the approved design spec with:

- branch and exact HEAD SHA;
- asset filenames and dimensions;
- automated commands with actual pass counts;
- cmux WKWebView widths/themes/states inspected;
- image-failure and no-mobile-transfer results;
- Task 1 through Task 3 independent-review dispositions;
- Task 4 and whole-branch review status as `pending` until those later gates
  actually complete;
- explicit confirmation that protected files remain unchanged.

Do not mark the feature merged; merge status belongs to the later branch-finishing decision.

Keep this approved implementation plan unchanged apart from completed checklist
markers needed to make its execution status accurate, and include it in the
documentation commit so the branch does not leave the execution authority as
an untracked local artifact.

- [x] **Step 4: Re-run documentation and whitespace checks**

Run:

```sh
git diff --check
git status --short --branch
```

Expected: no whitespace errors and only intended changes.

- [x] **Step 5: Commit**

```sh
git add \
  docs/superpowers/specs/2026-07-27-document-horizon-landing-hero-design.md \
  docs/superpowers/plans/2026-07-27-document-horizon-landing-hero.md
git commit -m "docs: record Document Horizon verification"
```

---

## Review and Finish

After every task:

1. Generate the task review package from the task's recorded base SHA to its exact head.
2. Dispatch a fresh context-isolated reviewer with the task brief, implementation report, review package, and Global Constraints.
3. Require both spec-compliance and code-quality verdicts.
4. Fix every Critical or Important finding through the bounded reviewed fix loop before starting the next task.

After Task 4:

1. Generate one whole-branch review package from the `origin/main` merge base to exact HEAD.
2. Dispatch the most capable available fresh reviewer.
3. Resolve any load-bearing finding and run one scoped re-review.
4. Update the design spec with the actual Task 4 and whole-branch review
   dispositions and the exact reviewed implementation SHA, then commit that
   documentation-only closeout.
5. Generate a review package for the documentation-only closeout commit and
   dispatch one fresh read-only reviewer to confirm that the record is accurate
   and that no runtime file changed.
6. Re-run the complete verification gate on the exact final head.
7. Use `superpowers:finishing-a-development-branch` and present the integration options to the user. Do not merge or delete the branch without their choice.
