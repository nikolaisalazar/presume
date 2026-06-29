# Review Service Plan

## Purpose

The planned review service wraps HackerRank's open-source Hiring Agent behind a small Presume-owned API. The service accepts the rendered resume PDF, runs extraction and evaluation, and returns a normalized review contract that the frontend can render without depending on Hiring Agent internals.

This service is not implemented yet.

## Framework and Location

- Framework: FastAPI.
- Python: 3.11+.
- Planned directory: `review-service/`.
- Initial Hiring Agent dependency: `vendor/hiring-agent` as a local checkout or git submodule.
- Integration style: a thin adapter around Hiring Agent internals.

The adapter matters because upstream Hiring Agent APIs may change. Presume should isolate those changes in `hiring_agent_adapter.py`.

## Planned Files

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
CORS_ORIGINS=http://localhost:5173
HIRING_AGENT_PATH=../vendor/hiring-agent
```

Rules:

- `LLM_PROVIDER=ollama` is the default local path.
- `DEFAULT_MODEL=gemma3:4b` is the default Ollama model.
- `GEMINI_API_KEY` is required only when `LLM_PROVIDER=gemini`.
- `GITHUB_TOKEN` is optional and should only be used for GitHub enrichment and higher API limits.
- `CORS_ORIGINS` must be explicit; do not allow arbitrary origins by default.
- `HIRING_AGENT_PATH` points to the local checkout or submodule.

## API Contract

### `GET /health`

Returns service liveness.

```json
{
  "status": "ok"
}
```

### `GET /config`

Returns frontend-safe capability information. This endpoint must never expose secrets, API keys, filesystem paths, tokens, or raw environment values that contain sensitive data.

```json
{
  "reviewEnabled": true,
  "llmProvider": "ollama",
  "defaultModel": "gemma3:4b",
  "githubEnrichmentEnabled": false,
  "maxUploadBytes": 10485760
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

Messages should be useful to the user but should not include secrets, stack traces, local filesystem paths, or raw provider responses.

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

## Privacy

Resumes contain personal information. The default path should be local Ollama inference so a developer can review a resume without sending it to a hosted LLM provider.

Hosted providers such as Gemini must be opt-in and clearly documented. When enabled, the service may transmit resume text, extracted resume data, and prompt context to that provider. The service README should state that users are responsible for understanding the provider's data retention and privacy terms.

Do not log raw PDF bytes, extracted resume text, API keys, provider prompts, or full raw review responses by default.

## Tests

Minimum backend tests:

- `GET /health` returns `{"status":"ok"}`.
- `GET /config` excludes secrets and filesystem paths.
- `POST /reviews` rejects non-PDF uploads with `invalid_upload`.
- `POST /reviews` returns the normalized `ReviewResult` shape for a mocked Hiring Agent success.
- Adapter failures map to documented error codes.
- Review timeout maps to `review_timeout`.
