# Production landing capture manifest

## Status

The exported Letter and Review assets are the production replacements for the archived exploration captures. The Letter pair is rendered independently from the canonical PDF at each output density; the Review pair was captured independently at native 1× and 2× device scale. No 2× file is an upscale of its 1× counterpart.

Fit evidence is a live, text-only Pretext instrument rendered by the landing. It has no production raster and is therefore outside capture provenance. The former editor-hero and Fit PNGs remain only in the historical `docs/landing/reference/**` archive.

- Protected-surface source commit: `6366b8d194375e01ea7b9bcdf960509e5d290f9d`
- Browser: Playwright Chromium `149.0.7827.55`
- Platform: macOS ARM64
- Default resume source: `src/defaultResume.ts`
- Default resume SHA-256: `6b2095964adef25a3bfbe374ae1bd0a7225b0eaf0940579f2beb3965b0427ecf`
- Review fixture source: `e2e/configured-review.spec.ts`
- Review fixture source SHA-256: `bcbb0b53195290da261a929ba3e73176bf6d4a553545b9204204bcd6bae34427`
- Theme: Light
- Reduced motion: Reduce

The working tree’s protected editor, Fit, and Review implementation matched the source commit. Landing-only implementation changes do not modify protected editor, Fit, or Review behavior.

## Exported Letter hero

### Source state and generation

- Route used to export: `/presume/editor/`
- Configuration: Review unconfigured
- Storage: `localStorage.clear()` before navigation
- Resume source: repository default Alex Johnson sample
- Export action: the working product’s **Export PDF** button and canonical PDF renderer
- PDF requirement: exactly one Letter page
- Rasterizer: repository `pdfjs-dist` in Playwright Chromium `149.0.7827.55`
- Generator: `npm run generate:landing-letter`
- Outputs rendered independently from the PDF:
  - `resume-letter.png`: 695 × 899
  - `resume-letter@2x.png`: 1390 × 1799

The generator starts the repository Vite application, clears browser storage, exports the canonical PDF through the working UI, verifies the one-page PDF, and rasterizes that PDF directly at each target width. Neither output is resized from the other. Production displays the page at exact CSS `aspect-ratio: 8.5 / 11`, with full width and top edge visible and the bottom cropped by the desktop/tablet hero. At 700px and below the figure is removed visually and from layout; a local transparent `picture` source prevents the hidden Letter raster from being requested.

No editor chrome, warning, decorative ruler, reconstruction, or content retouching is present in the hero artifact.

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
- Evidence: generated authentic exported Letter surface
- Browser: Playwright Chromium
- Output: 1200 × 630 RGB PNG

## Production checksums

```text
113d6924cb651159424da1daa8fd3f7c152efc6144bd275d46becdc889fdd7fa  public/landing/resume-letter.png
b8073f4fd4cdd1749be7610f1cfea9407f18ff7183fdde67dd6e65f01600502e  public/landing/resume-letter@2x.png
fcb7b0ff927bbfb652789326e49748cf044a89a0b49b167699f4951382ed02de  public/landing/working-review-capture-hardened.png
2ba17df580352d81a37c2ae59c73acaf1563d1312cd31316d23c337b5ddb1378  public/landing/working-review-capture-hardened@2x.png
84d2c61ba6673ca8c291d835a12e45d71c20187000b4ff6527c1d666f1f99c2a  public/landing/working-review-narrow-essential-hardened.png
b897f799bba72e3d3cfc7f9c00e941a62e420d1d4a6d86f0a1b0c7d31fb87e3c  public/landing/working-review-narrow-essential-hardened@2x.png
305b5813427bb10dbea763fd7336098ab2600b0d1a278198445c1719dac29371  public/landing/social-preview.png
16174f165f6e5a5a019a0f256f8dff4a17755e90f5395efe7ea3ea9899380ec4  public/favicon.svg
910646fabfec799ef9703b823949c75d4b6d8117ed5907af4de297767b0073ed  scripts/generate-landing-letter.mjs
55fe09fdd8202640c026a8473d932703166e51a19fc4397a447de41e3256bafa  scripts/generate-landing-social.mjs
```

Re-run the checksum comparison whenever the Letter generator, Letter outputs, Review production capture, or social generator changes. A changed source state requires a new manifest entry rather than silently replacing these files. Changes to the live Fit instrument are verified as code, interaction, accessibility, and responsive behavior rather than image provenance.
