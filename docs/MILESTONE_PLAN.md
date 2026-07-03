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
