# Document Horizon Landing-Hero Design

## Status

Approved by the user through direct visual and written-contract review on July 27, 2026.

Root `DESIGN.md` remains the visual authority and `PRODUCT.md` remains the product authority. This document records the selected landing-hero direction without authorizing a broader landing-page redesign.

## Purpose

Replace the landing page's envelope photograph with a more product-relevant hero while preserving the successful qualities of the current composition: quiet material depth, centered editorial hierarchy, generous negative space, and a restrained paper-led atmosphere.

The new visual must make the resume—not generic stationery—the meaningful object. It should feel like an evolution of the existing Material Folio landing identity rather than a separate campaign or a new product feature.

## Selected Direction

The selected direction is **Document Horizon**.

- Preserve the current centered hero composition, copy, hierarchy, call to action, secondary note, dimensions, and structural border.
- Use the exact **Working Stack** photograph from
  [Pexels photo 9869075](https://www.pexels.com/photo/white-paper-on-white-table-9869075/):
  one loose foreground sheet in the lower-left, one blank paper stack in the
  upper-right, and quiet negative space across the upper and central field.
- Show one anonymized resume convincingly printed into the existing loose
  foreground sheet.
- Do not regenerate, rearrange, add, or remove the photographed paper forms.
- Preserve ample clear space behind all hero copy.
- Do not add a measurement rule, meter, ruler, badge, stat, decorative interface layer, or shader.

The hero remains an atmospheric introduction. It must not imitate the editor, advertise unsupported functionality, or become a product screenshot.

## Image and Resume Treatment

The resume must appear physically printed on the photographed loose foreground
sheet. A flat UI layer floating above the image or a newly generated resume
sheet entering from another edge is not acceptable.

The final asset must match:

- the paper sheet's perspective and foreshortening;
- the sheet's local lighting, shadow, and contrast;
- the photograph's focus and depth of field;
- the paper texture and print absorption;
- the visible sheet boundaries and cropping.

The printed content must be static and anonymized. It must not use saved resume data, user content, real personal information, or runtime document rendering.

The visible resume may echo Presume's document hierarchy, but it should not reproduce text at a size that invites reading. Its role is to identify the object as a resume while keeping the live hero copy dominant.

## Theme Treatment

### Light mode: Application Background Match

- Use the existing application field, `--background: #edf2f0`, as the hero's
  dominant field so the photograph belongs to the surrounding landing page
  instead of reading as a separate white panel.
- Neutralize the photograph away from beige, tan, or cream.
- Preserve subtle paper depth through luminance, edge definition, texture, and shadow rather than a warm color cast.
- Keep the live hero text in the existing light-theme ink family.
- Keep Verdigris limited to existing approved accent roles, including the kicker and controls.
- Keep the photographed resume legibly identifiable as paper without treating
  this decorative raster as the functional document surface.

### Dark mode: Dark Surround

- Adapt the photographic field to the existing dark surface family rather than retaining a full-width white hero.
- Use the current dark background and surface roles as the visual reference; do not introduce a new black or teal family.
- Render the live hero text with existing dark-theme foreground roles.
- Use the existing reduced-chroma dark-theme accent for approved emphasis.
- Grade the complete decorative photograph into the Dark Surround when needed
  for live-copy contrast; the landing artwork is not covered by the editor/PDF
  paper-independence invariant.
- Maintain enough separation between the resume, surrounding paper forms, and
  dark field without glow, glass, a clipped reveal, or a second composition.

### System mode

System mode follows the resolved Light or Dark treatment without a flash of the wrong hero grade. Theme persistence and the existing appearance-control behavior remain unchanged.

## Palette Boundaries

Approved:

- existing Light and Dark semantic surface tokens;
- existing foreground and muted-foreground tokens;
- `--background: #edf2f0` for the Light hero field;
- `--paper: #fffefb` for the functional editor/PDF resume, not as a required
  literal color inside the decorative hero raster;
- restrained Verdigris in existing semantic accent roles.

Rejected:

- the beige cast shown during early Document Horizon exploration;
- a full teal or Verdigris photographic wash;
- new cream, tan, brown, cobalt, or decorative color families;
- gradients, glows, glass, or colored shadows used to manufacture atmosphere.

## Content and Layout

Preserve the current hero content:

- kicker: `Presume`;
- headline: `Presume is a local-first resume workbench.`;
- existing descriptive paragraph;
- all existing open/continue-editing action wording and saved-resume behavior;
- `Open project · No account required`;
- any required asset credit.

Do not change the hero's product claim or add new marketing copy as part of this work.

The headline must remain within the existing wide, centered measure and must not exceed the current intended line count at supported desktop widths.

## Responsive Behavior

- Preserve the existing desktop hero dimensions and centered composition unless implementation evidence requires a small asset-position adjustment.
- Preserve the current `641px` image boundary.
- At `640px` and below, continue hiding the decorative image, overlay, and credit while using the existing left-aligned mobile hero.
- Do not add a mobile-only replacement image, parallax crop, or horizontal overflow.
- Keep the document image decorative and outside the reading order at every width.

## Accessibility and Motion

- The photographic asset remains decorative with empty alternative text and `aria-hidden` treatment through its existing media container.
- All meaning remains available in the live headline, description, and controls.
- Verify WCAG 2.2 AA contrast for Light, Dark, and System-resolved states using current-browser evidence.
- Preserve visible keyboard focus and all existing action semantics.
- Preserve the existing reduced-motion behavior.
- Do not introduce shader motion, parallax, cursor response, canvas effects, or ornamental animation.

## Performance and Asset Delivery

- Preserve the existing responsive-image strategy unless measured evidence supports a safer equivalent.
- Provide appropriately sized production assets for the current desktop delivery widths.
- Prefer one composited source whose theme appearance can be controlled without duplicating unnecessary download weight, but do not accept a visibly inferior Dark treatment to force a single asset.
- Prevent theme changes from downloading both full-resolution variants when only one is needed.
- Avoid layout shift by preserving intrinsic image dimensions.
- Keep the hero complete when the image fails or is unavailable.

## Explicit Exclusions

This design does not authorize:

- changes to `src/styles/resume.css` or browser/PDF resume rendering;
- runtime capture of the user's resume;
- saved-data, storage, export, PDF, Review, Fit, resize, or routing changes;
- a broader landing-page rewrite;
- new marketing sections or new product features;
- Canvas UI, HTML-in-canvas, WebGL, shaders, or decorative motion;
- a speculative shared styling framework.

## Implementation Boundary

Expected production scope is limited to the landing hero component, its landing-specific styles and tests, and new static hero assets or attribution.

Implementation may adjust the exact CSS filter, overlay opacity, and object
position only to reproduce the approved Application Background Match and Dark
Surround results across supported browsers. Any material change to composition,
copy, theme behavior, or responsive behavior requires another visual checkpoint.

## Verification

Direct visual QA must cover:

- `/presume/` in Light, Dark, and System;
- saved and unsaved states;
- `1120`, `921`, `920`, `641`, `640`, and `358` CSS-pixel widths;
- keyboard-only navigation and visible focus;
- reduced motion;
- theme persistence and first-load System resolution;
- browser-back navigation;
- image failure/fallback behavior;
- contrast in current Safari and the project's primary automated-browser target;
- correct resume perspective, print integration, crop, and focus at production resolution.

Automated geometry or screenshot assertions may support this review but do not replace direct visual QA.

## Decision Record

Rejected during exploration:

- type-specimen photography;
- letterpress/typesetter photography;
- the Working Proof split layout;
- the asymmetric Material Folio layout;
- the decorative green measurement rule;
- beige, teal-wash, and fixed-white Dark treatments.

Selected:

- Document Horizon / Working Stack composition using the retained Pexels photo
  `9869075`;
- a clear anonymized resume hierarchy printed only into the existing loose
  foreground sheet;
- Application Background Match in Light mode;
- Dark Surround in Dark mode;
- invariant warm-white functional editor/PDF resume; the decorative landing
  resume follows the approved theme grade;
- no meter, shader, or ornamental motion.

## Implementation Evidence

The original Task 4 release gate and whole-branch review apply only to the
superseded pre-correction implementation. The final-D correction has fresh
automated and direct visual evidence and an approved exact-commit review.
Merge remains pending.

### Superseded pre-correction implementation

- Branch: `feat/document-horizon-landing-hero`.
- Pre-correction runtime implementation SHA:
  `6c40bac5ede3b7e0b92aeb6a97c41c946e807043`.
- Pre-correction whole-branch reviewed HEAD:
  `e00ff877d03ed5551a43eb5020fa3a5412314ced`.
- These SHAs do not describe the corrected production rasters or Light field.
  They remain here only as historical evidence.
- Production assets:
  - `public/landing/document-horizon-1120.webp` — `1120 × 720`,
    `15,172` bytes.
  - `public/landing/document-horizon-2200.webp` — `2200 × 1414`,
    `69,110` bytes.

### Composition correction

The first PR implementation generated a new paper-field photograph from a text
prompt. Although it satisfied the later prose description, it did not preserve
the Working Stack image the user had approved. Direct inspection of the retained
visual-companion artifacts identified that discrepancy before merge.

The corrected production rasters preserve the approved Pexels composition and
add only perspective-matched, anonymized resume structure to its loose
foreground sheet. A second direct visual comparison then selected option D:
stronger resume hierarchy plus the existing Light application background. Dark
Surround remains unchanged. `src/tests/landingHeroAsset.test.ts` now
fingerprints both reviewed responsive assets so a different paper scene or the
earlier ambiguous imprint cannot silently satisfy the file-existence and
dimension checks.

### Final-D correction verification

Disposition: **PASS**.

- Exact correction commit:
  `1fbd627d6ef969a0216f6f6c758b942d6caabd9d`.
- Reviewed range:
  `0a5694ef8b4b21ec375772ff8401ca76bad42222..1fbd627d6ef969a0216f6f6c758b942d6caabd9d`.
- Independent exact-commit re-review: approved with no Critical, Important, or
  Minor findings.
- Reviewed binary diff SHA-256:
  `7409a6ed4ca0d32f7350d2560344196045cf9e83b4fca848c0d0efa9d53cf210`.

Fresh correction-state results:

- review-contract generation and both TypeScript checks passed;
- Vitest passed `23/23` files and `228/228` tests;
- backend pytest passed `50/50` tests;
- both production builds and SPA fallback generation passed;
- Playwright passed unconfigured `9/9` and configured `3/3`;
- `dist/index.html` and `dist/404.html` remained byte-identical;
- both protected-path comparisons and `git diff --check` passed;
- the responsive assets remained exactly `1120 × 720` and `2200 × 1414` with
  the approved SHA-256 fingerprints recorded above.

The first composite `verify:full` attempt used the system Python and could not
import FastAPI. Re-running through the established isolated backend environment
passed the full non-browser gate; the browser portion initially encountered the
workspace sandbox's localhost-listen restriction, then passed unchanged when
run with permission to start Playwright's local preview servers.

Direct inspection of the real local build on cmux surface `43` covered the
final-D Light and Dark renderings. Light visually joined the existing
application field without a separate beige or white panel. Dark retained Dark
Surround. The lower-left document read clearly as an anonymous resume, the
upper-right stack remained blank, the live copy remained dominant, and no
meter, shader, Canvas layer, glass, glow, or ornamental motion appeared. The
visible preview was left in Light mode. The existing structured 36-cell matrix
remains evidence for the unchanged responsive and saved-state contracts; the
new fingerprint and browser tests cover the corrected raster and theme values.

The context-isolated reviewer first found no Critical or runtime/visual
findings, but requested correction of stale pre-D gate/review language and
non-portable provenance references. The exact-commit re-review confirmed both
findings resolved and approved the correction with no remaining findings.

### Superseded pre-correction automated release gate

Fresh commands were run from the isolated worktree on July 27, 2026:

- In one command subshell,
  `source /private/tmp/presume-review-backend-venv-20260727/bin/activate` followed
  by the exact prescribed
  `NODE_OPTIONS=--no-experimental-webstorage npm run verify` command passed and
  exited `0`. Its composite result was successful review-contract generation,
  successful TypeScript checks, `23/23` Vitest files with `227/227` tests, and
  `50/50` backend tests in `0.54s`.
- `PATH="/private/tmp/presume-review-backend-venv-20260727/bin:$PATH" npm run check:review-contract`
  — passed.
- `npm run typecheck` — passed.
- `NODE_OPTIONS=--no-experimental-webstorage npm test -- --run` — `23`
  test files and `227` tests passed.
- `/private/tmp/presume-review-backend-venv-20260727/bin/python -m pytest review-service/tests -q`
  — `50` tests passed in `0.55s`.
- `npm run build` — passed; Vite transformed `6,746` modules and generated
  the SPA fallback.
- `CI=1 npm run test:e2e` — unconfigured Playwright `9/9` and configured
  Playwright `3/3` passed.
- `test -f dist/index.html`, `test -f dist/404.html`, and
  `cmp dist/index.html dist/404.html` — passed.
- `git diff --check` — passed.

An earlier system-Python-only attempt reproduced
`ModuleNotFoundError: fastapi`; that environment failure is historical and is
not the final composite-gate result. The final exact composite command above
activated the approved isolated backend environment before `npm run verify`
and passed as one command.

The only build concern is the pre-existing, non-blocking Vite advisory for the
minified `renderResumePdf` chunk exceeding `500 kB`.

### Superseded pre-correction direct cmux WKWebView QA

The user-approved cmux `0.64.20` native WKWebView retained the existing visual
screenshots from `http://127.0.0.1:4191/presume/`. A fresh structured run used
`surface:42` and `http://127.0.0.1:4192/presume/`; the new loopback origin began
with no Presume storage keys, so no existing profile resume data was read,
overwritten, or deleted.

Together, the retained direct screenshots and the fresh structured
DOM/computed-style/resource run cover all `36` combinations:

- logical widths `1120`, `921`, `920`, `641`, `640`, and `358`;
- Light, Dark, and System preferences;
- saved and unsaved resume states.

Screenshots are retained in the ignored evidence directory
`.superpowers/sdd/cmux-final-qa/`. All six theme/state contact sheets and the
original-resolution `1120`, `641`, `640`, and `358` captures were visually
inspected; geometry assertions alone were not used as the visual verdict. The
fresh per-cell record is
`.superpowers/sdd/cmux-final-qa/structured-matrix-20260727.json`. It records
the requested width, actual `window.innerWidth`,
`document.documentElement.clientWidth`, `data-layout`, source count and
`srcset`, Document Horizon resource count, computed hero height, media and
overlay display, page overflow, preference and resolved theme, storage state,
and all three editor-action labels for every cell.

Retained screenshot pixel dimensions can be one pixel smaller than their
logical viewport filename because cmux aspect-fits the emulated page inside its
pane. Screenshot dimensions are visual evidence, not proof of logical viewport
width; the direct `window.innerWidth` values in the structured record provide
that proof.

Direct observations:

- The earlier True White checkpoint was superseded by the approved final
  direction. Light now matches the application background
  (`rgb(237, 242, 240)`) without introducing a separate beige or cream field.
  Dark and System-resolved-Dark use the approved Dark Surround
  (`rgb(26, 33, 31)`) without a fixed white folio or teal wash.
- The resume printing remained physically integrated with the photographed
  sheet: perspective, focus, paper overlap, print absorption, and crop remained
  convincing. It stayed subordinate to the live headline in both grades.
- No meter, ruler, shader, Canvas, glass, glow, badge, or decorative interface
  layer appeared.
- At `1120`, `921`, `920`, and exact logical `641`, the hero was `720px` high,
  `data-layout="wide"`, contained all live copy, rendered one responsive source,
  and loaded one Document Horizon resource on each fresh navigation.
- At `640` and `358`, the hero was `data-layout="compact"`, rendered zero
  sources, used the transparent fallback, hid the decorative media/overlay,
  made zero Document Horizon requests on fresh navigation, retained the
  left-aligned `44px` action, and had zero page-level horizontal overflow.
- Saved-state navigation through the real editor wrote the isolated default
  resume and constraints, displayed `Saved locally`, preserved System
  preference on `/presume/editor/`, returned correctly through browser Back,
  and changed all three landing actions to `Continue editing`. Unsaved actions
  remained `Open editor` / `Open the editor`. The approved
  `Open project · No account required` note remained present.
- Real macOS Tab keystrokes delivered to the focused WKWebView traversed the
  selected appearance control, header action, and hero action. The hero action
  matched `:focus-visible` with a solid `2px` Verdigris Edge outline and a
  visible `2px` companion ring in System-resolved-Dark.
- A pre-document mutation observer on a System fresh load recorded the root
  resolving Dark before the hero existed; the hero was inserted later with the
  Dark Surround already computed. No wrong-theme hero frame was observed.
- Forcing the decorative image to a missing URL produced a complete failed
  image (`naturalWidth === 0`) while the headline stayed visible and the
  saved-state action stayed visible and enabled. The direct screenshot retained
  a complete semantic Dark hero fallback with zero page overflow.
- A final clean reload reported no browser errors and no console entries.

Direct reduced-motion CSS-engine QA: **PASS** through browser-level WebKit
media emulation and direct visual inspection. The user explicitly directed
browser-level handling rather than changing System Settings. macOS Reduce
Motion therefore stayed off: the direct `NSWorkspace` accessibility query
reported `false`, and both checked preference keys remained `0`.

The production build was inspected in Playwright WebKit `1.61.1` at
`1120 × 980` in Dark mode with `reducedMotion: "reduce"`. Direct computed
evidence was:

```json
{
  "reducedMotion": true,
  "noPreference": false,
  "theme": "dark",
  "heroAnimationName": "none",
  "heroAnimationDuration": "0.00001s",
  "heroAnimationIterations": "1",
  "buttonTransitionDuration": "0.00001s",
  "scrollBehavior": "auto",
  "heroHeight": 720,
  "overflow": 0
}
```

The retained screenshot
`.superpowers/sdd/cmux-final-qa/reduced-motion-webkit.png` was inspected at
original detail. It showed the complete Dark Surround hero with contained,
legible live content, the integrated printed-resume treatment, and no visual
layout defect or page overflow. A no-preference baseline in the same browser
reported `reducedMotion: false`, `noPreference: true`,
`heroAnimationName: "landing-hero-settle"`,
`heroAnimationDuration: "0.22s"`, and
`buttonTransitionDuration: "0.18s"`, proving that the reduced result exercised
the shipped media-query branch rather than a generally motionless page.

cmux WKWebView remains the direct matrix surface, but it does not expose CSS
media emulation; its earlier JavaScript `matchMedia` shim appropriately did not
count as reduced-motion evidence. This PASS is specifically browser-level
WebKit forced-media QA plus direct screenshot inspection. It is not a claim of
native macOS-preference or cmux reduced-motion testing.

### Pre-correction reviews and current protected boundaries

- Task 1 independent review: approved; no Critical or Important finding.
- Task 2 independent review: approved; no Critical or Important finding.
- Task 3 independent review: approved with no Critical, Important, or Minor
  finding.
- Task 4 review of documentation commit
  `48e5c4a4b028de93d51e943dd82beee39b3f22d8`: changes required; the review
  found an inconsistent paper invariant, an overstated reduced-motion/pass
  disposition, missing retained structured matrix data, and no successful
  prescribed composite verification run. Correction commit
  `6141c1a7ce19cf7f5458399e007546422bb497d1` addressed all four findings, and
  the scoped re-review approved the correction.
- Whole-branch review of
  `origin/main...e00ff877d03ed5551a43eb5020fa3a5412314ced`:
  approved with no Critical, Important, or Minor findings. Its independent
  validation passed typecheck, `23/23` Vitest files and `227/227` tests,
  focused production Playwright `4/4`, the protected-path comparison, SPA
  fallback parity, and a `36/36` structured-matrix audit with zero invariant
  errors.
- Final-D correction review of
  `0a5694ef8b4b21ec375772ff8401ca76bad42222..1fbd627d6ef969a0216f6f6c758b942d6caabd9d`:
  approved with no Critical, Important, or Minor findings. Fresh independent
  checks passed typecheck, `23/23` Vitest files and `228/228` tests, focused
  Playwright `4/4`, asset-to-build parity, protected-path comparison, and
  `git diff --check`.

The protected comparison against `origin/main...HEAD` produced no diff for:

- `src/styles/resume.css`;
- `src/types.ts`;
- `src/storage.ts`;
- `src/export.ts`;
- `src/pdf`;
- `src/reviewApi.ts`;
- `src/useResizeEngine.ts`.

Runtime, resume, saved-data, export, PDF, Review API, and resize-engine behavior
therefore remain outside this feature's change set.
