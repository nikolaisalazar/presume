# Milestone Plan

This file is the source of truth for deciding what milestone comes next.

Use `docs/IMPLEMENTATION_PLAN.md` only after a milestone has been selected. It
contains implementation details, file names, and acceptance notes for review
integration work, but it is not the milestone tracker.

## How To Use This Plan

When an agent is asked to work on the next milestone:

1. Read this file first.
2. Compare the repository state against the milestone status below.
3. Select the first milestone that is not complete.
4. Use `docs/IMPLEMENTATION_PLAN.md` only as supporting detail for the selected
   milestone.

Do not treat implementation-plan phases as replacing this milestone sequence.

## Milestones

### Milestone 1: Public Documentation Rewrite

Status: Complete.

Scope:

- Rewrite the public README.
- Add the documentation index.
- Add product, architecture, review service, and implementation planning docs.
- Remove stale historical `docs/superpowers` plans.
- Keep current shipped functionality distinct from planned review work.
- Fix the PDF export documentation so it matches the current multi-page export
  behavior.

Completion evidence:

- `README.md`
- `docs/README.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/REVIEW_SERVICE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- No `docs/superpowers` directory.

### Milestone 2: Frontend Review Contract

Status: Complete.

Scope:

- Add frontend-only review result types.
- Add `validateReviewResult` for strict shape validation.
- Strip unknown normalized fields.
- Preserve optional top-level `raw`.
- Reject non-finite numeric values.
- Keep review functionality planned, not shipped.

Completion evidence:

- `src/reviewTypes.ts`
- `src/tests/reviewTypes.test.ts`

### Milestone 3: Reusable PDF Blob Export

Status: Complete.

Scope:

- Add a reusable helper that renders the resume page to a PDF `Blob` without
  triggering a download.
- Keep the current Export PDF button behavior unchanged.
- Reuse the same multi-page Letter slicing behavior as the current PDF download
  path.
- Surface PDF generation errors to callers.
- Add focused tests for the blob helper and preserve existing exporter tests.

Completion evidence:

- `src/export.ts`
- `src/tests/export.test.ts`
- `renderResumePageToPDFBlob` shares the multi-page Letter slicing path with
  `exportPDF`.
- Existing `exportPDF` download behavior is preserved.

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 2.

Out of scope:

- Review API client.
- Review hook.
- Review panel.
- Review annotations UI.
- Review backend.
- Hiring Agent integration.

### Milestone 4: Review API Client

Status: Complete in PR #5.

Scope:

- Add a frontend API client for the planned review service.
- Read review configuration from `VITE_REVIEW_API_URL`.
- Handle unconfigured state.
- Fetch `GET /config` to discover capabilities without exposing secrets.
- Submit `POST /reviews` as multipart form data with the generated PDF.
- Normalize successful review responses through `validateReviewResult`.
- Normalize documented backend errors.
- Normalize malformed successful responses as invalid frontend responses.
- Do not retry automatically.

Completion evidence:

- `src/reviewApi.ts`
- `src/tests/reviewApi.test.ts`

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 3.

Out of scope:

- Review hook.
- Review panel.
- Review annotations UI.
- Review backend.
- Hiring Agent integration.
- End-to-end review flow.
- Resume content mutation.

Security note:

- `GET /config` is frontend-safe capability discovery only. It must not expose
  API keys, tokens, filesystem paths, raw environment values, stack traces, raw
  provider responses, or secrets of any kind.

Residual risk:

- Milestone 4 tests use mocked `fetch`; no real backend compatibility has been
  proven yet.
- End-to-end frontend/backend verification belongs to a later milestone.
- The API client accepts the configured `VITE_REVIEW_API_URL` after trimming and
  trailing-slash normalization; deployment-specific URL correctness remains a
  configuration responsibility.

### Milestone 5: Review State Hook

Status: Complete in PR #6.

Scope:

- Add frontend review state management.
- Track unconfigured, idle, loading, success, stale, and error states.
- Generate a PDF blob for review submission.
- Submit through the review API client.
- Never mutate resume content automatically.

Completion evidence:

- `src/useResumeReview.ts`
- `src/tests/useResumeReview.test.ts`

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 4.

Out of scope:

- Review panel.
- Review annotations UI.
- Review backend.
- Hiring Agent integration.
- End-to-end review flow.
- Resume content mutation.

Residual risk:

- Milestone 5 tests mock PDF generation and review API submission; no real
  backend compatibility has been proven yet.
- End-to-end review flow remains planned for a later milestone.
- Review UI and annotation rendering remain out of scope until Milestone 6.

### Milestone 6: Review UI

Status: Complete in PR #7.

Scope:

- Add review panel UI.
- Add review annotation rendering.
- Keep formatting warnings visually distinct from review annotations.
- Keep findings advisory and non-destructive.

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 5.

### Milestone 7: Review Service

Status: Complete in PR #8.

Scope:

- Add the planned FastAPI review service.
- Wrap HackerRank Hiring Agent behind a Presume-owned API.
- Add normalized schemas, errors, configuration, and tests.
- Default to local Ollama and keep hosted providers opt-in.

Supporting detail:

- See `docs/REVIEW_SERVICE.md`.
- See `docs/IMPLEMENTATION_PLAN.md`, Phase 6.

Completion evidence:

- `review-service/app/main.py`
- `review-service/app/config.py`
- `review-service/app/errors.py`
- `review-service/app/schemas.py`
- `review-service/app/hiring_agent_adapter.py`
- `review-service/tests/test_health.py`
- `review-service/tests/test_review_contract.py`
- `review-service/README.md`

Residual risk:

- Full Hiring Agent execution still requires `vendor/hiring-agent` and concrete
  upstream API wiring inside the adapter.
- Backend success tests use a mocked adapter.

### Milestone 8: Integration Tests And Documentation

Status: Complete.

Scope:

- Add integration-oriented frontend and backend tests.
- Verify the editor still works without review configuration.
- Keep documentation accurate about shipped versus planned behavior.

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 7.

Completion evidence:

- `src/tests/appIntegration.test.tsx`
- `src/tests/reviewApi.test.ts`
- `review-service/tests/test_review_contract.py`
- Documentation updates in `README.md`, `docs/ARCHITECTURE.md`,
  `docs/PRODUCT_SPEC.md`, `docs/REVIEW_SERVICE.md`, and
  `review-service/README.md`.

Residual risk:

- Full browser-to-running-backend review flow remains planned.

### Milestone 9: Hiring Agent Adapter Readiness

Status: Complete.

Scope:

- Confirm that this checkout does not include `vendor/hiring-agent`.
- Keep full Hiring Agent execution deferred until a concrete upstream checkout
  and Python API are available.
- Make review-service capability discovery reflect local adapter readiness
  without exposing the configured Hiring Agent path.
- Make the frontend consume review-service readiness and disable review
  submission when the configured service reports review unavailable.
- Resolve relative `HIRING_AGENT_PATH` values from the repository root and
  require a checkout directory for dependency readiness.
- Keep hosted providers opt-in.
- Preserve normalized, secret-free review errors.
- Keep review feedback advisory and non-mutating.

Supporting detail:

- See `docs/REVIEW_SERVICE.md`.
- See `docs/IMPLEMENTATION_PLAN.md`, Phase 6.

Completion evidence:

- `review-service/app/config.py`
- `review-service/app/hiring_agent_adapter.py`
- `review-service/tests/test_health.py`
- `src/useResumeReview.ts`
- `src/components/ReviewPanel.tsx`
- `src/tests/useResumeReview.test.ts`
- `src/tests/reviewUi.test.tsx`
- Documentation updates in `README.md`, `docs/README.md`,
  `docs/ARCHITECTURE.md`, `docs/PRODUCT_SPEC.md`,
  `docs/REVIEW_SERVICE.md`, and `review-service/README.md`.

Residual risk:

- Full Hiring Agent execution still requires `vendor/hiring-agent` and concrete
  upstream API wiring inside `review-service/app/hiring_agent_adapter.py`.
- Full browser-to-running-backend review flow remains deferred until a real
  adapter path or controlled mocked integration target exists.

### Milestone 10: Real Hiring Agent Adapter Spike

Status: Complete.

Priority:

- Do this before broad UI polish. The review integration is the largest
  unresolved product risk, and the UI should be polished around real Hiring
  Agent output rather than mocked fixtures.

Goal:

- Wire `review-service/app/hiring_agent_adapter.py` to a local
  `vendor/hiring-agent` checkout enough to produce one real normalized
  `ReviewResult` from one uploaded PDF.
- Keep the Presume-owned API contract stable even if upstream Hiring Agent
  internals are unstable.

Scope:

- Add or document the local dependency setup path for HackerRank Hiring Agent.
- Inspect upstream Hiring Agent entrypoints and choose the smallest viable
  adapter strategy:
  - Python library integration, preferred if the upstream API is stable enough.
  - Subprocess execution, acceptable if upstream internals are unstable.
- Implement the adapter path that converts one real Hiring Agent review into
  Presume's normalized `ReviewResult`.
- Preserve normalized safe error handling.
- Keep all Hiring Agent imports, subprocess calls, path handling, and provider
  details inside `review-service/app/hiring_agent_adapter.py`.

Files likely to change:

- `review-service/app/hiring_agent_adapter.py`
- `review-service/app/config.py` if new config is needed.
- `review-service/app/schemas.py` only for additive schema fields that real
  output proves necessary.
- `review-service/tests/test_review_contract.py`
- New backend adapter tests as needed.
- `review-service/README.md`
- `docs/REVIEW_SERVICE.md`
- This milestone plan.

Public interface constraints:

- Keep `POST /reviews` as multipart form data with the required `file` PDF
  field.
- Keep the normalized `ReviewResult` response shape expected by
  `src/reviewTypes.ts`.
- Avoid frontend contract changes unless real Hiring Agent output proves the
  current contract insufficient.

Allowed additive config field:

- `hiringAgentMode?: "library" | "subprocess" | "unavailable"` may be added to
  `GET /config` only if it materially improves debugging without exposing
  filesystem paths, secrets, stack traces, or arbitrary upstream values.

Security and privacy constraints:

- Do not expose API keys, tokens, local filesystem paths, provider prompts,
  provider responses, stack traces, raw resume text, or arbitrary adapter
  exception text through public API responses.
- Do not log raw PDFs, extracted resume text, provider prompts, or full raw
  review responses by default.
- Hosted LLM providers remain opt-in. Local Ollama remains the default path.

Tests:

- Adapter reports unavailable or normalized failure when `vendor/hiring-agent`
  is missing.
- Adapter maps a real or fixture-like Hiring Agent success into `ReviewResult`.
- Adapter maps upstream execution failure to `hiring_agent_failed`.
- Adapter maps timeout to `review_timeout`.
- `/config` still hides filesystem paths and secrets.
- `/reviews` still rejects invalid uploads before invoking Hiring Agent.
- Existing frontend and backend tests continue to pass.

Acceptance criteria:

- With `vendor/hiring-agent` present and provider configuration valid,
  `/config` reports review as enabled.
- Posting a valid PDF to `/reviews` returns a normalized `ReviewResult`.
- The frontend validator accepts the returned result without schema changes.
- Existing backend contract tests still pass.
- Public errors remain fixed, safe, normalized templates.

Residual risk:

- Upstream Hiring Agent does not expose a packaged, stable import API. The
  adapter uses a subprocess bridge that runs inside the local checkout and calls
  `score.main`, then normalizes the returned Pydantic evaluation.
- This workspace did not include `vendor/hiring-agent`, so the real Ollama PDF
  execution path was not manually exercised here. The adapter is covered with a
  fixture-like fake checkout that proves subprocess execution, normalization,
  GitHub enrichment gating, ambient secret stripping, upstream failure mapping,
  and timeout mapping.
- Full browser-to-running-backend review flow remains deferred to Milestone 11.

Completion evidence:

- `review-service/app/hiring_agent_adapter.py`
- `review-service/tests/test_hiring_agent_adapter.py`
- `review-service/README.md`
- `docs/REVIEW_SERVICE.md`
- Backend verification: `python3 -m pytest review-service/tests -q`
- Frontend verification: `npm test -- --run`
- Build verification: `npm run build`

### Milestone 11: Browser-To-Backend Review Flow

Status: Complete with residual risk.

Goal:

- Verify that the actual frontend can submit a rendered resume PDF to the
  running backend and display the returned review result.

Scope:

- Run the FastAPI review service with valid Hiring Agent and provider config.
- Run the frontend with `VITE_REVIEW_API_URL=http://127.0.0.1:8000`.
- Submit the default resume through the UI.
- Fix any CORS, contract, upload, validation, or state bugs exposed by the real
  browser-to-backend flow.
- Document exact local run commands.

Files likely to change:

- `src/reviewApi.ts` if contract bugs appear.
- `src/useResumeReview.ts` if state behavior needs adjustment.
- `src/components/ReviewPanel.tsx` if real output exposes rendering gaps.
- `review-service/app/main.py` if CORS or response behavior needs adjustment.
- `README.md`, `review-service/README.md`, and docs as needed.
- This milestone plan.

Tests and verification:

- Manual E2E script:
  1. Start backend.
  2. Start frontend with `VITE_REVIEW_API_URL`.
  3. Click "Review resume".
  4. Confirm loading, success, stale-after-edit, and error states.
- Add a realistic frontend review fixture captured from the backend adapter.
- Add automated browser testing only if the project intentionally adopts a
  browser test runner; otherwise document manual verification clearly.

Acceptance criteria:

- A user can run both services locally and submit the default resume for review.
- The review panel displays real score, categories, strengths, improvements,
  bonuses, deductions, and annotations when present.
- Editing after a successful review marks the result stale.
- Backend unavailable and review-disabled states remain understandable.
- Docs include exact run commands and common failure modes.

Completion evidence:

- `review-service/app/config.py` now allows both default Vite loopback origins:
  `http://localhost:5173` and `http://127.0.0.1:5173`.
- `review-service/app/config.py` now defaults `MAX_UPLOAD_BYTES` to 25 MiB
  because the browser-rendered default resume PDF exceeded the prior 10 MiB
  service limit during real UI submission. Upload memory remains bounded per
  request by `MAX_UPLOAD_BYTES`, but concurrent uploads can multiply service
  memory use.
- `review-service/tests/test_health.py` covers default loopback CORS preflight
  behavior, rejection of unconfigured default origins, and the default browser
  review upload limit.
- Manual browser verification on July 3, 2026:
  - Backend:
    `HIRING_AGENT_PATH=/tmp/presume-fake-hiring-agent LLM_PROVIDER=ollama DEFAULT_MODEL=gemma3:4b uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - Frontend:
    `VITE_REVIEW_API_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1`
  - URL: `http://127.0.0.1:5173/presume/`
  - Observed `GET /config` returned review enabled.
  - Clicking `Review resume` generated the default resume PDF, posted it to
    `/reviews`, received HTTP 200, and rendered normalized score `69 / 100`,
    all four categories, strengths, improvements, bonus, and deduction in the
    review panel.
  - Editing the resume after success displayed `Review is stale` while keeping
    the prior result visible.
  - Running the backend with a missing `HIRING_AGENT_PATH` rendered the
    configured-service-disabled state.
  - Stopping the backend rendered the backend-unavailable/config-error state.
- Documentation updates:
  - `README.md`
  - `docs/REVIEW_SERVICE.md`
  - `review-service/README.md`

Residual risk:

- This workspace did not have `ollama` installed, so the real default
  Ollama-backed Hiring Agent PDF execution path was not verified.
- `vendor/hiring-agent` was not present in the repository. A temporary checkout
  under `/tmp` confirmed the upstream project is reachable without dirtying the
  repo, and a controlled temporary adapter target was used for browser flow
  verification.
- No frontend fixture captured from a real Ollama-backed Hiring Agent review was
  added because that real review did not run successfully in this workspace.
- Deployments that expose the review service beyond local development should add
  appropriate process, proxy, rate, or concurrency limits for concurrent upload
  memory.

### Milestone 12: Review UX Polish Using Real Data

Status: Complete with residual risk.

Goal:

- Improve the review experience based on actual Hiring Agent output, latency,
  evidence length, category shape, and annotation quality.

Scope:

- Improve review result hierarchy for scanning.
- Group evidence and suggestions by category.
- Add or refine stale-result affordances.
- Improve unavailable, disabled, config-error, and request-error messaging.
- Add a review annotation legend if annotations are useful in real output.
- Improve long-string wrapping and empty-result states.
- Keep formatting warnings visually distinct from review annotations.

Files likely to change:

- `src/components/ReviewPanel.tsx`
- `src/components/ReviewAnnotations.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`
- `src/tests/reviewUi.test.tsx`

UX constraints:

- Keep review advisory.
- Do not present the score as guaranteed ATS truth.
- Do not automatically rewrite resume content.
- Keep the resume document as the primary surface.

Tests:

- Long category evidence renders without layout breakage.
- Empty categories, strengths, improvements, bonuses, deductions, and
  annotations render cleanly.
- Stale result keeps the previous review visible.
- Error state can preserve previous stale result.
- Multiple annotations on one target are understandable.
- Ambiguous annotations remain in the panel and are not rendered inline.

Acceptance criteria:

- Real Hiring Agent output is readable without overwhelming the user.
- Review panel remains usable on desktop and narrow viewports.
- Annotation markers are understandable and accessible.
- No review panel text overlaps or unreadable controls are introduced.

Completion evidence:

- `src/components/ReviewPanel.tsx` now renders an advisory score note, grouped
  category evidence and suggestions, explicit stale and preserved-result error
  states, clean empty-detail output, an annotation legend when findings exist,
  and finding cards with severity and target context.
- `src/components/ReviewAnnotations.tsx` now collapses multiple inline notes on
  the same target into one accessible count marker.
- `src/styles/app.css` and `src/styles/resume.css` add wrapping and visual
  treatment for long review evidence, suggestions, findings, legends, stale
  states, and multi-note markers while keeping formatting warnings visually
  distinct.
- `src/tests/reviewUi.test.tsx` covers grouped category detail, clean empty
  results, stale result copy, preserved stale results after request errors,
  annotation legends, ambiguous findings that remain in the panel, and multiple
  annotations on one inline target.
- `src/tests/responsiveLayout.test.ts` covers the responsive CSS contract that
  lets the fixed-width resume overflow independently from the narrow review
  panel.
- Manual browser verification on July 3, 2026 used a controlled local
  Hiring-Agent-shaped fixture response, not real Ollama-backed execution:
  - Fixture backend:
    `node - <<'NODE' ... NODE` listening on `http://127.0.0.1:8123` with
    `GET /config` and `POST /reviews`.
  - Frontend:
    `VITE_REVIEW_API_URL=http://127.0.0.1:8123 npm run dev -- --host 127.0.0.1 --port 5173`
  - Vite URL used by the browser:
    `http://127.0.0.1:5174/presume/` because port `5173` was occupied.
  - Viewports: `358x980` narrow preview and `1280x900` desktop preview.
  - Observed score `69 / 100`, all four categories, long evidence wrapping,
    strengths, improvements, bonus, deduction, annotation legend, matched and
    unmatched findings, and stale-after-edit copy with previous results
    preserved.
- Follow-up narrow-overflow verification on July 3, 2026 used the same
  controlled fixture class with long evidence, long suggestions, empty category
  evidence/suggestions, matched annotations, unmatched annotations, bonuses,
  and deductions:
  - Before the responsive fix at `358x980`: `bodyClientWidth: 358`,
    `bodyScrollWidth: 832`, `workspaceClientWidth: 326`,
    `workspaceScrollWidth: 816`, `resumeWidth: 816`, and `panelWidth: 816`.
  - After the responsive fix at `358x980`: review panel measured
    `panelLeft: 16`, `panelRight: 342`, `panelWidth: 326`,
    `panelClientWidth: 324`, `panelScrollWidth: 324`, and no review-panel
    descendants reported horizontal overflow. The fixed resume canvas still
    overflowed independently as expected.
  - Desktop `1280x900` remained a sticky right rail with `panelWidth: 360` and
    no review-panel descendants reporting horizontal overflow.
  - Matched annotations rendered inline with an accessible multi-note label,
    unmatched annotations stayed in the panel, and editing after a successful
    review showed stale copy while preserving the prior result.

Verification:

- Backend verification: `python3 -m pytest review-service/tests -q`
- Frontend verification: `npm test -- --run`
- Build verification: `npm run build`

Residual risk:

- Real Ollama-backed Hiring Agent PDF execution still has not been verified in
  this workspace because it requires a local `vendor/hiring-agent` checkout,
  `ollama`, the selected model, and a valid PDF posted through `/reviews`.
- Milestone 12 browser verification used a controlled Hiring-Agent-shaped
  fixture response to exercise realistic result shape, length, annotation, and
  stale-state behavior through the actual frontend.

### Milestone 13: General Editor UI Polish

Status: Complete with residual risk.

Goal:

- Improve the base editor experience after the real review flow is proven.

Scope:

- App shell layout.
- Toolbar ergonomics.
- Settings panel polish.
- Add/remove control behavior.
- Narrow viewport handling for the fixed-width resume canvas.
- Visual hierarchy between editor, toolbar, and review panel.

Observed issues to consider:

- The 816px resume canvas overflows horizontally on narrow viewports. That may
  be acceptable for a fixed document editor, but the surrounding layout should
  handle it intentionally.
- Toolbar and settings are functional but plain.
- Add/remove controls are highly visible and make the resume look less like a
  finished document.
- The app has no top-level brand/header or persistent status area explaining
  current review/config state.

Files likely to change:

- `src/App.tsx`
- `src/components/Toolbar.tsx`
- `src/components/SettingsPanel.tsx`
- `src/components/ResumePage.tsx`
- `src/components/Section.tsx`
- `src/components/Entry.tsx`
- `src/components/Bullet.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`
- UI tests as needed.

Acceptance criteria:

- The resume remains visually printable and document-like.
- Controls are discoverable but do not dominate the resume.
- Narrow viewport behavior is intentional.
- Export, import, reset, constraints, and review actions remain obvious.
- Existing frontend tests and production build still pass.

Completion evidence:

- `src/App.tsx` now has a top-level app header, a dedicated editor panel, and a
  fixed-width resume canvas inside an intentional horizontal-scroll container.
- `src/components/Toolbar.tsx` groups document actions in an accessible toolbar
  while keeping export, import, and reset workflows available.
- `src/components/SettingsPanel.tsx` shows a compact constraints summary while
  collapsed and keeps the existing editable numeric controls when expanded.
- `src/styles/app.css` keeps toolbar and settings inside the viewport, preserves
  the Milestone 12 review-panel responsive rules, and makes only the fixed
  816px resume canvas horizontally scroll on narrow viewports.
- `src/styles/app.css` also softens add/remove controls at rest while keeping
  them visible on hover and keyboard focus.
- `src/tests/appIntegration.test.tsx` covers the editor shell, grouped document
  actions, and collapsed constraint summary.
- `src/tests/responsiveLayout.test.ts` covers the fixed-canvas scroll contract
  and the lower-contrast but discoverable edit-control styling.
- PR review follow-up found two issues in the initial Milestone 13 polish:
  exported/printed resume captures could include faint editor-only controls, and
  the collapsed constraints summary hid its current values from assistive
  technology by exposing only `Current constraints`.
- `src/export.ts` now hides `.add-btn`, `.remove-btn`, and
  `[data-editor-only="true"]` descendants only during the `html2canvas` capture
  window and restores their previous inline visibility afterward, including
  failed capture paths.
- `src/styles/app.css` now hides the same editor-only controls for print output.
- `src/components/SettingsPanel.tsx` now lets the visible collapsed constraint
  values contribute to the settings toggle accessible name.
- `src/tests/export.test.ts` covers capture-time editor-control hiding,
  restoration after successful capture, restoration after failed capture, and
  continued capture of resume content.
- `src/tests/appIntegration.test.tsx` covers that the settings toggle exposes
  the current values accessibly while the visible collapsed summary still
  renders.
- `src/tests/responsiveLayout.test.ts` covers print hiding for editor-only
  controls while preserving the normal editor discoverability contract.
- Manual browser verification on July 3, 2026:
  - Frontend command:
    `npm run dev -- --host 127.0.0.1 --port 5173`
  - Vite URL used by the browser:
    `http://127.0.0.1:5174/presume/` because port `5173` was occupied.
  - T3 preview narrow viewport: `358x980`.
  - Narrow observed layout after the fix: `bodyClientWidth: 358`,
    `bodyScrollWidth: 358`, `workspaceWidth: 334`, `toolbarWidth: 334`,
    `settingsWidth: 334`, `reviewWidth: 326`,
    `resumeCanvasScrollClientWidth: 334`, and
    `resumeCanvasScrollScrollWidth: 816`. No app header, editor panel,
    settings, toolbar, or review panel descendants reported horizontal overflow;
    the fixed resume canvas overflowed only inside its scroll container.
  - T3 preview desktop-class viewport: `1366x1024`.
  - Desktop observed layout after the fix: `bodyClientWidth: 1366`,
    `bodyScrollWidth: 1366`, `workspaceWidth: 1192`, `editorWidth: 816`,
    `toolbarWidth: 816`, `settingsWidth: 816`, `reviewWidth: 360`, and no
    measured editor/header/settings/toolbar/review overflow.
- Follow-up manual browser verification on July 6, 2026:
  - Frontend command:
    `npm run dev -- --host 127.0.0.1 --port 5173`
  - Vite URL used by the browser: `http://127.0.0.1:5173/presume/`.
  - T3 preview narrow viewport: `358x980`.
  - Narrow observed layout after the follow-up fixes: `bodyClientWidth: 358`,
    `bodyScrollWidth: 358`, `workspaceWidth: 334`, `toolbarWidth: 334`,
    `settingsWidth: 334`, `reviewWidth: 326`,
    `resumeCanvasScrollClientWidth: 334`, and
    `resumeCanvasScrollScrollWidth: 816`. No app header, editor panel,
    settings, toolbar, or review panel descendants reported horizontal overflow;
    only the fixed resume canvas scrolled horizontally inside
    `.resume-canvas-scroll`.
  - T3 preview desktop-class viewport: `1366x1024`.
  - Desktop observed layout after the follow-up fixes:
    `bodyClientWidth: 1366`, `bodyScrollWidth: 1366`,
    `workspaceWidth: 1192`, `editorWidth: 816`, `toolbarWidth: 816`,
    `settingsWidth: 816`, `reviewWidth: 360`, and no measured
    editor/header/settings/toolbar/review overflow.
  - PDF/export verification: before clicking `Export PDF`, 41
    `.resume-page` editor controls were visible to the editor state. During the
    live export capture, a mutation observer recorded all 41 controls switching
    to `visibility: hidden`; after export, all controls were restored with
    `finalHidden: 0`.
  - Accessibility verification: the collapsed settings toggle text exposed
    `Constraints`, `1 page`, `1 lines/bullet`, and `8px min`; the
    `.settings-panel__summary` no longer had an `aria-label` masking those
    values.

Verification:

- Backend verification: `python3 -m pytest review-service/tests -q`
- Frontend verification: `npm test -- --run`
- Build verification: `npm run build`

Residual risk:

- Real Ollama-backed Hiring Agent PDF execution still has not been verified in
  this workspace because it requires a local `vendor/hiring-agent` checkout,
  `ollama`, the selected model, and a valid PDF posted through `/reviews`.
- Milestone 13 did not change the review API contract or review mutation
  behavior; review feedback remains advisory and non-mutating.

### Milestone 14: Real Ollama-Backed Hiring Agent Verification

Status: Complete.

Priority:

- Do this before additional UI, editor-model, or operational polish. The
  remaining highest-risk product claim is that Presume can run the intended
  local review path against a real Hiring Agent checkout and local Ollama model,
  not only against mocked adapters or controlled fixture targets.

Goal:

- Verify the real default review path end to end with a local
  `vendor/hiring-agent` checkout, Ollama, the selected model, the FastAPI review
  service, and a valid browser-generated Presume PDF posted through `/reviews`.

Scope:

- Install or confirm a local HackerRank Hiring Agent checkout at
  `vendor/hiring-agent`. This checkout is a local prerequisite and is not
  vendored into the Presume repository.
- Install or confirm Hiring Agent Python dependencies in
  `vendor/hiring-agent/.venv`.
- Install or confirm `ollama`, start the local Ollama service, and pull or
  confirm the documented default model, currently `gemma3:4b`.
- Start the review service with:
  - `HIRING_AGENT_PATH=../vendor/hiring-agent`
  - `LLM_PROVIDER=ollama`
  - `DEFAULT_MODEL=gemma3:4b`
- Start the frontend with `VITE_REVIEW_API_URL=http://127.0.0.1:8000`.
- Generate a Presume PDF through the actual frontend review flow and post it to
  `/reviews`.
- Verify the frontend accepts and renders the normalized result.
- If the real run exposes a defect, make only the smallest adapter, contract, or
  rendering fix required for that real verification path.
- Document exact commands, observed result shape, failure modes, and whether
  real execution succeeded.

Out of scope:

- Broad UI redesign.
- Automatic resume rewriting or mutation.
- Hosted provider work beyond preserving existing opt-in Gemini behavior.
- Resume editing data-model redesign.
- Full Playwright/Cypress adoption unless a tiny smoke harness is required to
  capture the verification cleanly.
- Claiming real Hiring Agent execution works unless the real stack is actually
  run with a valid PDF posted through `/reviews`.

Files likely to change:

- `docs/MILESTONE_PLAN.md`
- `docs/README.md`
- `docs/PRODUCT_SPEC.md`
- `docs/REVIEW_SERVICE.md`
- `README.md`
- `review-service/README.md`
- `review-service/app/hiring_agent_adapter.py`, only if real execution exposes
  an adapter bug.
- `review-service/tests/test_hiring_agent_adapter.py`, only for any adapter
  fix.
- `src/reviewTypes.ts`, only if real output proves the normalized contract is
  insufficient.
- `src/components/ReviewPanel.tsx`, only if real normalized output exposes a
  rendering bug.

Acceptance criteria:

- `GET /config` reports `reviewEnabled: true` with the real local checkout and
  Ollama configuration.
- A valid Presume PDF posted to `POST /reviews` returns HTTP 200 with a
  normalized `ReviewResult`.
- The frontend validator accepts that result.
- The review panel renders score, categories, strengths, improvements,
  bonuses, deductions, and findings when those fields are present.
- Public API responses remain secret-free and path-free.
- Review feedback remains advisory and non-mutating.
- Existing backend tests, frontend tests, and production build pass.
- Documentation clearly distinguishes verified real Ollama execution from
  fixture/manual verification.

Test and verification plan:

- `python3 -m pytest review-service/tests -q`
- `npm test -- --run`
- `npm run build`
- Manual real-stack verification:
  1. Confirm `vendor/hiring-agent` exists and has its dependencies installed.
  2. Confirm `ollama` is installed, running, and has `gemma3:4b` available.
  3. Start the review service on `127.0.0.1:8000`.
  4. Start the frontend with `VITE_REVIEW_API_URL=http://127.0.0.1:8000`.
  5. Open the app, click `Review resume`, and confirm a normalized result
     renders.
  6. Edit the resume after success and confirm the previous result becomes
     stale without mutating content.
  7. Stop or misconfigure Ollama and confirm failures map to safe normalized
     errors without exposing raw provider details.
- If the UI submission fails, also post the generated PDF directly to
  `/reviews` to isolate frontend, CORS, upload, adapter, or provider defects.

Completion evidence:

- Local setup completed on July 6, 2026:
  - `git clone https://github.com/interviewstreet/hiring-agent.git vendor/hiring-agent`
  - `/Library/Frameworks/Python.framework/Versions/3.13/bin/python3.13 -m venv .venv`
  - `.venv/bin/python -m pip install -r requirements.txt`
  - `brew install ollama`
  - `OLLAMA_FLASH_ATTENTION="1" OLLAMA_KV_CACHE_TYPE="q8_0" /opt/homebrew/opt/ollama/bin/ollama serve`
  - `/opt/homebrew/opt/ollama/bin/ollama pull gemma3:4b`
- Backend command:
  `HIRING_AGENT_PATH=../vendor/hiring-agent LLM_PROVIDER=ollama DEFAULT_MODEL=gemma3:4b uvicorn app.main:app --host 127.0.0.1 --port 8000`
- Frontend command:
  `VITE_REVIEW_API_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1`
- `GET /config` returned:
  `{"reviewEnabled":true,"llmProvider":"ollama","defaultModel":"gemma3:4b","githubEnrichmentEnabled":false,"maxUploadBytes":26214400}`
  without exposing filesystem paths, secrets, raw environment values, stack
  traces, provider responses, or raw resume contents.
- Root-cause fix: the documented `HIRING_AGENT_PATH=../vendor/hiring-agent`
  command did not match repository-root-relative path resolution, so
  `review-service/app/config.py` now preserves repository-root resolution and
  falls back to an existing current-working-directory-relative path.
- Root-cause fix: browser-generated review PDFs were raster-only and upstream
  Hiring Agent could not extract text from them. `src/export.ts` now supports a
  review-only extractable text appendix, and `src/useResumeReview.ts` enables it
  only for review submissions. The normal Export PDF button still uses the
  visual canvas path without the review text appendix. The appendix is limited
  to visible, allowlisted resume content and excludes hidden DOM, `aria-hidden`
  content, `[data-editor-only="true"]` content, and nested editor controls.
- Direct real-stack `POST /reviews` evidence:
  - Input: browser-generated Presume review PDF saved during verification,
    13,796,920 bytes.
  - Command:
    `curl -sS -w '\nHTTP_STATUS:%{http_code}\nTOTAL_TIME:%{time_total}\n' -F 'file=@/tmp/presume-review-text.pdf;type=application/pdf;filename=resume.pdf' http://127.0.0.1:8000/reviews`
  - Result: HTTP 200 in 202.292199 seconds.
  - Observed normalized result shape: total score `81 / 100`, tier
    `competitive`, four categories, three strengths, one improvement, one
    bonus, no deductions, no annotations, and `raw: {"source":"hiring-agent"}`.
  - The frontend `validateReviewResult` accepted this exact response.
- Browser verification:
  - The actual frontend submitted a review request to the real backend, and the
    backend logged `POST /reviews HTTP/1.1` with HTTP 200.
  - The same real normalized response was then served by a temporary local
    fixture endpoint to verify the review panel renders the score, categories,
    strengths, improvements, and bonus immediately without another multi-minute
    model run.
  - Editing the resume after success displayed `Review is stale` while keeping
    the previous `81 / 100` result visible.
- Safe failure verification:
  - Backend command included `OLLAMA_HOST=http://127.0.0.1:9`.
  - Posting the same generated PDF returned HTTP 502 in 0.747482 seconds with
    `{"error":{"code":"hiring_agent_failed","message":"Resume review failed.","requestId":"req_..."}}`.
  - The public failure response did not expose API keys, tokens, local paths,
    raw resume text, prompts, provider responses, stack traces, or adapter
    exception text.
- Verification commands:
  - `python3 -m pytest review-service/tests -q`
  - `npm test -- --run`
  - `npm run build`

Residual risk:

- Real local Ollama review is slow on this machine: the successful direct
  `/reviews` request took 202.292199 seconds, and a diagnostic uncached Hiring
  Agent run took roughly 270 seconds. The service timeout was raised to cover
  this measured local path, but model latency will vary by hardware and current
  Ollama load.
- The review-only PDF text appendix is intended for machine extraction, while
  the visual PDF remains canvas-rendered. Future export or review changes should
  preserve that distinction and keep the appendix restricted to content visible
  in the resume.
- Local `vendor/hiring-agent` availability varies by machine and upstream
  Hiring Agent contracts can change outside this repository.
- PDF text extraction behavior may vary by parser. The review-only appendix is
  designed to make the submitted text explicit for Hiring Agent, but future
  parser changes should be rechecked with real-stack smoke tests.
- GitHub enrichment remains optional and token/rate-limit dependent.
- The verified real Hiring Agent result did not include deductions or
  annotations. Existing frontend tests still cover rendering those fields when
  present, but this real run did not exercise non-empty findings.
- Broader deployment hardening, concurrency controls, and repeatable browser
  automation remain later milestones.

### Milestone 15: Browser And E2E Automation For Review And Export Contracts

Status: Complete.

Goal:

- Convert the most important manual browser checks into repeatable automation
  after the real review path is understood.

Scope:

- Add Playwright as the browser test runner.
- Cover unconfigured review behavior, configured fixture-backed review success,
  stale-after-edit behavior, disabled-service behavior, backend-unavailable
  behavior, fixed-canvas narrow scrolling, review-panel no-overflow behavior,
  and normal PDF export triggering.
- Keep real Ollama execution as documented/manual verification because the
  local environment setup and review latency are machine-dependent.

Completion evidence:

- `package.json` now provides `npm run test:e2e`, with separate unconfigured
  and configured-review Playwright runs so Vite can build the app with the
  correct `VITE_REVIEW_API_URL` state for each browser contract group.
- `playwright.config.ts`, `playwright.unconfigured.config.ts`, and
  `playwright.configured.config.ts` run the built Vite app in Chromium via
  `vite preview`.
- `e2e/unconfigured.spec.ts` verifies that the app loads in a real browser, the
  resume page renders nonblank, normal `Export PDF` triggers a `resume.pdf`
  download, editing still works afterward, review submission stays disabled
  when unconfigured, and the narrow viewport keeps page-level horizontal
  overflow absent while `.resume-canvas-scroll` owns the fixed `816px` resume
  canvas overflow.
- `e2e/configured-review.spec.ts` uses Playwright route interception for
  `GET /config` and `POST /reviews` to verify disabled-service state,
  backend-unavailable/config-error state, multipart review submission with the
  required PDF `file` field, normalized fixture result rendering, and
  stale-after-edit behavior with prior results preserved.
- The automated browser tests do not require real Ollama, `vendor/hiring-agent`,
  hosted-provider credentials, or third-party network access.
- Documentation updates record the new command, covered contracts, manual
  boundaries, and why real Ollama-backed review is not part of automated E2E by
  default.

Verification:

- Backend verification: `python3 -m pytest review-service/tests -q`
- Frontend verification: `npm test -- --run`
- Build verification: `npm run build`
- Browser/E2E verification: `npm run test:e2e`

Residual risk:

- Browser automation uses controlled route-intercepted review responses. It
  protects frontend review/export contracts, but it does not prove live CORS,
  live backend process management, or real Hiring Agent execution.
- Real Ollama-backed review remains manual/local verification because it
  requires a local `vendor/hiring-agent` checkout, Hiring Agent `.venv`, running
  Ollama, a pulled model such as `gemma3:4b`, and multi-minute
  machine-dependent latency.

### Milestone 16: Review-Service Operational Hardening

Status: Planned.

Goal:

- Make the review service safer and easier to run beyond a single local
  developer happy path.

Scope:

- Improve startup/readiness diagnostics without exposing secrets or paths.
- Revisit timeout and upload-size configuration based on real Milestone 14
  latency and PDF size.
- Document or add process, proxy, rate, and concurrency controls for deployments
  beyond local development.
- Preserve local Ollama as the default and hosted providers as opt-in.

Dependency:

- Follows Milestone 14 and benefits from Milestone 15 so operational changes are
  based on measured real behavior and protected by browser/service regression
  coverage.

### Milestone 17: Resume Editing Model Improvements

Status: Planned.

Goal:

- Improve the resume editing model only after the review loop is proven and
  protected by stronger test coverage.

Scope:

- Revisit structured fields, section/entry operations, import/export
  compatibility, and any migration strategy needed for richer editing.
- Keep the resume directly editable and preserve JSON portability.
- Keep review feedback advisory and non-mutating.

Dependency:

- Follows Milestones 14 and 15 so editor model changes do not obscure unresolved
  review integration or browser/export contract issues.
