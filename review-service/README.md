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

To run the service for the browser review flow from the repository root:

```sh
cd review-service
HIRING_AGENT_PATH=../vendor/hiring-agent \
LLM_PROVIDER=ollama \
DEFAULT_MODEL=gemma3:4b \
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then start the frontend from the repository root:

```sh
VITE_REVIEW_API_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1
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
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
HIRING_AGENT_PATH=vendor/hiring-agent
MAX_UPLOAD_BYTES=26214400
```

Defaults favor local review:

- `LLM_PROVIDER` defaults to `ollama`.
- `DEFAULT_MODEL` defaults to `gemma3:4b`.
- `CORS_ORIGINS` defaults to `http://localhost:5173,http://127.0.0.1:5173`.
- `MAX_UPLOAD_BYTES` defaults to 25 MiB so the browser-rendered default resume
  PDF can be posted for review while still bounding upload memory per request.
- Review is enabled only when provider configuration is usable and the local
  Hiring Agent checkout exists as a directory.
- `GEMINI_API_KEY` is only used when `LLM_PROVIDER=gemini`.
- Gemini defaults and fallbacks use upstream-supported model identifiers such
  as `gemini-2.5-flash`; unsupported Gemini model values are not echoed through
  `/config`.
- GitHub enrichment is disabled unless `GITHUB_TOKEN` is configured. When set,
  `GITHUB_TOKEN` enables enrichment and provides GitHub API rate limits.
- Without GitHub enrichment enabled, resumes with GitHub profile URLs should
  not trigger outbound GitHub API calls.
- Relative `HIRING_AGENT_PATH` values resolve from the repository root. The
  default expects a checkout directory at `vendor/hiring-agent`.
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
`vendor/hiring-agent` at the repository root or the path provided by
`HIRING_AGENT_PATH`.

This repository does not vendor Hiring Agent by default. Until that checkout is
present as a directory, `GET /config` reports `reviewEnabled: false` without
exposing the configured path. When the checkout is present, the adapter runs a
small subprocess bridge inside that directory, calls Hiring Agent's `score.main`
entrypoint with the uploaded PDF, captures the returned Pydantic evaluation as
JSON, and maps it into Presume's normalized `ReviewResult`.

Set up the dependency checkout separately:

```sh
mkdir -p vendor
git clone https://github.com/interviewstreet/hiring-agent.git vendor/hiring-agent
cd vendor/hiring-agent
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
ollama pull gemma3:4b
```

The adapter prefers `vendor/hiring-agent/.venv/bin/python` when it exists and
falls back to the review service Python executable. Keep `ollama serve` running
for the default local provider before posting a resume. Hosted providers remain
opt-in through `LLM_PROVIDER` and their provider-specific credentials.
The subprocess receives only allowlisted runtime environment variables plus
explicit provider settings from the service configuration; ambient parent
process secrets such as `GITHUB_TOKEN` or `GEMINI_API_KEY` are not inherited.
For service requests, the bridge disables Hiring Agent development/cache mode
before importing its scoring entrypoint and patches already-imported Hiring
Agent modules that copied that flag by value. This prevents review requests
from creating or reusing development cache files in `vendor/hiring-agent/cache`.

Adapter tests use a fixture-like fake checkout to verify subprocess execution,
normalization, cache disabling, GitHub enrichment gating, ambient secret
stripping, safe failure mapping, and timeout mapping without relying on Ollama
or upstream network calls.

## Privacy

Do not log raw PDFs, extracted resume text, API keys, provider prompts, or full
raw review responses by default. `/config` must not expose API keys, tokens,
filesystem paths, raw environment values, stack traces, or provider responses.
Client-facing error messages are fixed templates selected by normalized error
code; adapter exception text and provider details are not returned to clients.
Uploads are read with the configured `MAX_UPLOAD_BYTES` limit so oversized files
are rejected before the service retains the full body in memory. Upload memory
is bounded per request by `MAX_UPLOAD_BYTES`; deployments that expose the
service beyond local development should add appropriate process, proxy, rate,
or concurrency limits.
Local Ollama keeps LLM inference local by default. GitHub enrichment is a
separate external network path and remains disabled unless `GITHUB_TOKEN` is
configured.

## Current Test Boundary

The backend tests use mocked adapters for route-level successful review results,
error mapping, documented endpoint behavior, config secrecy, and safe unexpected
error handling. Focused adapter tests cover the subprocess bridge and
normalization with a fake Hiring Agent checkout. Frontend tests cover
backend-shaped response and error payloads, including `upload_too_large`.
Browser-to-running-backend verification has exercised the actual frontend,
FastAPI service, CORS preflight, multipart upload, adapter subprocess boundary,
review result rendering, stale-after-edit behavior, disabled-service state, and
backend-unavailable state with a controlled temporary adapter target. The real
Ollama-backed PDF execution path has not been manually exercised unless a local
`vendor/hiring-agent` checkout, `ollama`, and the selected model are installed.

## Browser Flow Troubleshooting

- If the review panel says the service is not ready, confirm `GET
  http://127.0.0.1:8000/config` returns `"reviewEnabled": true`. A missing
  Hiring Agent checkout or unsupported provider configuration reports review as
  disabled.
- If the browser reports a network failure, confirm the frontend is running on
  one of the configured `CORS_ORIGINS`. The defaults cover both
  `http://localhost:5173` and `http://127.0.0.1:5173`.
- If review fails with `upload_too_large`, the backend rejected the PDF after
  upload because it exceeded `MAX_UPLOAD_BYTES`. Raise `MAX_UPLOAD_BYTES` for
  local testing or reduce the rendered PDF size. The default is 25 MiB.
- If review fails with `hiring_agent_failed`, run the Hiring Agent checkout
  directly with the same provider settings. Missing Python dependencies,
  missing `ollama`, an unpulled model, or a stopped Ollama server all surface to
  the client as the same safe normalized error.
