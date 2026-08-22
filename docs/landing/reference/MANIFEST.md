# Locked landing reference manifest

## Purpose

This directory preserves the approved **Direction D — Current hardened** visual handoff. A later user-approved reopening replaced only its static Fit raster with a live text-only Pretext instrument; `docs/landing/PRESUME_LANDING_BRIEF.md` is authoritative for that production exception. The archived comp, assets, and baselines remain unchanged historical references.

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
- Configured Review E2E source: `e2e/configured-review.spec.ts`
- Configured Review E2E source SHA-256: `bcbb0b53195290da261a929ba3e73176bf6d4a553545b9204204bcd6bae34427`

The E2E route verifies that a PDF multipart upload occurs, then returns the same deterministic fixture for any submitted PDF. The `81 / 100` response is displayed in the working Review interface while the default Alex Johnson sample is shown; it is **not** proven to be content-derived from that sample.

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
- Production must make a new native-density capture from a stable editor state; do not treat the study `@2x` files as native evidence.

### Fit

- Desktop reference: `files/working-fit-lab-capture-hardened.png`, 742 × 355
- Narrow reference: `files/working-fit-lab-narrow-hardened.png`, 358 × 623
- These are static captures of the working Fit fixture retained as exploration history.
- They describe the originally approved raster treatment, which the later user-approved live Pretext instrument supersedes for production. They must not be restored as interactive-looking screenshots.

### Review

- Desktop reference: `files/working-review-capture-hardened.png`, 662 × 743
- Narrow reference: `files/working-review-narrow-essential-hardened.png`, 366 × 603
- These are static captures of the working Review interface displaying the repository E2E response.
- Narrow art direction is a crop of the interface, not a reconstruction.
- The response must retain visible HTML disclosure outside the raster.

### Archived-capture reproducibility limit

The approved exploration assets predate this durable manifest. Their final dimensions, roles, and hashes are preserved, but complete historical route state, crop commands, wait conditions, and optimization commands were not recorded consistently enough to claim independent reproduction. They are visual authorities only. The implementation brief therefore requires new production captures with the complete manifest below before release.

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

## Required production capture manifest

Before final production acceptance, record each replacement editor or Review product capture:

1. Repository commit.
2. Route and configuration.
3. Clean-storage or seeded-storage state.
4. Default resume source hash.
5. Review fixture source hash, when applicable.
6. Theme.
7. Browser and version.
8. Viewport and device scale factor.
9. Font-ready assertion.
10. Capture wait condition.
11. Source screenshot dimensions.
12. Crop rectangle.
13. Output 1× and 2× dimensions.
14. Optimization command and format.
15. SHA-256 checksums.

A capture is not accepted if its visual state cannot be reproduced or if cropping removes context required to support the adjacent claim.
