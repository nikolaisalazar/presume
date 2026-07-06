# Milestone 15 Browser/E2E Automation Design

## Goal

Add narrow, deterministic browser automation for Presume's critical review and export contracts after PR #15. The tests should exercise the real Vite app in a real browser, but must not require Ollama, `vendor/hiring-agent`, third-party network access, or slow machine-dependent review execution.

## Approach

Use Playwright with route interception. Playwright will launch the built/dev-served app in Chromium. Tests that need review configuration will run the frontend with `VITE_REVIEW_API_URL` pointing at a loopback test origin, then intercept `GET /config` and `POST /reviews` inside the browser test. This keeps the browser, React app, PDF generation path, form submission, review normalization, and layout behavior real while replacing the review backend with deterministic fixture responses.

This is intentionally not a full real-stack Hiring Agent test. The real Ollama-backed path remains manual because it requires a local Hiring Agent checkout, its `.venv`, running Ollama, a selected model such as `gemma3:4b`, and multi-minute review latency that varies by machine.

## Browser Contracts Covered

The E2E suite will cover these user-visible contracts:

1. The app loads in a real browser and renders the resume page.
2. The resume canvas/export surface is nonblank in the browser.
3. The normal `Export PDF` button triggers a `resume.pdf` download and the editor remains editable afterward.
4. Review UI stays safe when unconfigured.
5. Configured review states are deterministic:
   - `GET /config` returning `reviewEnabled: false` renders the disabled-service state.
   - `GET /config` failing renders the config-error/backend-unavailable state.
   - `GET /config` enabled plus `POST /reviews` returning a fixture normalized result renders score, categories, strengths, improvements, bonuses, deductions, and findings.
6. The intercepted `POST /reviews` request uses multipart form data with required field `file` and a PDF filename/content type.
7. Editing after a successful review marks the prior result stale while keeping it visible.
8. A narrow/mobile viewport preserves the Milestone 13 responsive contract: page-level horizontal overflow stays absent, `.workspace` can shrink, `.resume-canvas-scroll` owns the fixed 816px canvas horizontal scroll, and `.review-panel` stays within the viewport.

## Test Shape

Add a small `e2e/` Playwright suite:

- One unconfigured/export/layout test group that runs without `VITE_REVIEW_API_URL`.
- One configured-review test group that uses route interception for `/config` and `/reviews`.
- Shared fixture data for one normalized review result based on the established `ReviewResult` contract.
- Assertions based on observable browser behavior: text rendered, download event, request payload shape, editable content changes, and measured viewport/scroll dimensions.

Avoid screenshot-only assertions. If a visual rendering contract needs checking, use concrete browser-observable evidence such as a nonblank screenshot/canvas pixel sample or element geometry.

## Implementation Boundaries

- Do not change the review API contract.
- Do not change backend service behavior for this milestone.
- Do not add product UI polish or editor data-model changes.
- Keep normal user-facing export as the canvas/image PDF path.
- Keep the review-only extractable text appendix limited to review submissions.
- Preserve existing responsive CSS contracts from Milestone 13.

## Commands and Documentation

Add an npm script, expected to be `npm run test:e2e`, that runs the Playwright suite. Documentation will record:

- the new command,
- what contracts are covered,
- what remains manual,
- why real Ollama-backed Hiring Agent execution is not part of default automated E2E.

## Verification

Before completion, run and report:

```sh
python3 -m pytest review-service/tests -q
npm test -- --run
npm run build
npm run test:e2e
```
