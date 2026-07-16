# Resume Zoom-Geometry Stabilization Design

## Status

Approved product and technical design for GitHub issue #27. Implementation and native-browser verification are in progress.

## Purpose

Presume must render the resume as a stable Letter-format document across normal browser zoom-out levels. Browser zoom may make the entire application, including the resume, appear larger or smaller. It must not independently enlarge resume text, change line wrapping, alter the selected global scale, or stretch the document into a different composition.

The current 100% browser-zoom rendering is authoritative. The fix makes lower zoom levels reproduce that same document composition at a different apparent size.

This is a rendering-boundary correction. It must not become a resume-template redesign, Fit Constraints rewrite, data migration, or editor-shell redesign.

## Problem and Root Cause

The resume currently contains small author-defined type, including 8–11px text after Fit Constraints apply the document-wide `--global-scale`. Safari/WebKit progressively enlarges small text for legibility as browser zoom decreases. In the observed environment, the effect begins below approximately 90% and becomes severe at 50%, where small resume text is raised to an effective 18px floor.

That browser intervention has two consequences:

1. Text wraps differently, so the resume becomes taller and loses its Letter-page proportions.
2. `useResizeEngine` measures the altered DOM. After a reload at the affected zoom level, it can select a different `--global-scale`, making browser zoom an unintended input to resume formatting.

Direct inspection in the cmux WebKit browser produced the following representative results with unchanged resume data and constraints:

| Browser zoom | Effective bullet size | Resume height | Selected `--global-scale` |
| --- | ---: | ---: | ---: |
| 100% | 10.777px | 1056px | 1.077734 |
| 90% | 10.777px | about 1056px | 1.077734 |
| 80% | 11.25px | about 1059px | 1.077734 |
| 70% | 12.857px | about 1117px | 1.077734 |
| 60% | 15px | about 1209px | 1.077734 |
| 50% | 18px | 1692px | 1.077734 |

Reloading at 50% can cause the resize engine to recompute a different global scale, which may restore the height while still changing typography and wrapping. A correct fix therefore cannot merely force the outer height back to 1056px.

Temporary browser experiments also established that `text-size-adjust` and a reset-style CSS `zoom` do not solve the problem. JavaScript browser-zoom detection would be fragile across browsers and display configurations and is explicitly rejected.

### Native-QA architecture amendment (2026-07-15)

The first implementation used `zoom: 2.25` plus an inverse transform. It removed WebKit's dramatic small-text enlargement, but native cmux WebKit QA proved that it did not satisfy the exact invariant. With unchanged content and a fixed `--global-scale`, WebKit produced a representative 13.78px bullet line box at 100% browser zoom and a 13.33px line box at 50%. After reload, the resize engine consequently selected 1.0941 at 50% instead of the 1.0666 selected at 100%.

Raw DOM inspection showed that CSS `zoom` quantizes line boxes at the combined CSS-zoom and browser-zoom factor. Raising the hidden CSS zoom reduces the error but cannot eliminate it without impractically large layout dimensions and capture risk. The approved correction therefore prohibits CSS `zoom` in the resume presentation boundary.

A second implementation used genuine 2.25x author dimensions and an exact inverse transform. This removed CSS `zoom`, kept the visible page at 816x1056px, and passed the automated geometry contract. Native WebKit QA nevertheless showed that the resize engine still selected representative global scales of 1.0666 at 100% and 1.0941 at 50%. At 50% browser zoom, the smallest supported 8px text existed as only 9 display pixels before inverse presentation (`8 * 2.25 * 0.5`), so the browser still had room to compensate or quantize it differently.

The corrected scale follows directly from the supported range: a live author scale of 4.5 keeps the smallest supported text at 18 display pixels before inverse presentation even at 50% browser zoom (`8 * 4.5 * 0.5`). Normal physical-pixel rasterization can still produce tiny fractional differences in reported line boxes. Those differences are acceptable visually, but they must not become inputs to Fit Constraints.

For resize measurement only, Presume therefore temporarily supersamples the same author-coordinate document at 18x with an exact 1/18 inverse transform, runs the complete synchronous height search, and restores the live 4.5x variables in `finally`. A native experiment using the real resize engine selected the same representative global scale, 1.0595703125, at both 100% and 50%. This is deterministic measurement resolution, not browser-zoom detection.

## Approved User-Facing Contract

Browser zoom scales the resume as a single visual object:

- The resume may appear smaller at 50% than at 100%.
- Its width-to-page-height ratio, typographic hierarchy, line breaks, selected `--global-scale`, and page count remain the same for the same content and constraints.
- The surrounding editor shell continues to follow normal browser zoom and responsive reflow.
- The current 100% composition is the canonical result.
- Direct editing, focus, selection, and pointer placement remain natural at every supported zoom level.
- A PDF exported at 50% has the same document geometry as one exported at 100%.

The primary supported regression range is standard browser zoom from 100% down through 50%, including 90%, 80%, 70%, and 60%. The architecture should behave sensibly outside this range, but exhaustive behavior at unusual browser zoom settings is outside issue #27.

## Recommended Architecture

### Canonical high-resolution document layer

Render the resume in genuine 4.5x author dimensions, then apply the exact inverse visual transform before presenting it inside the editor. Genuine author dimensions mean that page width, page height, padding, typography, spacing, borders, annotations, and in-document controls use CSS lengths multiplied by 4.5. Do not use the CSS `zoom` property to obtain those dimensions.

In simplified terms:

```text
Visible document geometry
  816px wide Letter page unit
  1056px high Letter page unit

Internal author geometry
  actual CSS lengths at 4.5 x the normal resume values
  immediately presented through a 1 / 4.5 visual transform
```

The two operations cancel visually. Users see the existing 816px-wide resume with its existing typography and spacing. WebKit lays out the smallest supported 8px resume text as an actual 36px CSS font (`8 * 4.5`), which remains 18 display pixels at 50% browser zoom before the inverse presentation. Because the browser performs layout in genuine large coordinates rather than through CSS `zoom`, native browser zoom no longer invokes the original small-text compensation.

The scale conversion is mechanical and ratio-preserving. It is not authorization to redesign the resume or adjust individual values by eye.

### Component boundary

Introduce a focused `ResumeViewport` presentation boundary around the existing `ResumePage`. Its responsibilities are:

- establish the canonical visible width and minimum Letter-page height;
- host the genuine high-resolution author layer and inverse presentation transform;
- expose the complete canonical visual height when content spans more than one Letter-page unit;
- keep the fixed-width canvas scroller aware of the visible 816px document, not the enlarged internal dimensions.

`ResumeViewport` is a document-specific wrapper, not a general-purpose scaling abstraction. `App.tsx` composes it around `ResumePage`; resume content components remain unaware of the high-resolution presentation technique.

The existing `pageRef` continues to identify the element whose canonical rendered geometry is measured, exported, and reviewed. `useResizeEngine`, `Toolbar`, and `useResumeReview` retain their public interfaces.

### Multi-page behavior

The 816×1056 contract defines one Letter-page unit; it is not a one-page-only restriction. `maxPages` may intentionally allow more than one page, and existing PDF export slices a tall canonical canvas into Letter-height pages.

The presentation boundary must therefore:

- use 1056px as the minimum visible height for the default one-page document;
- expand to the resume's complete canonical rendered height when content legitimately exceeds one page;
- never clip editable content, editor controls, warnings, or review annotations;
- preserve the existing page-height measurements used by Fit Constraints and PDF slicing.

The wrapper tracks the page element's canonical visual height and uses the greater of that value or 1056px as its own visible height. A document-content observer may perform this synchronization. It observes content geometry only; it does not inspect or infer browser zoom. The measured page element remains the inner canonical layer so the wrapper's asynchronous size synchronization cannot become an input to the resize engine's synchronous fitness checks.

## Measurement and Data Flow

The expected flow remains:

```text
Resume data + Fit Constraints
  -> ResumePage content
  -> canonical high-resolution author-coordinate layer
  -> exact inverse visual presentation
  -> canonical geometry measured by useResizeEngine
  -> warnings, export, and review consume the same page reference
```

`useResizeEngine` must continue to choose one global scale from resume content and user constraints. Browser zoom must not affect the height returned to its fitness checks. For unchanged data and constraints, reloading at 50% must not select a different `--global-scale` than loading at 100%.

During the synchronous DOM-measurement phase only, `useResizeEngine` temporarily changes the resume's author scale to 18 and its presentation scale to 1/18. The complete binary search and minimum-scale diagnostic execute inside that single temporary scope. The previous inline values are restored in `finally`, and the chosen `--global-scale` is then applied to the live 4.5x presentation. This keeps physical-pixel rounding out of the formatting decision without changing visible geometry, user controls, stored data, or public hook interfaces.

No resume data, LocalStorage value, JSON format, stable identifier, or constraint bound changes as part of this work.

## Editing and Interaction

CSS scaling must preserve browser-native coordinate mapping. The implementation must confirm:

- clicking an editable field places the caret in the intended field;
- typing updates the intended resume value;
- selection, focus outlines, add/remove controls, and review annotations remain aligned with their content;
- the 816px resume remains inside `.resume-canvas-scroll` on narrow screens;
- page-level horizontal overflow is not introduced.

The editor controls remain part of the scaled document presentation so they stay attached to the content they manipulate. Their existing export-time hiding behavior remains unchanged.

## PDF and Review Capture

`exportPDF` and configured Review both consume the same resume element through the existing page reference. Their observable behavior must remain independent of browser zoom.

The implementation will first verify whether `html2canvas` correctly captures the canonical transformed element. If it does, no export-specific workaround is added.

If capture observes enlarged internal dimensions or a compounded transform, add the smallest export-only normalization around `captureResumePage`:

- normalize only for the duration of capture;
- preserve the canonical width, complete canonical height, and Letter-page slicing ratio;
- restore every temporary style or class in `finally`, including on capture failure;
- keep the public export and Review APIs unchanged.

Do not clone or maintain a second resume renderer solely for export. The live document remains the source of truth.

## Responsive and Styling Boundaries

- Keep the editor shell and application chrome responsive under browser zoom.
- Preserve the editor-shell composition delivered by PR #26, including the 1640/1639 wide-layout boundary.
- Preserve the fixed 816px resume width and intentional horizontal canvas scroller on narrow screens.
- Keep layout-scale constants narrowly scoped to the resume presentation boundary.
- Multiply every resume-internal CSS length that affects geometry or visible weight by the same live 4.5 factor before applying the inverse transform. This includes in-document editor controls defined in `app.css`.
- Do not use CSS `zoom` in the presentation boundary.
- Avoid a broad rewrite of `src/styles/resume.css`; adjust only the selectors necessary to establish the layer and its canonical geometry.
- Do not change resume typography, margins, spacing, print hiding, colors, or editor-control design while fixing zoom geometry.
- Do not use browser/device-pixel-ratio sniffing, user-agent detection, or viewport-specific zoom compensation.

## Failure and Edge-Case Handling

- Font loading remains a prerequisite for resize measurement, as it is today.
- A failed PDF capture restores any temporary presentation state before surfacing the existing error.
- Content that cannot satisfy Fit Constraints still produces the existing formatting warnings; the zoom fix must not conceal genuine overflow.
- Legitimate multi-page content remains visible and exportable.
- Reduced motion is unaffected because this design adds no animation.
- If the chosen CSS composition cannot preserve caret placement or canonical export in a supported browser, stop and amend this design rather than adding per-browser zoom detection.

## Testing and Verification

Testing should be conservative and protect user-visible contracts instead of duplicating implementation details.

### Focused automated coverage

The repository's Playwright configuration runs Desktop Chrome and does not provide a reliable native-browser-zoom control. Do not add a nominal WebKit project or simulate browser zoom merely to claim automated coverage of Safari's behavior.

Add one focused browser-level contract for the new presentation boundary in the existing Playwright suite. It should verify:

- the visible resume remains 816px wide and at least one canonical 1056px Letter-page unit high;
- the enlarged internal layout does not leak into the canvas scroller's visible or scroll geometry;
- the page's untransformed live author width is 3672px (`816 * 4.5`) while its visible bounding width remains 816px;
- the smallest allowed live author font is at least 36px before inverse presentation;
- resize measurement temporarily observes an 18x author scale and exact inverse, then restores the previous live presentation variables;
- computed CSS `zoom` remains `1` / `normal` on the page layer;
- direct editing still changes the intended field through the scaled presentation;
- a deliberately taller document expands the visible boundary rather than being clipped, if this is not already covered by an existing test.

Add or adjust a small export unit contract only if capture normalization is necessary. Extend existing narrow-canvas tests only where the new presentation boundary changes their observable contract. Do not add visual snapshots or a large matrix of repetitive tests.

Actual 100%–50% Safari/WebKit browser zoom remains a direct cmux QA requirement. Viewport resizing, device-pixel-ratio emulation, and CSS scaling are not valid substitutes for native browser zoom and must not be reported as such.

### Manual cmux verification

In the cmux WebKit browser, compare the same resume without changing data or constraints at:

- 100%
- 90%
- 80%
- 70%
- 60%
- 50%

At each level, confirm the resume scales as one unit without changing line breaks, page proportions, page count, or formatting warnings. At 100% and 50%, also:

- edit representative header and bullet text;
- exercise add/remove controls;
- export a PDF and compare page count and rendered composition;
- reload the editor and confirm the global scale and wrapping remain stable.

Spot-check the narrow editor at 358px to confirm the visible resume remains 816px wide and horizontal overflow stays inside `.resume-canvas-scroll`.

### Release gate

Run the existing project verification:

```sh
NODE_OPTIONS=--localstorage-file=/tmp/presume-vitest-localstorage npm test -- --run
npm run build
CI=1 npm run test:e2e
test -f dist/index.html
test -f dist/404.html
cmp dist/index.html dist/404.html
git diff --check
git status --short --branch
```

Confirm no changes to resume data schemas, JSON format, LocalStorage behavior, Review contracts, routing, or generated artifacts.

## Rollback Strategy

Keep the change isolated to the resume presentation boundary, narrowly related CSS, necessary export normalization, and focused tests. If the approach proves incompatible with editing or export, reverting the issue branch must restore the existing renderer without requiring data or schema rollback.

## Out of Scope

- Redesigning the resume template or editor shell.
- Changing Fit Constraints behavior, ranges, or warnings.
- Changing the resume JSON format, LocalStorage format, or review schema.
- Adding PDF import.
- Detecting browser zoom in JavaScript.
- Guaranteeing pixel identity at every browser-specific or accessibility zoom setting outside the verified range.
- Replacing `html2canvas`, the PDF pipeline, Pretext, or the direct-editing model without evidence that the approved boundary cannot satisfy the contract.

## Acceptance Criteria

Issue #27 is complete when:

1. The default resume preserves its 100% typography, wrapping, selected global scale, and Letter-page proportions throughout the verified 100%–50% zoom range.
2. Reloading at 50% does not reformat the resume.
3. Direct editing and in-document controls remain correctly aligned and usable.
4. Narrow-screen overflow remains contained by the fixed canvas scroller.
5. PDF export and Review capture remain canonical and independent of browser zoom.
6. Legitimate multi-page documents remain fully visible and exportable.
7. Focused regression coverage and the complete release gate pass.
8. Manual cmux WebKit QA records the exact zoom levels and does not substitute nearby viewport widths for browser zoom.
