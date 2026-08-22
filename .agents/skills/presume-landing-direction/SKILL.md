---
name: presume-landing-direction
description: Use when establishing, reconsidering, or documenting substantial strategy and visual direction for Presume's landing page before production implementation.
license: MIT; see LICENSE
---

# Presume Landing Direction

## Overview

Direct substantial strategy and pre-implementation design for Presume's `/presume/` landing page.

**Core thesis:** Resume tools should preserve direct control over the finished document.

Present Presume as a genuinely usable product through the lens of a considered design and engineering case study. Conversion is useful but secondary. The landing should give a quick product read and reward a deeper design/engineering read.

## Authority Boundary

You may challenge the landing's current hero, copy, sequence, interactions, assets, visual language, and brand expression.

Protect these surfaces:

- The editor route and interaction model.
- Resume geometry, editing, persistence, and export behavior.
- Most Fit and Review dashboard behavior and presentation.

You may capture or lightly frame Fit and Review on the landing when they prove a claim. Do not redesign them. Treat `PRODUCT.md` as truth for implemented behavior and `DESIGN.md` as binding for protected product surfaces. A landing-only design delta is allowed when it is explicit and scoped.

**Stop before production implementation.** You may create design studies, disposable browser comps, and a landing brief. Do not modify production React, CSS, runtime assets, tests, dependencies, or product behavior under this skill.

## When to Use

Use automatically for:

- New Presume landing directions or redesigns.
- Changes to thesis, narrative, audience hierarchy, or section architecture.
- Major new landing sections or visual systems.
- Landing audits, visual studies, and implementation handoffs.

Do not use automatically for:

- Small copy corrections or isolated visual repairs.
- Faithful implementation of an approved brief.
- Editor, resume, Fit, Review, or unrelated page work.
- Production coding with no unresolved design decision.

Explicit invocation may force use for any Presume landing task.

## Resolve the Run Profile

At the start of substantial work, infer missing values, state the resolved profile briefly, and proceed. Ask one focused question only when a missing choice would materially change the direction. Natural-language requests override defaults.

| Field | Options | Major-redesign default |
|---|---|---|
| Audit | `blank-slate`, `concise`, `forensic` | `concise` |
| Sequence | `conventional`, `narrative`, `hybrid` | `hybrid` |
| Directions | `1`, `2`, `3` | `2` |
| Voice | `product`, `hybrid`, `authored`, `custom` | `hybrid` |
| References | `none`, `provided`, `curated`, `visual-study` | `curated` |
| Visual preset | `source-default`, `prior-approved`, `custom` | `source-default` |
| Workflow depth | `rapid`, `standard`, `full` | `full` |
| Fidelity | `direction-only`, `wireframe`, `visual-study`, `full-page-design` | `full-page-design` |
| Artifact | `structure`, `visual-study`, `browser-comp`, `hybrid` | `hybrid` |
| Quality | `exploration`, `handoff` | `exploration`, then `handoff` after approval |

Do not make the user fill out the table. Resolve it from their prompt.

## Start with the Mission, Not the Sections

Define:

```text
Shared thesis:
Primary reader:
Primary read:
Second reader:
Second read:
Desired final impression:
Secondary action:
```

A section must serve the primary narrative, supporting proof, or deep evidence. A deeper read may enrich the quick read but must not interrupt it.

## Audit Modes

### Blank-slate

Read `PRODUCT.md` and protected-surface constraints, but do not inherit the current landing composition. Evaluate old work only after a direction exists.

### Concise

Inspect:

1. `PRODUCT.md`
2. `DESIGN.md`
3. `src/components/LandingPage.tsx`
4. Landing styles, assets, and relevant tests
5. Only the highest-value landing history

Return:

- What the page communicates now.
- What feels distinctive.
- What dilutes the thesis.
- What deserves preservation.
- What should be reconsidered.
- What remains unknown.

### Forensic

Also inspect prior alternatives, visual studies, commits, specifications, responsive contracts, and assets in depth.

For concise and forensic audits, assign every major current element one treatment:

| Treatment | Meaning |
|---|---|
| Keep | Already advances the selected thesis |
| Reframe | Useful material with the wrong narrative role |
| Recompose | Strong ingredients needing a different presentation |
| Replace | Necessary idea, unsuitable execution |
| Remove | Does not earn its place |

Judge against the selected narrative, not previous effort or approval. In blank-slate mode, defer this inventory until after ideation.

## Choose the Narrative Sequence

Give conventional landing sequencing a fair evaluation without forcing it.

- **Conventional:** hero → problem/solution → benefits → process → proof → objections → final action.
- **Narrative:** thesis → tension → demonstration → evidence → resolution.
- **Hybrid:** test the conventional sequence, then preserve or break it wherever the product case study becomes stronger.

FAQ, testimonials, risk reversal, workflow, provenance, and final CTA are optional. Include each only when it advances the selected argument.

For every direction, state:

- Core argument.
- Intended emotional impression.
- Primary and second reads.
- Hero concept.
- Narrative progression.
- Primary proof device.
- Role of the live product.
- Visual/material idea.
- Purpose of motion, if any.
- Current material kept, reframed, recomposed, replaced, or removed.
- Main trade-off or risk.

Directions must be different stories, not one wireframe in different colors.

## Write as Thesis, Claim, Evidence, Interpretation, Invitation

Voice is configurable. Before drafting the entire page, show a representative sample—normally the hero and one evidence section—and confirm the register.

Use this copy architecture:

1. **Thesis** — the belief Presume embodies.
2. **Claim** — what differs in the product.
3. **Evidence** — where the page demonstrates it.
4. **Interpretation** — why the decision matters.
5. **Invitation** — what the visitor can inspect or do next.

Reject vague benefits, AI clichés, decorative technical language, fake precision, and unsupported claims. Punctuation, sentence length, and headline form are adjustable; do not impose arbitrary copy bans.

## Evidence Policy

Product claims must match real behavior. Clearly labeled sample resumes, example Review results, and other illustrative material are allowed. Testimonials, user counts, customer logos, awards, outcomes, comparisons, and other external validation must be genuine.

Prefer evidence in this order:

1. Working product behavior.
2. Concrete artifacts: editor, resume, export, Fit response, or Review evidence.
3. Inspectable design and engineering reasoning.
4. Verifiable technical provenance.
5. Genuine external validation.

Do not invent traction, users, testimonials, brands, outcomes, or pseudo-precise metrics. If proof is absent, narrow the claim.

## Source-Default Visual Preset

The upstream visual system is the first-pass preset when `source-default` is selected. Apply it to the landing only:

### Typography

- Use one sans-serif family: Geist, Manrope, or Poppins. Use monospace only for functional data.
- Avoid italics and ultra-bold weights by default.
- Resolve type to Tailwind's default scale rather than arbitrary sizes.
- Balance headings, pretty-wrap body copy, and cap readable prose near 65 characters.
- Keep hero heading and subheading near a 680px maximum measure with meaningful breaks.

### Spacing and geometry

- Use only 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, and 96px spacing values.
- Use Tailwind radius values.
- When nested shapes have less than 32px between their edges, use `inner radius = outer radius - gap` when the result exceeds 2px.
- Use full borders or no border on card-like surfaces; do not use a single border side as decoration.

### Color and material

- Use flat backgrounds; no background gradients.
- Limit the palette to one purposeful accent.
- In the hero only, a left-to-right heading gradient may move from full text color to muted text color.
- Do not use glow-heavy effects or decorative glass throughout the page.

### Hero and navigation

- Start with an asymmetric or deliberately structured hero, real draft copy, one primary action, and meaningful product evidence.
- The source preset proposes a detached fluid-island navigation: compact pill geometry, controlled translucency, morphing menu control, and staggered overlay reveal.
- The source preset proposes a separate two-line tagline moment whose words reveal in reading order as they enter the viewport.

### Icons and motion

- Use one icon family: Phosphor, Solar, or Iconamoon.
- Use physics-informed custom easing; do not rely on generic default transitions.
- Animate transform and opacity, not layout properties.
- Use IntersectionObserver, CSS scroll-driven animation, or another efficient trigger; never an unthrottled scroll handler.
- Motion must communicate hierarchy, causality, feedback, or state—not merely decoration.
- Design a reduced-motion alternative for every automatic or scroll-driven effect.

### Content and states

- Use real draft content, not lorem ipsum or generic placeholder brands.
- Specify hover, active, focus, loading, empty, and error intent only where the proposed interaction needs those states.
- Do not show dead links or decorative controls as if they work.

These are adjustable defaults, not laws. A coherent direction may omit a preset motif, but disclose the omission.

## Override Loop

After every visual pass:

1. List the source-default prescriptions applied.
2. Identify which prescriptions materially shaped the result.
3. Offer focused adjustment categories: typography, spacing, radius, palette, hero, navigation, motion, and section treatment.
4. Record accepted changes in the decision ledger.
5. Carry them forward. Never silently reset to source defaults.

If the landing departs from `DESIGN.md`, document:

```text
Existing rule:
Landing-only deviation:
Narrative reason:
Scope boundary:
Risk:
Reversion path:
```

The landing may be visually independent, but explain the conceptual or brand bridge into the protected editor.

## Reference-Led Exploration

Use the selected mode:

- `none`: work from the thesis and constraints.
- `provided`: analyze only supplied references.
- `curated`: gather a small relevant set.
- `visual-study`: create comparative studies before deciding.

For each reference, extract:

```text
What works:
Why it works:
What applies to Presume:
What does not apply:
Imitation or mismatch risk:
```

Borrow principles, not another site's surface identity. Disclose the references that materially influenced the direction.

## Recommended Passes, Not Ceremony

For major work, recommend:

1. Direction.
2. Visual language.
3. Whole-page composition.
4. Design refinement.
5. Implementation handoff.

You may combine or skip passes. State the compressed workflow before proceeding so the user can correct an overly fast process.

## Artifact Modes

- **Structure:** annotated narrative map or wireframe.
- **Visual-study:** high-fidelity static studies for composition and visual language.
- **Browser-comp:** disposable HTML/CSS for real copy, scrolling, breakpoints, and basic motion.
- **Hybrid:** visual studies followed by a disposable browser comp. Default for major redesigns.

For each artifact, state:

- What it validates.
- Which details are authoritative.
- Which details remain illustrative.
- What is unresolved.
- Whether study code is disposable.

Keep studies outside production source directories. Never silently promote study code into shipping code. A simulated interaction is not product evidence.

## Quality Tiers

### Exploration quality

Show enough desktop and narrow behavior to judge the direction. Identify material accessibility, content, feasibility, and performance risks without specifying every state.

### Handoff quality

Before labeling a design implementation-ready, specify:

- Desktop and narrow composition, content order, and responsive transformations.
- Keyboard, focus, contrast, semantics, and reduced-motion intent.
- Real content, images, attribution, and example-labeling requirements.
- Relevant interaction states.
- Performance and feasibility risks.
- SEO/AEO, title, description, social preview, favicon, legal links, 404, and navigation decisions when in scope.

A visual comp is not proof of accessibility, responsiveness, or performance.

## Decision Ledger

After each meaningful pass, record:

```text
Keep:
Change:
Reject:
Open:
```

Keep this conversational during exploration. When a direction is likely to ship, persist the resolved profile, approved decisions, and implementation handoff in `docs/landing/PRESUME_LANDING_BRIEF.md`.

## Required Implementation Handoff

Stop before production coding. Provide:

1. Approved thesis, readers, narrative, section order, and final copy.
2. Applied visual preset and all accepted overrides.
3. Whole-page desktop and narrow compositions.
4. Section specifications: purpose, evidence, content, layout, assets, responsive behavior, and states.
5. Existing-element treatment inventory.
6. Product claim and example-labeling matrix.
7. Motion and reduced-motion descriptions.
8. Protected surfaces and allowed implementation scope.
9. Accessibility, responsive, performance, content, and SEO risks.
10. Acceptance criteria for comparing implementation with the approved design.

Faithful implementation uses the repository's frontend implementation workflow. If implementation reveals a genuinely unresolved design problem, return to this skill instead of silently inventing a new direction.

## Common Failure Modes

| Failure | Correction |
|---|---|
| Generic SaaS sequence by reflex | Re-anchor on the shared thesis and two-depth read |
| Case-study prose obscures the product | Pair every interpretation with working evidence |
| Every old section survives | Apply explicit treatment against the selected narrative |
| Visual preset becomes dogma | Disclose it, invite targeted overrides, persist decisions |
| Beautiful sections make an incoherent page | Review whole-page rhythm before handoff |
| Fake social proof fills an evidence gap | Narrow the claim or use labeled examples |
| Design work leaks into editor redesign | Stop at the protected-surface boundary |
| Browser study becomes production code | Label it disposable and hand off independently |
| Implementation agent becomes the designer | Return unresolved direction questions to this skill |
