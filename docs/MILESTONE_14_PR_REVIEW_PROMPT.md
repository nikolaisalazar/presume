# Milestone 14 PR Review Prompt

You are reviewing the Milestone 14 PR for `nikolaisalazar/presume`.

## Goal

Review whether the PR safely and narrowly completes Milestone 14: real
Ollama-backed Hiring Agent verification.

The intended verified path is:

Presume frontend -> generated resume PDF -> FastAPI review service -> real
`vendor/hiring-agent` checkout -> local Ollama model -> normalized review
result -> frontend review panel.

## Review Priorities

Focus on correctness, safety, and scope control. Do not suggest broad UI polish,
editor data-model redesign, hosted-provider work, Milestone 15 automation, or
unrelated refactors.

## Required Context To Read

- `docs/MILESTONE_PLAN.md`
- `docs/README.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/REVIEW_SERVICE.md`
- `README.md`
- `review-service/README.md`
- `review-service/app/hiring_agent_adapter.py`
- `review-service/app/config.py`
- `review-service/app/main.py`
- `review-service/tests/test_hiring_agent_adapter.py`
- `review-service/tests/test_review_contract.py`
- `review-service/tests/test_health.py`
- `src/reviewTypes.ts`
- `src/reviewApi.ts`
- `src/useResumeReview.ts`
- `src/components/ReviewPanel.tsx`
- `src/export.ts`
- `src/tests/export.test.ts`
- `src/tests/useResumeReview.test.ts`

## Specific Questions To Answer

1. Does the PR keep `vendor/hiring-agent` as a local prerequisite rather than
   vendoring third-party source into this repository?
2. Does `GET /config` expose only safe capability information and avoid
   filesystem paths, secrets, stack traces, raw provider data, or raw
   environment values?
3. Does `resolve_hiring_agent_path` correctly support the documented command
   that starts Uvicorn from `review-service` with
   `HIRING_AGENT_PATH=../vendor/hiring-agent`?
4. Does `POST /reviews` remain multipart form data with required PDF field
   `file`?
5. Does the review-only PDF generation path provide extractable resume text
   for Hiring Agent without changing the normal exported PDF behavior?
6. Could the extractable text appendix leak editor-only controls, stale DOM
   artifacts, hidden user-interface text, or unrelated page content?
7. Are backend timeout and error-handling changes appropriate for real local
   Ollama latency without exposing arbitrary adapter exception text?
8. Does the frontend validator still accept only the normalized review contract?
9. Does the review panel render normalized scores, categories, strengths,
   improvements, bonuses, deductions, and findings when present?
10. Does editing after a successful review keep the previous result visible and
    mark it stale without mutating resume content?
11. Are Milestone 13 responsive contracts preserved, especially:
    - `.workspace { min-width: 0; }`
    - responsive `.workspace` uses `grid-template-columns: minmax(0, 1fr)` and
      `width: 100%`
    - `.review-panel { width: 100%; max-width: min(816px, calc(100vw - 32px)); }`
    - only `.resume-canvas-scroll` horizontally scrolls the fixed `816px`
      resume canvas on narrow viewports
12. Are documentation claims precise about what was actually verified, including
    the direct real-stack `/reviews` POST, the observed result shape, safe
    failure behavior, and any remaining risks?

## Verification To Run

Run these checks and report the exact result:

```sh
python3 -m pytest review-service/tests -q
npm test -- --run
npm run build
```

If local prerequisites are available, also attempt the real-stack smoke test:

```sh
cd review-service
HIRING_AGENT_PATH=../vendor/hiring-agent \
LLM_PROVIDER=ollama \
DEFAULT_MODEL=gemma3:4b \
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then, from another terminal:

```sh
curl http://127.0.0.1:8000/config
```

Confirm `reviewEnabled` is `true` and the response is path-free and
secret-free.

If possible, submit a real browser-generated Presume review PDF to
`POST /reviews` and confirm HTTP 200 with a normalized `ReviewResult`. Do not
claim real Ollama-backed execution unless `vendor/hiring-agent`, Ollama, the
selected local model, and a valid PDF were actually used.

## Review Output Format

Start with findings, ordered by severity. Each finding must include:

- File and line reference
- Why it matters
- What behavior could fail
- A concrete suggested fix

If there are no blocking issues, say that clearly and list any residual risks or
test gaps.
