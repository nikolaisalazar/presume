---
name: Presume
description: A precise, calm, document-led resume workbench.
colors:
  verdigris: "#2e9e91"
  verdigris-deep: "#14796f"
  verdigris-edge: "#6bc8bd"
  verdigris-ink: "#f7fffd"
  canvas-light: "#edf2f0"
  canvas-light-deep: "#e2e9e6"
  surface-light: "#f8fbfa"
  surface-light-raised: "#ffffff"
  surface-light-pressed: "#eef3f1"
  stage-light: "#dfe7e4"
  line-light: "#bccbc6"
  line-light-strong: "#9eafa9"
  text-light: "#17211e"
  text-light-muted: "#56635e"
  canvas-dark: "#101513"
  canvas-dark-deep: "#0c100f"
  surface-dark: "#1a211f"
  surface-dark-raised: "#202825"
  surface-dark-pressed: "#151b19"
  stage-dark: "#0d1210"
  line-dark: "#34403c"
  line-dark-strong: "#46534e"
  text-dark: "#f0f3f1"
  text-dark-muted: "#aab4b0"
  paper: "#fffefb"
  paper-ink: "#101827"
  warning-light: "#984a2d"
  warning-dark: "#e6a56f"
  success-light: "#216a49"
  success-dark: "#88cfad"
  error-light: "#9c3f2e"
  error-dark: "#f0a28d"
typography:
  display:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 620
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, Helvetica Neue, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.005em"
  document:
    fontFamily: "EB Garamond, Iowan Old Style, Garamond, Georgia, serif"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  paper: "0px"
  structural: "2px"
  control: "4px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.verdigris-deep}"
    textColor: "{colors.verdigris-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface-light-raised}"
    textColor: "{colors.text-light}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-secondary-dark:
    backgroundColor: "{colors.surface-dark-raised}"
    textColor: "{colors.text-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  structural-shell:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.structural}"
    padding: "16px"
  structural-shell-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.structural}"
    padding: "16px"
  resume-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    typography: "{typography.document}"
    rounded: "{rounded.paper}"
    width: "816px"
    height: "1056px"
  review-progress:
    backgroundColor: "{colors.verdigris}"
    textColor: "{colors.verdigris-ink}"
    rounded: "{rounded.paper}"
    height: "3px"
---

# Design System: Presume

## Overview

**Creative North Star: “The Precision Workbench”**

Presume is a calm, exacting instrument built around a document—not a dashboard that happens to contain one. The interface should feel engineered, coherent, and quietly premium: aligned like a drafting surface, materially consistent like a well-made tool, and restrained enough that the resume remains the visual anchor.

The full-width masthead establishes the product, while the desktop workbench resolves into three deliberate zones: a 320px Fit surface, a center command rail and fixed 816 × 1056px resume, and a 320px Review surface. Through 1639px, Fit moves above the editor and Review moves below it. This reflow is graceful degradation, not a shift in product priority; the desktop document workbench remains primary and the fixed resume scrolls only inside its designated canvas on narrow screens.

Light and Dark themes are equally authoritative. The first visit follows the system setting, and an explicit Light, Dark, or System choice persists. The resume paper remains warm white in every app theme, preserving the independence of the editable and exported artifact.

**Key Characteristics:**

- Document-led hierarchy with application chrome in a supporting role.
- Rectilinear geometry: 2px structural shells and 4px controls.
- Restrained Verdigris used for action, selection, focus, and active Review states.
- Layered precision through borders, tonal surfaces, inset highlights, and sparse ambient shadow.
- Progressive disclosure for Fit and Review rather than permanent information density.
- State motion that communicates progress without decorating the workspace.

**The Document Anchor Rule.** The resume must remain the dominant visual object at desktop and laptop widths. No application surface may compete with its contrast, scale, or central placement.

**The Desktop-First Rule.** Wide-screen composition is the primary design. Narrow-screen base styles are an implementation technique for deterministic breakpoints, never a reason to redesign the product as mobile-first.

## Colors

The palette is a cool neutral workbench animated by restrained Verdigris and isolated semantic color. Light mode uses mineral gray-greens rather than beige paper; Dark mode uses near-black green neutrals rather than generic charcoal.

### Primary

- **Verdigris:** The recognizable brand accent for current selection, progress, focus, and active Review states.
- **Deep Verdigris:** The default primary-action fill and brand-mark field.
- **Verdigris Edge:** The crisp interactive edge used for focus rings, selected borders, and restrained button gleam.
- **Verdigris Ink:** High-contrast content on Verdigris fills.

### Secondary

- **Advisory Amber:** Formatting warnings, unavailable Review service, and other conditions that deserve attention without implying failure.
- **Evidence Green:** Successful review results and confirmed positive states.
- **Corrective Red:** Errors and destructive actions only.

### Neutral

- **Workbench Canvas:** The application background; mineral light in Light mode and near-black green in Dark mode.
- **Tool Surface:** Fit, Review, masthead, command rail, menus, and other structural planes.
- **Raised Surface:** Buttons, menus, and controls that sit one tonal step above their parent.
- **Pressed Surface:** Selected rows, steppers, and inset control wells.
- **Structural Line:** Default one-pixel borders and separators.
- **Strong Structural Line:** Major shell boundaries, deliberate focus-adjacent edges, and masthead separation.
- **Resume Paper:** A stable warm white reserved for the document in both themes.

**The Ten-Percent Rule.** Verdigris should occupy no more than roughly ten percent of a normal screen. Its rarity gives it authority.

**The Semantic Isolation Rule.** Amber, green, and red communicate status only. They are forbidden as ornamental accents or section colors.

**The Paper Independence Rule.** App theme changes never tint the resume. The editable document and exported PDF remain warm white with dark ink.

## Typography

**Display Font:** Geist, with Helvetica Neue and system-ui fallbacks
**Body Font:** Geist, with Helvetica Neue and system-ui fallbacks
**Document Font:** EB Garamond, with Iowan Old Style, Garamond, Georgia, and serif fallbacks

**Character:** Geist gives the application Swiss-modern clarity, consistent numerals, and a coherent voice across wordmark, controls, Review evidence, and settings. EB Garamond belongs exclusively to the resume and exported PDF, making the document feel authored rather than app-like while preserving the existing browser, fit, and PDF geometry contract.

### Hierarchy

- **Display** (620, 1.3125rem, 1.0): Presume wordmark and rare product-level identity only.
- **Headline** (650, 1.125rem, 1.2): Major panel results and high-value state headings.
- **Title** (650, 0.8125rem, 1.2): Fit, Review, toolbar groups, and local surface headings.
- **Body** (400, 0.875rem, 1.5): Explanatory content, evidence, and settings descriptions; prose is capped at 70ch.
- **Label** (600, 0.75rem, 1.25): Buttons, compact controls, status metadata, and field labels.
- **Document** (400–700, canonical resume tokens): Resume content only; name, section, entry, contact, and bullet sizes remain governed by the resume layout contract.

Use Geist tabular numerals for Review scores, steppers, page counts, and measurements. Do not introduce a monospace font merely to make numbers feel technical.

**The One Application Voice Rule.** All application text—including the Presume wordmark, Review scores, labels, buttons, and steppers—uses Geist. No second UI or display family is permitted.

**The Document Boundary Rule.** EB Garamond never leaks into application chrome, and Geist never replaces the resume font through ordinary theme work. A document-font change requires explicit browser/PDF wrapping, pagination, extraction, and fit validation.

## Elevation

Presume uses **Layered Precision**: borders and tonal planes establish structure first; inset highlights suggest material finish; ambient shadows are reserved for the masthead, major workbench surfaces, overlays, and the resume itself. Ordinary controls should feel crisp, not floating or jewel-like.

### Shadow Vocabulary

- **Inset Edge** (`inset 0 1px 0 rgba(255,255,255,0.075)`): A restrained top highlight on structural surfaces in Dark mode; stronger but still quiet in Light mode.
- **Control Edge** (`inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25)`): Primary and raised controls only.
- **Structural Ambient** (`0 10px 26px rgba(0,0,0,0.14)`): Fit, Review, command rail, and other major shells at wide layouts.
- **Masthead Ambient** (`0 8px 24px rgba(0,0,0,0.18)`): Separates the full-width masthead from the working field.
- **Document Ambient** (`0 18px 46px rgba(31,52,45,0.16)` in Light mode; darker equivalent in Dark mode): The strongest elevation because the document is the anchor.

**The Borders-Before-Shadows Rule.** A one-pixel border and tonal contrast must explain a surface before shadow is added. If shadow is doing the structural work, the component is over-elevated.

**The No Glass Rule.** Blur, translucent glass panels, liquid-glass distortion, and glow-heavy surfaces are prohibited. Premium finish comes from exact edges and controlled highlights.

## Components

Components share one geometry, type, state, and material vocabulary. shadcn primitives are implementation foundations, not visual defaults; their semantic tokens and variants must express this system rather than generic rounded shadcn styling.

### Buttons

- **Shape:** Crisp rectangular controls with 4px corners and consistent 36px desktop height. Touch-critical controls reach 44px at the documented narrow boundary.
- **Primary:** Deep Verdigris fill, Verdigris Ink text, and a restrained top-edge gleam. Use once per immediate action group.
- **Secondary:** Raised neutral surface, one-pixel structural border, and Geist label typography.
- **Hover / Active:** Move through semantic tonal states; active may translate down by one pixel. Never grow, bounce, or gain a large floating shadow.
- **Focus:** Two-pixel Verdigris Edge outline with visible offset; focus remains distinct in both themes.
- **Disabled:** Reduced contrast and no motion, while retaining legible text and recognizable shape.

### Chips

- **Style:** Compact status-only Badges with 4px corners, semantic surface tint, and readable text.
- **State:** Badges display tier, severity, and availability. They never impersonate buttons and never use pill geometry by default.

### Cards / Containers

- **Corner Style:** Structural shells use 2px corners; the resume uses square corners.
- **Background:** One of the named Tool, Raised, or Pressed surfaces—never an arbitrary near-white or charcoal.
- **Shadow Strategy:** Borders and tonal layers first; use Structural Ambient only on major surfaces.
- **Border:** One-pixel Structural Line; Strong Structural Line only for major boundaries or active emphasis.
- **Internal Padding:** 16px for primary shells, 12px for compact groups, and 8px for tightly related metric cells.

Fit and Review must balance at the wide layout with equal 320px columns. Do not add decorative vertical stripes. Fit’s collapsed summary reads `1 page · 1 line/bullet · 8px min` and disappears while the panel is expanded. The disclosure chevron must be visible enough to read as an affordance without becoming a separate decorative button.

### Inputs / Fields

- **Style:** Raised or Pressed neutral surface, one-pixel border, 4px corners, and Geist labels.
- **Focus:** Verdigris Edge border or two-pixel outline; never color alone.
- **Error / Disabled:** Semantic text and border treatment with explicit language. Disabled values remain readable.
- **Steppers:** Minus, value, and plus share one segmented 4px control. Units such as page, line, and px remain outside the numeric field when labels already communicate them.

### Navigation

The masthead spans the browser width while the Fit/editor/Review workbench remains content-constrained beneath it. The brand sits left. `Saved locally` sits immediately before the theme control on the right, so it reads as status rather than a button. The theme control offers System, Light, and Dark; first visit follows System and the explicit choice persists.

Document actions live in the center command rail above the resume. Do not add an `EXPORT` label when the `Export PDF` and `Export JSON` buttons already name the group. Review is not a masthead action: its trigger lives in the persistent Review surface.

### Resume Canvas

The resume is a fixed 816 × 1056px Letter surface with warm-white paper, EB Garamond typography, and its own canonical layout tokens. Browser zoom may change only its visual presentation; it must not change wrapping, pagination, or PDF dimensions. On narrow screens, horizontal overflow is contained inside the resume canvas scroller, never the page.

### Review Surface

Review remains a persistent peer to Fit rather than disappearing when closed. Its collapsed and active forms preserve stable dimensions so starting a review does not cause layout jump. The initial row consolidates status and the `Review resume` action without stacking redundant status text.

The loading label is `Reviewing` without an ellipsis. Progress is communicated by a 3px Verdigris sweep along the bottom edge. Under reduced motion, the sweep becomes a static full-width indicator. Completed results use the approved mixed-visibility hierarchy: compact overall score, category grid, selectively disclosed evidence, and inline bonus/deduction adjustments rather than separate cards.

## Do's and Don'ts

### Do:

- **Do** keep the fixed resume visually dominant and centered within its stage.
- **Do** use Geist for every application role and EB Garamond only for the resume/PDF.
- **Do** use 2px structural corners, 4px control corners, and one-pixel borders consistently.
- **Do** make Light and Dark themes complete peers and persist System, Light, or Dark preference.
- **Do** reserve Verdigris for primary action, selection, focus, progress, and active Review state.
- **Do** preserve clear hover, active, disabled, focus-visible, loading, success, warning, and error states.
- **Do** keep motion between 150–250ms for ordinary state changes and provide a reduced-motion alternative.
- **Do** treat narrow layouts as graceful degradation while keeping touch-critical controls usable and page-level overflow absent.
- **Do** keep Fit above the editor and Review below it through 1639px; maintain the wide three-zone workbench from 1640px.

### Don't:

- **Don't** create generic clickbait SaaS dashboards or template-heavy shadcn defaults.
- **Don't** make the interface excessively rounded, soft, glassy, or decorative.
- **Don't** create card-heavy layouts where every region receives equal visual weight.
- **Don't** add marketing-style visual noise, ornamental animation, or oversized controls.
- **Don't** build a resume editor that treats the document as a secondary preview pane.
- **Don't** create automated-writing experiences that obscure or surrender user control.
- **Don't** use decorative vertical accent strips, glow-heavy edges, gradient text, beige parchment app backgrounds, or blue merely because it is a familiar software accent.
- **Don't** add redundant text when a button, title, or state label already communicates the same information.
- **Don't** use a rounded pill for ordinary buttons, status rows, or disclosure controls.
- **Don't** change `src/styles/resume.css`, resume geometry, PDF typography, or JSON structure as collateral to application-theme work.
