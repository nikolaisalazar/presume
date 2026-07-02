# Presume Review Service

FastAPI service for Presume's advisory resume review flow. The service owns the
public review API, safe configuration projection, upload validation, normalized
errors, and the adapter boundary around HackerRank Hiring Agent.

## Setup

```sh
cd review-service
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Run tests from the repository root:

```sh
python3 -m pytest review-service/tests -q
```

## Endpoints

- `GET /health` returns `{"status":"ok"}`.
- `GET /config` returns frontend-safe capability information only. It reports
  `reviewEnabled: false` when the local Hiring Agent checkout is unavailable.
- `POST /reviews` accepts multipart form data with a required PDF `file`.

Error responses use:

```json
{
  "error": {
    "code": "invalid_upload",
    "message": "Upload must be a PDF.",
    "requestId": "req_123"
  }
}
```

Oversized uploads use `upload_too_large` with the fixed safe message
`Upload exceeds the review service size limit.`

## Configuration

```sh
LLM_PROVIDER=ollama
DEFAULT_MODEL=gemma3:4b
GEMINI_API_KEY=
GITHUB_TOKEN=
CORS_ORIGINS=http://localhost:5173
HIRING_AGENT_PATH=../vendor/hiring-agent
MAX_UPLOAD_BYTES=10485760
```

Defaults favor local review:

- `LLM_PROVIDER` defaults to `ollama`.
- `DEFAULT_MODEL` defaults to `gemma3:4b`.
- `CORS_ORIGINS` defaults to `http://localhost:5173`.
- Review is enabled only when provider configuration is usable and the local
  Hiring Agent checkout exists.
- `GEMINI_API_KEY` is only used when `LLM_PROVIDER=gemini`.
- `GITHUB_TOKEN` is optional and only enables GitHub enrichment.
- `GET /config` returns only allowlisted provider and model identifiers. Unknown
  providers are reported as `disabled`, unsafe model values are replaced with a
  safe identifier, and review is disabled for unknown providers.
- The public model allowlist is intentionally narrow. Arbitrary local model
  names are not echoed from environment variables; add a safe allowlist entry
  before exposing another model identifier.

Hosted providers are opt-in. When a hosted provider such as Gemini is enabled,
resume text, extracted resume data, and prompt context may be sent to that
provider. Users are responsible for understanding the provider's data retention
and privacy terms.

## Hiring Agent Adapter

`app/hiring_agent_adapter.py` is the only module that should depend on
HackerRank Hiring Agent internals. The expected checkout is
`vendor/hiring-agent` or the path provided by `HIRING_AGENT_PATH`.

This repository does not vendor Hiring Agent by default. Until that checkout is
present, `GET /config` reports `reviewEnabled: false` without exposing the
configured path. Until the checkout is present and its concrete Python API is
wired inside the adapter, `/reviews` returns normalized safe errors for the
default adapter.
Tests inject a mocked adapter to verify the public API contract without relying
on upstream internals.

## Privacy

Do not log raw PDFs, extracted resume text, API keys, provider prompts, or full
raw review responses by default. `/config` must not expose API keys, tokens,
filesystem paths, raw environment values, stack traces, or provider responses.
Client-facing error messages are fixed templates selected by normalized error
code; adapter exception text and provider details are not returned to clients.
Uploads are read with the configured `MAX_UPLOAD_BYTES` limit so oversized files
are rejected before the service retains the full body in memory.

## Current Test Boundary

The backend tests use mocked adapters for successful review results, error
mapping, documented endpoint behavior, config secrecy, and safe unexpected
error handling. Frontend tests cover backend-shaped response and error payloads,
including `upload_too_large`. Full browser-to-running-backend review flow
verification remains planned.
