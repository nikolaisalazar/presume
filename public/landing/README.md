# Document Horizon landing artwork

Generated on 2026-07-27 with the built-in image-generation workflow.

## Final prompt

```text
Use case: photorealistic-natural
Asset type: Presume landing-page hero background, wide landscape 14:9 composition
Primary request: Create a restrained editorial photograph of disciplined white paper sheets on a clean studio surface. One US Letter resume sheet enters from the lower-right edge and is naturally integrated into the photograph.
Scene/backdrop: high-key neutral white studio field with layered white paper, generous clear negative space across the central and upper-middle area for live website text
Subject: one warm-white resume page physically resting among the paper sheets; the resume contains an abstract but unmistakable professional layout with a name line, contact line, section rules, role headings, dates, and short body lines printed directly into the paper
Style/medium: premium natural product photography, subtle paper fibers, exact edges, quiet editorial materiality, realistic optical depth
Composition/framing: wide 14:9 landscape; camera nearly overhead with slight perspective; resume enters from lower right and remains subordinate to the empty central text area; no object crosses the central headline zone
Lighting/mood: soft diffuse studio daylight, restrained short shadows, calm and precise
Color palette: neutral white and soft gray only; no beige, tan, cream cast, teal wash, colored surface, or colored shadow
Text: no readable words, names, addresses, companies, contact information, logos, or watermarks; use only non-legible typographic marks that clearly form a resume hierarchy
Constraints: the resume printing must follow the sheet perspective, focus, lighting, surface texture, and paper absorption; it must look physically printed, never composited above the sheet; preserve large quiet negative space for centered website copy
Avoid: envelope, stationery set, letterpress, typewriter, hands, people, laptop, phone, pen, ruler, measurement marks, interface widgets, meter, badge, statistics, glass, glow, gradient, shader, ornamental motion, legible personal information
```

## Responsive asset commands

```sh
ffmpeg -y -i tmp/imagegen/document-horizon-source.png \
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
```

The artwork contains no real resume or personal data. No third-party attribution is
required.
