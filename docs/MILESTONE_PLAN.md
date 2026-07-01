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

Status: Next.

Scope:

- Add review panel UI.
- Add review annotation rendering.
- Keep formatting warnings visually distinct from review annotations.
- Keep findings advisory and non-destructive.

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 5.

### Milestone 7: Review Service

Status: Planned.

Scope:

- Add the planned FastAPI review service.
- Wrap HackerRank Hiring Agent behind a Presume-owned API.
- Add normalized schemas, errors, configuration, and tests.
- Default to local Ollama and keep hosted providers opt-in.

Supporting detail:

- See `docs/REVIEW_SERVICE.md`.
- See `docs/IMPLEMENTATION_PLAN.md`, Phase 6.

### Milestone 8: Integration Tests And Documentation

Status: Planned.

Scope:

- Add integration-oriented frontend and backend tests.
- Verify the editor still works without review configuration.
- Keep documentation accurate about shipped versus planned behavior.

Supporting detail:

- See `docs/IMPLEMENTATION_PLAN.md`, Phase 7.
