# Locked landing reference manifest

## Purpose

This directory preserves the approved **Direction D — Current hardened** visual handoff. Later user-approved reopenings replaced its static Fit raster with a live text-only Pretext instrument, its framed editor hero with an authentic exported Letter surface above 700px plus a purely typographic mobile hero, its full Review dashboard capture with a concise semantic advisory specimen, its decorative heading eyebrows with direct headings, and its bottom-aligned thesis interpretation with vertical centering. Production also adds verified GitHub and LinkedIn links under a restrained footer Elsewhere label. `docs/landing/PRESUME_LANDING_BRIEF.md` is authoritative for those production exceptions. The archived comp, assets, and baselines remain unchanged historical references.

Serve it from this directory so the comp’s absolute `/files/` references resolve:

```bash
cd docs/landing/reference
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/quiet-instrument-mineral-hardened.html
```

The editor links inside the archived comp remain disposable localhost links and are not deployment guidance.

## Repository authorities

- Repository snapshot used for final audit: `6366b8d194375e01ea7b9bcdf960509e5d290f9d`
- Default resume source: `src/defaultResume.ts`
- Default resume source SHA-256: `6b2095964adef25a3bfbe374ae1bd0a7225b0eaf0940579f2beb3965b0427ecf`
- Landing Review specimen source: `src/landingReviewSpecimen.ts`
- Landing Review specimen SHA-256: `be258ea1c491d360d598591d8168708cf4fe43f86ec38d8ef4795f97ff21b54e`
- Configured Review E2E source: `e2e/configured-review.spec.ts`
- Configured Review E2E source SHA-256: `5f7589ee1127ef9eca3b3d859884bf8cb42297020630be938e1525bd6dd5b35d`

The E2E route verifies that a PDF multipart upload occurs, then returns the deterministic fixture for any submitted PDF. The production landing and configured fixture import the same `81 / 100`, evidence, and suggestion values. The visible landing disclosure states **Example fixture · not content-derived**.

## Locked comp

- File: `quiet-instrument-mineral-hardened.html`
- Visual direction: The Quiet Instrument / Mineral Quiet / Direction D
- Fixed landing appearance: light Mineral Quiet with green-black terminal field
- Product surfaces represented: editor, Fit, Review
- Review disclosure: `Illustrative test fixture · sample resume shown`

`SHA256SUMS` records the exact comp, font, captures, and baseline screenshots.

## Product-capture provenance

### Editor hero

- Desktop reference: `files/editor-hero-desktop-hardened.png`, 980 × 855
- Narrow reference: `files/editor-hero-narrow-hardened.png`, 900 × 635
- The 1× images preserve the approved editor study state and crop.
- The study `@2x` images are density-aware derivatives of the approved 1× state, not native high-density captures.
- The later exported-Letter hero supersedes these files for production. Do not treat the study `@2x` files as native evidence or restore them to the hero.

### Fit

- Desktop reference: `files/working-fit-lab-capture-hardened.png`, 742 × 355
- Narrow reference: `files/working-fit-lab-narrow-hardened.png`, 358 × 623
- These are static captures of the working Fit fixture retained as exploration history.
- They describe the originally approved raster treatment, which the later user-approved live Pretext instrument supersedes for production. They must not be restored as interactive-looking screenshots.

### Review

- Desktop reference: `files/working-review-capture-hardened.png`, 662 × 743
- Narrow reference: `files/working-review-narrow-essential-hardened.png`, 366 × 603
- These are static captures of the working Review interface displaying the historical repository E2E response.
- Narrow art direction is a crop of the interface, not a reconstruction.
- The later semantic advisory specimen supersedes both files for production. They must not be restored to the landing without a new design decision.

### Archived-capture reproducibility limit

The approved exploration assets predate this durable manifest. Their final dimensions, roles, and hashes are preserved, but complete historical route state, crop commands, wait conditions, and optimization commands were not recorded consistently enough to claim independent reproduction. They are historical visual authorities only. Current production capture and semantic-evidence provenance is recorded in `../PRODUCTION_CAPTURE_MANIFEST.md`.

## Baseline screenshot procedure

Reference screenshots were generated with:

- Playwright Chromium `149.0.7827.55`
- macOS ARM64
- Device scale factor: `1`
- Reduced motion: `reduce`
- Fixed light landing appearance
- Geist awaited through image/page readiness
- Every lazy image scrolled into range and decoded before capture
- Page returned to scroll position `0`
- Full-page screenshot
- Skip link verified separately, then hidden only for the presentation screenshot

Baselines:

- `baselines/hardened-1440.png` — viewport 1440 × 900
- `baselines/hardened-1000.png` — viewport 1000 × 800
- `baselines/hardened-700.png` — viewport 700 × 800
- `baselines/hardened-390.png` — viewport 390 × 844
- `baselines/hardened-320.png` — viewport 320 × 740

The implementation brief defines additional 1px breakpoint-pair checks. These five images are visual references, not a license to omit those geometry checks.

## Production evidence rule

`../PRODUCTION_CAPTURE_MANIFEST.md` records the current Letter raster provenance and the shared Review specimen/fixture hashes. Any future product capture must record repository commit, route/configuration, storage state, source hashes, browser, viewport/DPR, font readiness, wait condition, source dimensions, crop, independent density outputs, generation/optimization command, and SHA-256 checksums.

A capture is not accepted if its visual state cannot be reproduced or if cropping removes context required to support the adjacent claim. Review currently ships no product capture.
