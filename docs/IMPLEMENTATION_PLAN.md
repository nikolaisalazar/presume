# Implementation Plan

This completed plan is not the milestone plan. Use [Milestone Plan](MILESTONE_PLAN.md)
to decide what milestone comes next. This file remains as historical supporting
detail for the review integration; its phase instructions are not the current
PDF implementation contract.

## Orientation Note

Current shipped functionality:

- WYSIWYG resume editing in React.
- Pretext-based fitting through `src/useResizeEngine.ts`.
- LocalStorage persistence through `src/useResume.ts` and `src/storage.ts`.
- JSON import/export and canonical client-side PDF generation through
  `src/export.ts` and `src/pdf/`.
- Review API client, review state hook, review panel, and conservative review annotations.
- FastAPI review service scaffold under `review-service/` with normalized endpoints, errors, configuration, and tests.
- Review-service capability discovery disables review when the local Hiring
  Agent checkout directory is unavailable, without exposing the configured
  path, and the frontend consumes that readiness signal before enabling review
  submission.
- The real local Hiring Agent path has been verified with the FastAPI service,
  Ollama, and a browser-generated canonical PDF; automated tests continue to
  use deterministic fixture responses.

Current and planned features must remain clearly separated in implementation, docs, and UI copy.

## Phase 1: Frontend Review Types

Create `src/reviewTypes.ts`.

Required type:

```ts
type ReviewResult = {
  id: string
  reviewedAt: string
  totalScore: number
  maxScore: number
  tier: 'strong' | 'competitive' | 'needs_work' | 'incomplete'
  categories: ReviewCategory[]
  strengths: string[]
  improvements: string[]
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
  annotations: ReviewAnnotation[]
  raw?: unknown
}
```

Also define:

```ts
type ReviewCategory = {
  key: 'open_source' | 'self_projects' | 'production' | 'technical_skills'
  label: string
  score: number
  maxScore: number
  evidence: string[]
  suggestions: string[]
}

type ReviewAdjustment = {
  label: string
  points: number
  evidence?: string
}

type ReviewAnnotation = {
  id: string
  categoryKey?: ReviewCategory['key']
  sectionTitle?: string
  entryTitle?: string
  bulletText?: string
  message: string
  severity: 'info' | 'warning' | 'strong'
}
```

Add validation helpers and tests for accepted and rejected payloads.

## Phase 2: Reusable PDF Blob Export

Update `src/export.ts`.

Add a reusable helper that renders `ResumePage` to a PDF `Blob` without triggering a download. Keep the current `exportPDF` download behavior by building it on top of the blob helper when practical.

The blob helper must use the same multi-page Letter slicing behavior as the current download exporter. Review upload must not use a single squashed page when `maxPages > 1`.

Acceptance criteria:

- Existing Export PDF button behavior remains unchanged.
- Multi-page resumes produce multi-page PDF blobs and downloads.
- Missing page elements fail with a useful error.
- PDF generation errors are surfaced to the caller.
- Tests cover error handling where feasible.

## Phase 3: Review API Client

Create `src/reviewApi.ts`.

Behavior:

- Read the API base URL from `import.meta.env.VITE_REVIEW_API_URL`.
- Treat a missing URL as an unconfigured state.
- Fetch `GET /config` to discover capabilities without exposing secrets.
- Submit `POST /reviews` as multipart form data with the generated PDF.
- Normalize successful responses into `ReviewResult`.
- Normalize documented backend errors into frontend-friendly errors.
- Do not retry automatically in the first implementation.

## Phase 4: Review Hook

Create `src/useResumeReview.ts`.

State names:

- `unconfigured`: no review API URL is available.
- `idle`: configured and ready for review.
- `loading`: review request is in flight.
- `success`: current review result matches the latest submitted resume.
- `stale`: resume has changed after the last successful review.
- `error`: the last review request failed.

Behavior:

- Accept the current `Resume` and `ResumePage` ref.
- Generate the PDF blob when review starts.
- Submit the blob through `reviewApi`.
- Store the latest `ReviewResult`.
- Mark the result stale after resume edits.
- Never mutate resume content automatically.

## Phase 5: Review UI

Create:

- `src/components/ReviewPanel.tsx`
- `src/components/ReviewAnnotations.tsx`

Update:

- `src/App.tsx`
- `src/styles/app.css`
- `src/styles/resume.css`

`ReviewPanel` should render:

- Unconfigured state.
- Idle state with a review action.
- Loading state.
- Success state with score, tier, categories, strengths, improvements, bonuses, and deductions.
- Stale state that keeps the old result visible but labels it stale.
- Error state with normalized error message.

`ReviewAnnotations` should map annotations to visible resume content when matching is clear. Matching should prefer stable structured fields:

1. Exact section title.
2. Exact entry title within the section.
3. Exact bullet text within the entry.

Fallback: when matching is ambiguous or missing, do not highlight inline content. Keep the annotation in `ReviewPanel`.

Formatting warnings and review annotations must use different visual treatments.

## Phase 6: Review Service

Create `review-service/` according to [REVIEW_SERVICE.md](REVIEW_SERVICE.md).

Minimum backend work:

- FastAPI app.
- `GET /health`.
- `GET /config`.
- `POST /reviews`.
- Environment parsing.
- Hiring Agent adapter.
- Normalized schemas and errors.
- Tests for health, config secrecy, upload validation, successful mocked review, and error mapping.

Default to Ollama. Gemini and other hosted providers must be opt-in and documented with privacy implications.

## Phase 7: Integration Tests and Documentation

Frontend:

- Add tests for review type validation.
- Add tests for review API configuration and error normalization.
- Add tests for stale-state behavior in `useResumeReview`.
- Verify editing, export, and import still work without `VITE_REVIEW_API_URL`.

Backend:

- Test documented endpoints.
- Test config does not expose secrets.
- Test documented error codes.

Docs:

- Keep README concise and public-facing.
- Keep product and architecture details in `docs/`.
- Keep `docs/MILESTONE_PLAN.md` as the authoritative milestone tracker.
- Keep this file as supporting implementation detail.

## Acceptance Criteria

- Review integration can be implemented without inventing state names, file names, endpoint names, or result shape.
- Review results never mutate resume content automatically.
- Missing review configuration disables review submission without breaking the editor.
- Current editor behavior remains usable without the backend.
- The old historical `docs/superpowers` plans are not authoritative.
