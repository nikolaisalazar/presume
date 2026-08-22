# Production landing capture manifest

## Status

The editor and Review assets are the production replacements for the archived exploration captures. They were captured independently at native 1× and 2× device scale; no 2× file is an upscale of its 1× counterpart.

Fit evidence is now a live, text-only Pretext instrument rendered by the landing. It has no production raster and is therefore outside capture provenance. The former Fit PNGs remain only in the historical `docs/landing/reference/**` archive.

- Protected-surface source commit: `6366b8d194375e01ea7b9bcdf960509e5d290f9d`
- Browser: Playwright Chromium `149.0.7827.55`
- Platform: macOS ARM64
- Default resume source: `src/defaultResume.ts`
- Default resume SHA-256: `6b2095964adef25a3bfbe374ae1bd0a7225b0eaf0940579f2beb3965b0427ecf`
- Review fixture source: `e2e/configured-review.spec.ts`
- Review fixture source SHA-256: `bcbb0b53195290da261a929ba3e73176bf6d4a553545b9204204bcd6bae34427`
- Theme: Light
- Reduced motion: Reduce

The working tree’s protected editor, Fit, and Review implementation matched the source commit. Landing-only implementation changes do not participate in the captured editor or Review interfaces, and the live landing instrument does not modify protected Fit behavior.

## Editor hero

### Source state

- Route: `/presume/editor/`
- Configuration: Review unconfigured
- Storage: `localStorage.clear()` before navigation
- Viewport: 1440 × 900 CSS px
- DPR captures: 1 and 2, captured independently
- Readiness:
  1. `document.fonts.ready`
  2. Resume page visible
  3. Stable formatting warning visible
  4. Two animation frames
- Visible state: the default sample truthfully reports that it cannot fit under the current one-page, one-line, 8px-minimum constraints.

### Crops

Coordinates are CSS pixels; DPR 2 multiplies every coordinate by two.

- Desktop: `(230, 45)` to `(1210, 900)` → 980 × 855 / 1960 × 1710
- Narrow art direction: `(265, 100)` to `(1165, 735)` → 900 × 635 / 1800 × 1270

The crops are losslessly optimized RGB PNGs. No resize, reconstruction, warning removal, or content retouching was applied.

## Review evidence

### Source state

- Route: `/presume/editor/`
- Configuration endpoint: intercepted configured/available Ollama response
- Review endpoint: intercepted repository `reviewFixture`
- Storage: `localStorage.clear()` before navigation
- Flow: Start review → wait for Review ready → View review → expand Open Source
- Disclosure: production HTML explicitly states that the response is deterministic and not content-derived from the sample resume
- DPR captures: 1 and 2, captured independently

### Desktop

- Viewport: 694 × 1100
- Panel box: 662 × 743.359375 CSS px
- Lossless crop: bottom fractional raster edge only
- Output: 662 × 743 / 1324 × 1486

### Narrow essential crop

- Viewport: 390 × 1100
- Panel width: 366 CSS px
- Full panel height: 889.359375 CSS px
- Essential top crop: first 603 CSS px
- Output: 366 × 603 / 732 × 1206

The narrow file is a crop of the working Review panel, not a reconstruction.

## Social preview

- Generator: `node scripts/generate-landing-social.mjs`
- Font: repository Geist variable font, embedded during capture
- Evidence: production native editor hero capture
- Browser: Playwright Chromium
- Output: 1200 × 630 RGB PNG

## Production checksums

```text
348158d2d1802b4a7eee80036d69e31c07d889d6b88a209569ba1b0ac5a0a26b  public/landing/editor-hero-desktop-hardened.png
1db6cd3a1bbffb93ad9ef10ee6135f95cba56324e62bc46e3dd38e73f0dea1ad  public/landing/editor-hero-desktop-hardened@2x.png
e7a1a58a551bbbf583de10a54ade6980b73077acc4cb43475dfce3593ee1b6dd  public/landing/editor-hero-narrow-hardened.png
98eb845bfa0cc24784bd929b2c4aebb99bb36141d7054d4b9704a3fd8ca09973  public/landing/editor-hero-narrow-hardened@2x.png
fcb7b0ff927bbfb652789326e49748cf044a89a0b49b167699f4951382ed02de  public/landing/working-review-capture-hardened.png
2ba17df580352d81a37c2ae59c73acaf1563d1312cd31316d23c337b5ddb1378  public/landing/working-review-capture-hardened@2x.png
84d2c61ba6673ca8c291d835a12e45d71c20187000b4ff6527c1d666f1f99c2a  public/landing/working-review-narrow-essential-hardened.png
b897f799bba72e3d3cfc7f9c00e941a62e420d1d4a6d86f0a1b0c7d31fb87e3c  public/landing/working-review-narrow-essential-hardened@2x.png
26d6ea276de795417355d39134bbf902866cb7ebb917b15c738bb647436de7b7  public/landing/social-preview.png
16174f165f6e5a5a019a0f256f8dff4a17755e90f5395efe7ea3ea9899380ec4  public/favicon.svg
b212d6d13d37f5303b383f3c4fbba8534761d9aee484b7b57ef59551ab2dfa4e  scripts/generate-landing-social.mjs
```

Re-run the checksum comparison whenever an editor/Review production capture or social generator changes. A changed source state requires a new manifest entry rather than silently replacing these files. Changes to the live Fit instrument are verified as code, interaction, accessibility, and responsive behavior rather than image provenance.
