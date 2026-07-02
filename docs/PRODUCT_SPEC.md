# Product Spec

## Product Vision

Presume helps job seekers maintain a resume that is both visually controlled and easier to improve. The resume remains the primary interface: users edit the finished document directly, keep formatting constraints visible, and review advisory feedback without surrendering control of the content.

The product has two separate loops:

- Formatting loop: deterministic browser-side fitting powered by Pretext.
- Review loop: advisory evidence display powered by a Presume-owned backend wrapper around HackerRank Hiring Agent. The UI and service scaffold exist; full Hiring Agent execution is still pending adapter wiring.

## Target Users

- Job seekers who want a precise, editable resume without manually adjusting font sizes.
- Software engineers who want a clean one-page resume workflow.
- Portfolio reviewers who want to understand the engineering choices behind the project.
- Future contributors implementing full Hiring Agent execution and integration tests.

## Goals

- Keep the rendered resume directly editable at all times.
- Preserve a clear relationship between typed resume data, on-page layout, and exported artifacts.
- Fit content according to explicit constraints: max pages, max bullet lines, and minimum font size.
- Provide portable local data through JSON export/import.
- Export a PDF that reflects the current rendered resume, including multiple Letter pages when the configured page limit allows them.
- Add review feedback as advisory evidence, not automatic rewriting.
- Keep formatting behavior independent from review behavior.

## Non-Goals

- No claim of universal ATS compatibility.
- No automatic resume rewriting in the first review phase.
- No cloud accounts or cloud persistence in the first backend phase.
- No hosted LLM dependency by default.
- No DOCX, LaTeX, or external resume import in the initial roadmap.
- No server-side PDF rendering in the current frontend-only app.

## Core Workflows

### Current Formatting Workflow

1. Open the app.
2. Edit the resume inline.
3. Adjust layout constraints if needed.
4. Let the resize engine fit the resume.
5. Shorten content manually if the app marks an impossible fit warning.
6. Export the result as PDF or JSON. PDF export uses one Letter page per Letter-height segment of the rendered resume.
7. Re-import a previously exported JSON resume when needed.

### Current Review Workflow

1. Start the local or self-hosted review service.
2. Configure the frontend with `VITE_REVIEW_API_URL`.
3. Click the review action in the editor.
4. The frontend renders the current resume page to a PDF blob.
5. The backend accepts the PDF through the normalized FastAPI review-service contract.
6. Mocked backend contract tests prove the normalized response and error shapes.
7. Integration-oriented tests cover unconfigured editor behavior, backend-shaped frontend errors, and safe backend error handling.
8. When a normalized review result is returned, the frontend displays score, evidence, strengths, improvements, bonuses, deductions, and best-effort annotations.
9. The user manually edits the resume and re-runs review when ready.

### Still-Planned Review Workflow

1. Wire `review-service/app/hiring_agent_adapter.py` to concrete HackerRank Hiring Agent internals.
2. Run extraction, scoring, optional GitHub enrichment, and LLM calls through the adapter.
3. Return a normalized review result without exposing Hiring Agent internals to the frontend.
4. Add browser-to-running-backend integration tests for the full review flow.

## Current Editor Behavior

The editor stores resume content in a typed JSON model with a name, contact items, sections, entries, and bullets. All editable content is rendered in place with `contenteditable` components.

The app currently supports:

- Editing name, contact items, sections, entries, and bullets.
- Adding and removing contact items, sections, entries, and bullets.
- Autosaving resume content and constraints to LocalStorage.
- Validating imported JSON before replacing current resume data.
- Exporting the rendered resume as a Letter-sized PDF, with additional PDF pages when the rendered canvas exceeds one page.
- Warning on content that cannot fit within the configured constraints.

## Current Review Behavior

The app currently supports:

- Review API configuration through `VITE_REVIEW_API_URL`.
- An unconfigured review state that disables review submission without breaking editing, export, import, or LocalStorage persistence.
- A disabled review state when the configured service reports review unavailable through `GET /config`.
- A review state hook that generates a PDF blob and submits it to the configured review service.
- A review panel for score, tier, category evidence, suggestions, strengths, improvements, bonuses, deductions, and findings.
- Conservative review annotations that only map inline when section, entry, and bullet text matches are exact and unambiguous.
- A FastAPI review service scaffold with safe config projection, normalized schemas, normalized errors, bounded PDF upload validation, and mocked backend contract tests.
- Review-service capability discovery that disables review when the local Hiring Agent checkout directory is unavailable, without exposing filesystem paths.
- Integration-oriented tests for the unconfigured editor path, backend-shaped frontend errors, and safe backend error handling.

Review feedback must be advisory. The first review phase must not rewrite, reorder, or delete resume content automatically.

The review output should include:

- Overall score and max score.
- Qualitative tier.
- Category scores.
- Evidence used for scoring.
- Strengths worth preserving.
- Improvements to consider.
- Bonuses and deductions.
- Annotations linked to resume content when matching is clear.

Annotations are best effort. If a review finding cannot be matched confidently to a section, entry, or bullet, it should remain visible in the review panel without an inline highlight.

Still-planned review behavior includes full end-to-end Hiring Agent execution through the backend adapter and browser-to-running-backend integration tests.

## UX Principles

- The resume is the product surface, not a preview pane.
- Formatting warnings and semantic review annotations are different concepts and should look distinct.
- Review findings should explain why they matter.
- The user decides how to revise content.
- Missing backend configuration should produce an unconfigured state, not an app failure.
- Avoid implying that a score guarantees hiring outcomes or ATS success.
