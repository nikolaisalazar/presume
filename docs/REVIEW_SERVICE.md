# Review Service

## Purpose

The review service wraps HackerRank's open-source Hiring Agent behind a small Presume-owned API. The service accepts the rendered resume PDF, runs extraction and evaluation through an adapter boundary, and returns a normalized review contract that the frontend can render without depending on Hiring Agent internals.

The FastAPI service scaffold is implemented in `review-service/`. Hiring Agent execution is isolated in `review-service/app/hiring_agent_adapter.py` and requires a local `vendor/hiring-agent` checkout with its Python dependencies installed.
When the local Hiring Agent checkout directory is unavailable, `GET /config`
reports `reviewEnabled: false` without exposing the configured filesystem path.

## Framework and Location

- Framework: FastAPI.
- Python: 3.11+.
- Directory: `review-service/`.
- Initial Hiring Agent dependency: `vendor/hiring-agent` as a local checkout or git submodule.
- Integration style: a subprocess bridge around Hiring Agent's `score.main`
  entrypoint, followed by Presume-owned normalization.

The adapter matters because upstream Hiring Agent APIs may change. Presume should isolate those changes in `hiring_agent_adapter.py`.

## Files

| File | Responsibility |
|---|---|
| `review-service/app/main.py` | FastAPI app, route registration, CORS, exception handlers. |
| `review-service/app/config.py` | Environment parsing and public config projection. |
| `review-service/app/hiring_agent_adapter.py` | Boundary around Hiring Agent extraction, enrichment, and scoring. |
| `review-service/app/schemas.py` | Pydantic models for responses, review results, categories, annotations, and errors. |
| `review-service/app/errors.py` | Normalized service errors and error-code mapping. |
| `review-service/tests/test_health.py` | Health and config endpoint tests. |
| `review-service/tests/test_review_contract.py` | Contract tests for successful review and error payloads. |
| `review-service/README.md` | Local setup, environment variables, and troubleshooting. |

## Environment Variables

```sh
LLM_PROVIDER=ollama
DEFAULT_MODEL=gemma3:4b
GEMINI_API_KEY=
GITHUB_TOKEN=
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
HIRING_AGENT_PATH=vendor/hiring-agent
MAX_UPLOAD_BYTES=26214400
```

Rules:

- `LLM_PROVIDER=ollama` is the default local path.
- `DEFAULT_MODEL=gemma3:4b` is the default Ollama model.
- Review is enabled only when provider configuration is usable and the local
  Hiring Agent checkout exists as a directory.
- `GEMINI_API_KEY` is required only when `LLM_PROVIDER=gemini`.
- Gemini model values are limited to models currently supported by the local
  Hiring Agent checkout. Unsupported Gemini model values fall back to
  `gemini-2.5-flash` rather than being exposed through `/config`.
- Unknown `LLM_PROVIDER` values disable review and are not projected verbatim through `/config`.
- `/config` returns only allowlisted provider and model identifiers; unsafe model values are replaced with safe defaults or `unavailable`.
- The public model allowlist is intentionally narrow. Arbitrary local model names must not be echoed from environment variables; add a safe allowlist entry before exposing another model identifier.
- GitHub enrichment is disabled unless `GITHUB_TOKEN` is configured. When set,
  `GITHUB_TOKEN` enables enrichment and provides GitHub API rate limits.
- Without GitHub enrichment enabled, resumes with GitHub profile URLs should
  not trigger outbound GitHub API calls.
- `CORS_ORIGINS` defaults to
  `http://localhost:5173,http://127.0.0.1:5173` for local Vite development and
  must stay explicit; do not allow arbitrary origins by default.
- Relative `HIRING_AGENT_PATH` values resolve from the repository root. The
  default expects a checkout directory at `vendor/hiring-agent`.
- `HIRING_AGENT_PATH` points to the local checkout or submodule.
- The adapter prefers `.venv/bin/python` inside the Hiring Agent checkout when
  present, so its upstream dependencies can remain isolated from the review
  service environment.
- The subprocess receives only allowlisted runtime environment variables plus
  explicit provider settings from service configuration. Ambient parent process
  secrets such as `GITHUB_TOKEN` or `GEMINI_API_KEY` are not inherited.
- Service requests disable Hiring Agent development/cache behavior before
  importing its scoring entrypoint, then patch already-imported Hiring Agent
  modules that copied the development flag by value. This prevents service
  requests from creating or reusing development cache files under the checkout.
- Upload memory is bounded per request by `MAX_UPLOAD_BYTES`; deployments that
  expose the service beyond local development should add appropriate process,
  proxy, rate, or concurrency limits.

## API Contract

### `GET /health`

Returns service liveness.

```json
{
  "status": "ok"
}
```

### `GET /config`

Returns frontend-safe capability information. This endpoint must never expose secrets, API keys, filesystem paths, tokens, raw environment values, stack traces, raw provider responses, or arbitrary unknown provider/model strings. `reviewEnabled` is false when the local Hiring Agent checkout is missing or is not a directory.

```json
{
  "reviewEnabled": true,
  "llmProvider": "ollama",
  "defaultModel": "gemma3:4b",
  "githubEnrichmentEnabled": false,
  "maxUploadBytes": 26214400
}
```

### `POST /reviews`

Accepts multipart form data:

- `file`: PDF upload, required.
- Optional future fields can include user-controlled review options, but the first implementation should keep the request minimal.

Successful response:

```json
{
  "id": "review_123",
  "reviewedAt": "2026-06-29T12:00:00Z",
  "totalScore": 72,
  "maxScore": 100,
  "tier": "competitive",
  "categories": [],
  "strengths": [],
  "improvements": [],
  "bonuses": [],
  "deductions": [],
  "annotations": [],
  "raw": {}
}
```

## Normalized Error Codes

Every error response should use one of these codes:

- `invalid_upload`
- `upload_too_large`
- `pdf_parse_failed`
- `llm_provider_unavailable`
- `github_rate_limited`
- `hiring_agent_failed`
- `review_timeout`
- `internal_error`

Error response shape:

```json
{
  "error": {
    "code": "invalid_upload",
    "message": "Upload must be a PDF.",
    "requestId": "req_123"
  }
}
```

Messages are fixed safe templates selected by normalized error code. They should be useful to the user but must not include secrets, stack traces, local filesystem paths, raw provider responses, resume contents, or arbitrary adapter exception text.

## Review Result Schema

The backend should return the same normalized shape expected by the frontend:

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

The adapter may keep raw Hiring Agent output in `raw` during development, but production UI should depend only on normalized fields.
The current adapter only exposes `raw: {"source": "hiring-agent"}` and does not
return raw provider responses, prompts, extracted resume text, or full upstream
evaluation payloads to clients.

## Privacy

Resumes contain personal information. The default path should be local Ollama inference so a developer can review a resume without sending it to a hosted LLM provider.

Hosted providers such as Gemini must be opt-in and clearly documented. When enabled, the service may transmit resume text, extracted resume data, and prompt context to that provider. The service README should state that users are responsible for understanding the provider's data retention and privacy terms.

GitHub enrichment is a separate external network path from LLM inference. It is
disabled unless `GITHUB_TOKEN` is configured; local Ollama review without a
GitHub token should not call GitHub even when the resume includes GitHub profile
URLs.

Do not log raw PDF bytes, extracted resume text, API keys, provider prompts, or full raw review responses by default.

## Tests

Minimum backend tests:

- `GET /health` returns `{"status":"ok"}`.
- `GET /config` excludes secrets and filesystem paths.
- `POST /reviews` rejects non-PDF uploads with `invalid_upload`.
- `POST /reviews` rejects oversized uploads with `upload_too_large` while reading within the configured size limit.
- `POST /reviews` returns the normalized `ReviewResult` shape for a mocked Hiring Agent success.
- Adapter failures map to documented error codes.
- Review timeout maps to `review_timeout`.
- Numeric review scores reject non-finite values.
- The adapter subprocess bridge maps fixture-like Hiring Agent evaluation output
  into the normalized `ReviewResult` contract.
- Adapter tests verify development/cache behavior is disabled for service
  requests, subprocess timeouts map to `review_timeout`, and malformed numeric
  score boundaries are normalized or rejected before reaching the frontend
  contract.
- Adapter tests verify ambient `GITHUB_TOKEN` and `GEMINI_API_KEY` values are
  stripped from the subprocess environment unless explicitly configured, and
  GitHub enrichment is disabled or enabled consistently with `/config`.

Integration-oriented frontend/backend tests now cover unconfigured editor behavior, configured-service-disabled behavior, config-error behavior, backend-shaped frontend errors, mocked backend review success, documented endpoint behavior, config secrecy, and safe error handling. Browser-to-running-backend verification has exercised the actual frontend, FastAPI service, CORS preflight, multipart upload, adapter subprocess boundary, review result rendering, stale-after-edit behavior, disabled-service state, and backend-unavailable state with a controlled temporary adapter target. Real Ollama-backed Hiring Agent execution still requires a local checkout, `ollama`, and the selected model installed locally.

## Local Browser-To-Backend Runbook

Start the backend from the repository root:

```sh
cd review-service
HIRING_AGENT_PATH=../vendor/hiring-agent \
LLM_PROVIDER=ollama \
DEFAULT_MODEL=gemma3:4b \
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Start the frontend from the repository root:

```sh
VITE_REVIEW_API_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1
```

Open the Vite URL, click `Review resume`, and verify the review panel renders
the returned score, categories, strengths, improvements, bonuses, deductions,
and findings when present. Edit the resume after a successful review and verify
the previous result remains visible with a stale status.

Common failure modes:

- `GET /config` returns `"reviewEnabled": false`: `HIRING_AGENT_PATH` does not
  point to a checkout directory, the selected provider is unsupported, or the
  selected hosted provider is missing required credentials.
- Browser network error: the frontend origin is not in `CORS_ORIGINS`, the
  backend is not running at `VITE_REVIEW_API_URL`, or the backend process
  crashed.
- `upload_too_large`: the browser-rendered PDF exceeded `MAX_UPLOAD_BYTES` and
  was rejected by the backend after upload. The default is 25 MiB.
- `hiring_agent_failed`: the adapter could not execute the checkout
  successfully. Check Hiring Agent dependencies, `ollama` installation,
  `ollama serve`, and `ollama pull gemma3:4b` locally. Public API responses
  intentionally do not expose adapter exception text.
