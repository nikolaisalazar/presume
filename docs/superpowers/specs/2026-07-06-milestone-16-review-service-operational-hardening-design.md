# Milestone 16 Review-Service Operational Hardening Design

## Context

Milestone 14 proved the real local review path can work with `vendor/hiring-agent`, Ollama, `gemma3:4b`, and a browser-generated Presume review PDF, but it also showed real reviews can take several minutes and PDFs can be large. Milestone 15 added deterministic Playwright coverage for review and export browser contracts. Milestone 16 should improve operational safety and clarity without expanding product scope or changing the core review API contract.

## Goals

- Keep local Ollama as the default review path and hosted providers opt-in.
- Preserve `POST /reviews` as multipart form data with required PDF field `file`.
- Preserve safe, fixed, secret-free public errors.
- Keep `GET /config` limited to safe capability and readiness information.
- Make upload-size and timeout configuration clearer and safer.
- Document responsible deployment controls for non-local use.
- Keep automated tests deterministic and independent of real Ollama, `vendor/hiring-agent`, hosted credentials, and network access.

## Non-Goals

- No authentication, database, queue, worker system, dashboard, or review UX redesign.
- No hosted-provider expansion.
- No frontend editor model changes.
- No real Ollama execution in automated tests.
- No exposure of local paths, environment values, secrets, prompts, raw provider responses, stack traces, adapter exception text, or raw resume contents.

## Design

### Backend configuration and readiness

The service will add narrow operational configuration validation around the existing upload and adapter timeout behavior:

- `MAX_UPLOAD_BYTES` keeps the current 25 MiB default (`26214400`). Parsing will reject unusable values and apply documented lower/upper bounds so a typo cannot create an unbounded or nonsensical service setting.
- `REVIEW_TIMEOUT_SECONDS` will make the adapter subprocess timeout configurable while preserving the current default of 360 seconds. Parsing will apply documented lower/upper bounds suitable for local multi-call Ollama review.
- `GET /config` will remain path-free and secret-free. If readiness diagnostics are exposed, they will be coarse fixed enum values derived from service state, not raw environment values or exception text.
- The adapter will use the validated timeout setting rather than a hard-coded public constant. Timeout failures will continue to map to the existing `review_timeout` normalized error.

### API contract preservation

No core review API contract changes are planned:

- `POST /reviews` remains multipart form data with required PDF field `file`.
- Review feedback remains advisory and non-mutating.
- Normal Export PDF remains the user-facing canvas/image export path.
- Review submissions may continue adding the review-only extractable text appendix.
- Public errors remain fixed templates selected by normalized error code.
- `/config` remains safe capability/readiness projection only.

### Tests

Backend tests will cover the operational behavior without external dependencies:

- Upload-size defaults, invalid values, and boundary clamping/fallback behavior.
- Timeout defaults, invalid values, and boundary clamping/fallback behavior.
- Adapter timeout wiring and continued `review_timeout` mapping.
- Public config secrecy with unsafe provider/model/path/secret inputs.
- Any readiness diagnostic values, if added, are fixed and do not leak paths or secrets.

Existing frontend and Playwright tests should continue to pass. No automated test will require real Ollama, the real Hiring Agent checkout, hosted credentials, or third-party network access.

### Documentation

Documentation will explain how to run the review service responsibly beyond a single local happy path:

- Real local Ollama review can take several minutes and latency varies by hardware, model state, and Ollama load.
- Reverse proxies should enforce body/upload limits aligned with `MAX_UPLOAD_BYTES`.
- Frontend, proxy, and process supervisor timeouts should exceed `REVIEW_TIMEOUT_SECONDS` plus upload overhead.
- Concurrent uploads multiply memory use because upload memory is bounded per request, not globally.
- Deployments exposed beyond trusted local development should add deployment-level rate and concurrency limits.
- Process/worker counts should be chosen with model memory, CPU/GPU capacity, and per-request upload memory in mind.
- Hosted providers remain opt-in and may transmit resume content to third parties.

Milestone documentation will mark Milestone 16 complete only after implementation and full verification.

## Acceptance

Milestone 16 is complete when:

- Operational config behavior is safer or clearer in code and tests.
- Documentation gives precise deployment/run guidance without overclaiming hosted hardening.
- Existing API contracts are preserved.
- Public config and errors remain secret-free and path-free.
- The full requested verification suite passes:
  - `python3 -m pytest review-service/tests -q`
  - `npm test -- --run`
  - `npm run build`
  - `npm run test:e2e`
