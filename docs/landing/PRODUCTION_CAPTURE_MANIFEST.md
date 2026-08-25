# Production landing evidence manifest

## Status

The exported Letter pair is the landing’s only production product raster. Each density is rendered independently from the canonical PDF; the 2× file is not an upscale of the 1× file.

Fit and Review evidence are responsive semantic HTML and make no production raster requests. Fit runs the installed Pretext primitives. Review imports a concise advisory specimen from `src/landingReviewSpecimen.ts`; the configured Review E2E fixture imports the same score, evidence, and suggestion so the landing evidence cannot silently drift from that deterministic response.

Historical editor, Fit, and Review captures remain only in `docs/landing/reference/**`.

- Protected-surface source commit: `6366b8d194375e01ea7b9bcdf960509e5d290f9d`
- Browser used for Letter generation: Playwright Chromium `149.0.7827.55`
- Platform: macOS ARM64
- Default resume source: `src/defaultResume.ts`
- Default resume SHA-256: `6b2095964adef25a3bfbe374ae1bd0a7225b0eaf0940579f2beb3965b0427ecf`
- Review specimen source: `src/landingReviewSpecimen.ts`
- Review specimen SHA-256: `be258ea1c491d360d598591d8168708cf4fe43f86ec38d8ef4795f97ff21b54e`
- Configured Review fixture source: `e2e/configured-review.spec.ts`
- Configured Review fixture SHA-256: `5f7589ee1127ef9eca3b3d859884bf8cb42297020630be938e1525bd6dd5b35d`
- Theme: Light
- Reduced motion: Reduce

Landing changes do not modify protected editor, Fit, Review service, persistence, routing, or export behavior. The separately approved Review action-icon refinement changes only the visible icon/text gap to 6px.

## Exported Letter hero

### Source state and generation

- Route used to export: `/presume/editor/`
- Configuration: Review unconfigured
- Storage: `localStorage.clear()` before navigation
- Resume source: repository default Alex Johnson sample
- Export action: the working product’s **Export PDF** button and canonical PDF renderer
- PDF requirement: exactly one Letter page
- Rasterizer: repository `pdfjs-dist` in Playwright Chromium
- Generator: `npm run generate:landing-letter`
- Independently rendered outputs:
  - `resume-letter.png`: 695 × 899
  - `resume-letter@2x.png`: 1390 × 1799

The generator starts the repository Vite application, clears browser storage, exports the canonical PDF through the working UI, verifies the one-page PDF, and rasterizes it directly at each target width. Production displays the page at exact CSS `aspect-ratio: 8.5 / 11`, with the full width and top edge visible and the bottom cropped by the desktop/tablet hero. At 700px and below, the figure is removed visually and from layout; a local transparent `picture` source prevents the hidden Letter raster from being requested.

No editor chrome, warning, decorative ruler, reconstruction, or content retouching is present in the hero artifact.

## Review advisory specimen

- Rendered source: `src/landingReviewSpecimen.ts`
- Shared fixture consumer: `e2e/configured-review.spec.ts`
- Score: `81 / 100`
- Evidence: `Internship work shows production exposure.`
- Suggestion: `Add one production metric.`
- Required visible disclosure: `Example fixture · not content-derived`
- Production format: semantic `figure`, accessible score label, and `dl`/`dt`/`dd` content
- Production Review images: none

The configured route validates that a PDF multipart upload occurs, then returns its deterministic fixture for any submitted PDF. The specimen therefore demonstrates the shape of advisory output without claiming that the score was computed from the sample resume. Changing any shared specimen value requires updating this manifest and re-running configured E2E coverage.

## Live Fit evidence

Fit uses the installed `@chenglou/pretext` preparation, layout, and line-statistics APIs. It has no production raster and is verified through component, accessibility, responsive, and browser interaction tests.

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
07e26550b6da014fb2756bc7c549a47866bb7baeefc82a99063afd27fa9eee12  public/landing/social-preview.png
16174f165f6e5a5a019a0f256f8dff4a17755e90f5395efe7ea3ea9899380ec4  public/favicon.svg
be258ea1c491d360d598591d8168708cf4fe43f86ec38d8ef4795f97ff21b54e  src/landingReviewSpecimen.ts
5f7589ee1127ef9eca3b3d859884bf8cb42297020630be938e1525bd6dd5b35d  e2e/configured-review.spec.ts
910646fabfec799ef9703b823949c75d4b6d8117ed5907af4de297767b0073ed  scripts/generate-landing-letter.mjs
71f77021cba016af2daa430409f1ec78e8ad7b1120fad733632ac10680c24b21  scripts/generate-landing-social.mjs
```

Re-run checksum comparison whenever the Letter generator or outputs, Review specimen or configured fixture, social generator, social preview, or favicon changes. A changed source state requires a new manifest entry rather than a silent replacement.
