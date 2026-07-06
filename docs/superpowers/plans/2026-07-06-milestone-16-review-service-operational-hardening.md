# Milestone 16 Review-Service Operational Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden review-service operational configuration and documentation without changing the core review API contract.

**Architecture:** Keep changes backend-focused. Add bounded integer parsing and safe readiness diagnostics in `review-service/app/config.py`, wire the validated timeout into `HiringAgentAdapter`, cover behavior with deterministic backend tests, then update docs and milestone status. Public config may add only fixed enum-style readiness fields that are safe for frontend display and ignored by the current frontend validator.

**Tech Stack:** Python 3.11+, FastAPI, Pydantic, pytest, React/Vite/Vitest/Playwright verification only.

## Global Constraints

- `POST /reviews` remains multipart form data with required PDF field `file`.
- `GET /config` exposes only safe capability information.
- Review feedback is advisory and non-mutating.
- Normal Export PDF remains the user-facing canvas/image export path.
- Review submissions may add the review-only extractable text appendix.
- `vendor/hiring-agent` remains a local prerequisite and is not vendored.
- Automated tests must not require real Ollama, `vendor/hiring-agent`, hosted-provider credentials, or third-party network access.
- Milestone 13 responsive contracts remain intact.
- Milestone 15 Playwright E2E contracts remain intact, including `/presume/` base-path loading and multipart review upload validation.
- Do not expose filesystem paths, env values, provider responses, prompts, stack traces, raw resume text, or secrets.

---

## File Structure

- Modify `review-service/app/config.py`: operational constants, bounded parsing, readiness reason computation, `Settings.review_timeout_seconds`.
- Modify `review-service/app/hiring_agent_adapter.py`: use `settings.review_timeout_seconds` for subprocess and outer timeout instead of a fixed constant.
- Modify `review-service/app/schemas.py`: add optional safe public config fields if readiness diagnostics are exposed.
- Modify `review-service/tests/test_health.py`: config parsing, safe public config, readiness diagnostics.
- Modify `review-service/tests/test_hiring_agent_adapter.py`: timeout wiring test updates.
- Modify docs: `docs/MILESTONE_PLAN.md`, `docs/README.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/REVIEW_SERVICE.md`, `README.md`, `review-service/README.md`.

---

### Task 1: Add bounded operational config parsing and safe readiness diagnostics

**Files:**
- Modify: `review-service/app/config.py`
- Modify: `review-service/app/schemas.py`
- Test: `review-service/tests/test_health.py`

**Interfaces:**
- Produces: `Settings.review_timeout_seconds: int`
- Produces: `parse_review_timeout_seconds(value: str | None) -> int`
- Produces: `parse_max_upload_bytes(value: str | None) -> int` with bounded behavior
- Produces: `Settings.readiness_state: str` and `Settings.readiness_reason: str`
- Produces: `PublicConfig.reviewReadiness: str | None` and `PublicConfig.reviewReadinessReason: str | None`

- [ ] **Step 1: Add failing config tests**

Add these imports and tests to `review-service/tests/test_health.py`:

```python
from app.config import (
    DEFAULT_MAX_UPLOAD_BYTES,
    DEFAULT_REVIEW_TIMEOUT_SECONDS,
    MAX_ALLOWED_UPLOAD_BYTES,
    MAX_REVIEW_TIMEOUT_SECONDS,
    MIN_ALLOWED_UPLOAD_BYTES,
    MIN_REVIEW_TIMEOUT_SECONDS,
    parse_max_upload_bytes,
    parse_review_timeout_seconds,
)
```

```python
def test_upload_limit_parser_rejects_invalid_and_clamps_bounds():
    assert parse_max_upload_bytes(None) == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("not-a-number") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("0") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("-1") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes(str(MIN_ALLOWED_UPLOAD_BYTES - 1)) == MIN_ALLOWED_UPLOAD_BYTES
    assert parse_max_upload_bytes(str(MIN_ALLOWED_UPLOAD_BYTES)) == MIN_ALLOWED_UPLOAD_BYTES
    assert parse_max_upload_bytes(str(MAX_ALLOWED_UPLOAD_BYTES + 1)) == MAX_ALLOWED_UPLOAD_BYTES
    assert parse_max_upload_bytes(str(MAX_ALLOWED_UPLOAD_BYTES)) == MAX_ALLOWED_UPLOAD_BYTES


def test_review_timeout_parser_rejects_invalid_and_clamps_bounds():
    assert parse_review_timeout_seconds(None) == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("not-a-number") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("0") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("-1") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds(str(MIN_REVIEW_TIMEOUT_SECONDS - 1)) == MIN_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds(str(MIN_REVIEW_TIMEOUT_SECONDS)) == MIN_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds(str(MAX_REVIEW_TIMEOUT_SECONDS + 1)) == MAX_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds(str(MAX_REVIEW_TIMEOUT_SECONDS)) == MAX_REVIEW_TIMEOUT_SECONDS
```

Add safe readiness tests:

```python
def test_config_reports_safe_missing_hiring_agent_readiness_without_path(monkeypatch, tmp_path):
    missing_path = tmp_path / "secret" / "hiring-agent"
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "gemma3:4b")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(missing_path))

    client = TestClient(create_app())
    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is False
    assert body["reviewReadiness"] == "unavailable"
    assert body["reviewReadinessReason"] == "missing_hiring_agent"
    assert str(missing_path) not in response.text
    assert "secret" not in response.text


def test_config_reports_safe_ready_state(monkeypatch, tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "gemma3:4b")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))

    client = TestClient(create_app())
    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is True
    assert body["reviewReadiness"] == "ready"
    assert body["reviewReadinessReason"] == "ready"
    assert str(hiring_agent_path) not in response.text


def test_config_reports_safe_provider_readiness_reasons(monkeypatch, tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))
    monkeypatch.setenv("LLM_PROVIDER", "sk-secret-provider")
    monkeypatch.setenv("DEFAULT_MODEL", "/Users/name/.config/secret-model")
    monkeypatch.setenv("GEMINI_API_KEY", "sk-secret-key")

    client = TestClient(create_app())
    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is False
    assert body["reviewReadiness"] == "unavailable"
    assert body["reviewReadinessReason"] == "provider_disabled"
    assert "sk-secret" not in response.text
    assert "/Users" not in response.text
```

Add timeout/public config test:

```python
def test_config_includes_bounded_operational_limits(monkeypatch, tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))
    monkeypatch.setenv("MAX_UPLOAD_BYTES", "999999999999")
    monkeypatch.setenv("REVIEW_TIMEOUT_SECONDS", "999999")

    client = TestClient(create_app())
    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["maxUploadBytes"] == MAX_ALLOWED_UPLOAD_BYTES
    assert body["reviewTimeoutSeconds"] == MAX_REVIEW_TIMEOUT_SECONDS
```

- [ ] **Step 2: Run tests to verify failure**

Run: `python3 -m pytest review-service/tests/test_health.py -q`

Expected: FAIL with import errors or missing public config fields.

- [ ] **Step 3: Implement config constants, parser, readiness fields**

In `review-service/app/config.py`, add constants near existing defaults:

```python
DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MIN_ALLOWED_UPLOAD_BYTES = 1024 * 1024
MAX_ALLOWED_UPLOAD_BYTES = 100 * 1024 * 1024
DEFAULT_REVIEW_TIMEOUT_SECONDS = 360
MIN_REVIEW_TIMEOUT_SECONDS = 60
MAX_REVIEW_TIMEOUT_SECONDS = 900
```

Add `review_timeout_seconds: int` to `Settings`.

Add properties to `Settings`:

```python
    @property
    def readiness_reason(self) -> str:
        if not self.hiring_agent_available:
            return "missing_hiring_agent"
        provider = self.public_provider
        if provider == DISABLED_PROVIDER:
            return "provider_disabled"
        if provider == "gemini" and not self.gemini_api_key:
            return "missing_provider_credentials"
        return "ready"

    @property
    def readiness_state(self) -> str:
        return "ready" if self.readiness_reason == "ready" else "unavailable"
```

Update `public_config()`:

```python
            reviewReadiness=self.readiness_state,
            reviewReadinessReason=self.readiness_reason,
            reviewTimeoutSeconds=self.review_timeout_seconds,
```

Update `load_settings()`:

```python
        review_timeout_seconds=parse_review_timeout_seconds(
            os.getenv("REVIEW_TIMEOUT_SECONDS")
        ),
```

Replace `parse_max_upload_bytes` with:

```python
def parse_max_upload_bytes(value: str | None) -> int:
    return parse_bounded_int(
        value,
        default=DEFAULT_MAX_UPLOAD_BYTES,
        minimum=MIN_ALLOWED_UPLOAD_BYTES,
        maximum=MAX_ALLOWED_UPLOAD_BYTES,
    )
```

Add:

```python
def parse_review_timeout_seconds(value: str | None) -> int:
    return parse_bounded_int(
        value,
        default=DEFAULT_REVIEW_TIMEOUT_SECONDS,
        minimum=MIN_REVIEW_TIMEOUT_SECONDS,
        maximum=MAX_REVIEW_TIMEOUT_SECONDS,
    )


def parse_bounded_int(
    value: str | None,
    *,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    if value is None or not value.strip():
        return default

    try:
        parsed = int(value)
    except ValueError:
        return default

    if parsed <= 0:
        return default
    if parsed < minimum:
        return minimum
    if parsed > maximum:
        return maximum
    return parsed
```

In `review-service/app/schemas.py`, update `PublicConfig`:

```python
class PublicConfig(StrictSchema):
    reviewEnabled: bool
    llmProvider: str
    defaultModel: str
    githubEnrichmentEnabled: bool
    maxUploadBytes: int = Field(gt=0)
    reviewReadiness: Literal["ready", "unavailable"] | None = None
    reviewReadinessReason: Literal[
        "ready",
        "missing_hiring_agent",
        "provider_disabled",
        "missing_provider_credentials",
    ] | None = None
    reviewTimeoutSeconds: int | None = Field(default=None, gt=0)
```

- [ ] **Step 4: Run tests to verify pass**

Run: `python3 -m pytest review-service/tests/test_health.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add review-service/app/config.py review-service/app/schemas.py review-service/tests/test_health.py
git commit -m "Harden review service operational config"
```

---

### Task 2: Wire validated review timeout into the adapter

**Files:**
- Modify: `review-service/app/hiring_agent_adapter.py`
- Modify: `review-service/tests/test_hiring_agent_adapter.py`
- Modify: any direct `Settings(...)` constructions in tests

**Interfaces:**
- Consumes: `Settings.review_timeout_seconds: int`
- Produces: adapter subprocess timeout behavior driven by settings.

- [ ] **Step 1: Add failing timeout wiring test**

In `review-service/tests/test_hiring_agent_adapter.py`, update `make_settings` signature:

```python
def make_settings(
    hiring_agent_path: str,
    *,
    github_token: str = "",
    gemini_api_key: str = "",
    review_timeout_seconds: int = 360,
) -> Settings:
```

Add `review_timeout_seconds=review_timeout_seconds` to the returned `Settings`.

Replace the timeout assertion in `test_adapter_maps_subprocess_timeout_to_safe_timeout` with:

```python
    adapter = HiringAgentAdapter(
        make_settings(str(hiring_agent_path), review_timeout_seconds=123)
    )

    def raise_timeout(*args, **kwargs):
        assert kwargs["timeout"] == 123
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=kwargs["timeout"])
```

- [ ] **Step 2: Run test to verify failure**

Run: `python3 -m pytest review-service/tests/test_hiring_agent_adapter.py::test_adapter_maps_subprocess_timeout_to_safe_timeout -q`

Expected: FAIL because the adapter still uses the hard-coded timeout.

- [ ] **Step 3: Implement adapter timeout wiring**

In `review-service/app/hiring_agent_adapter.py`:

- Remove the hard-coded `SUBPROCESS_TIMEOUT_SECONDS = 360` constant, or keep it only as an imported compatibility alias to `DEFAULT_REVIEW_TIMEOUT_SECONDS` from config.
- Import `DEFAULT_REVIEW_TIMEOUT_SECONDS` only if needed for test compatibility.
- In `review_pdf`, replace:

```python
                timeout=SUBPROCESS_TIMEOUT_SECONDS + 15,
```

with:

```python
                timeout=self.settings.review_timeout_seconds + 15,
```

- Change `_execute_hiring_agent_subprocess` signature:

```python
    def _execute_hiring_agent_subprocess(
        self,
        hiring_agent_path: Path,
        pdf_bytes: bytes,
    ) -> dict[str, Any]:
```

Inside `subprocess.run`, replace:

```python
                    timeout=SUBPROCESS_TIMEOUT_SECONDS,
```

with:

```python
                    timeout=self.settings.review_timeout_seconds,
```

If tests still import `SUBPROCESS_TIMEOUT_SECONDS`, define:

```python
SUBPROCESS_TIMEOUT_SECONDS = DEFAULT_REVIEW_TIMEOUT_SECONDS
```

and update tests away from relying on it.

- [ ] **Step 4: Run backend tests**

Run: `python3 -m pytest review-service/tests -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add review-service/app/hiring_agent_adapter.py review-service/tests/test_hiring_agent_adapter.py review-service/tests/test_review_contract.py review-service/tests/test_health.py
git commit -m "Use configured review service timeout"
```

---

### Task 3: Update operational documentation and milestone status

**Files:**
- Modify: `docs/MILESTONE_PLAN.md`
- Modify: `docs/README.md`
- Modify: `docs/PRODUCT_SPEC.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/REVIEW_SERVICE.md`
- Modify: `README.md`
- Modify: `review-service/README.md`

**Interfaces:**
- Consumes: implemented config variables `MAX_UPLOAD_BYTES`, `REVIEW_TIMEOUT_SECONDS`, readiness diagnostics.
- Produces: precise docs that do not overclaim hosted deployment hardening.

- [ ] **Step 1: Update review-service docs**

In `docs/REVIEW_SERVICE.md` and `review-service/README.md`, add `REVIEW_TIMEOUT_SECONDS=360` to environment examples and document:

```md
- `REVIEW_TIMEOUT_SECONDS` defaults to `360` seconds. The value is bounded by
  the service so accidental zero, negative, tiny, or extremely large values do
  not create nonsensical runtime behavior. Set proxy, browser-facing, and
  process-supervisor timeouts higher than this value plus upload overhead.
- `MAX_UPLOAD_BYTES` defaults to `26214400` bytes and is bounded by the service.
  Configure reverse-proxy request body limits to the same value or lower so
  oversized uploads are rejected before reaching the Python process.
- Upload memory is bounded per request, not globally. Concurrent uploads can
  multiply memory use by approximately `MAX_UPLOAD_BYTES` per in-flight request
  before adapter work begins.
- Deployments exposed beyond trusted local development should add rate limiting
  and concurrency limiting at the proxy or process manager. The app is not an
  authenticated public review platform.
- Real local Ollama review can take several minutes. The verified Milestone 14
  direct request took 202.292199 seconds, and latency varies by hardware,
  model warmup, model size, and current Ollama load.
```

- [ ] **Step 2: Update top-level docs**

In `README.md`, replace “Still planned: Operational hardening...” with a statement that narrow operational hardening is implemented and that deployments still need external rate/concurrency controls.

In `docs/README.md`, update the current-vs-planned paragraph so Milestone 16 is complete and Milestone 17 is next.

In `docs/PRODUCT_SPEC.md` and `docs/ARCHITECTURE.md`, mention bounded operational config and deployment guidance without claiming built-in auth, queues, dashboards, or hosted production readiness.

- [ ] **Step 3: Update milestone plan**

In `docs/MILESTONE_PLAN.md`, change the initial Milestone 16 status to `Complete` and add completion evidence:

```md
Completion evidence:

- `review-service/app/config.py` validates bounded upload and timeout settings.
- `review-service/app/hiring_agent_adapter.py` uses the validated review timeout.
- `GET /config` exposes only safe readiness/limit information and remains path-free and secret-free.
- Backend tests cover invalid and boundary operational config, timeout wiring, and safe config projection.
- Documentation now covers proxy upload limits, timeout expectations, worker/process considerations, rate/concurrency limiting, local Ollama latency, and hosted-provider privacy boundaries.

Verification:

- Backend verification: `python3 -m pytest review-service/tests -q`
- Frontend verification: `npm test -- --run`
- Build verification: `npm run build`
- Browser/E2E verification: `npm run test:e2e`

Residual risk:

- The service still does not provide built-in authentication, queues, global concurrency limits, or rate limiting. Deployments exposed beyond trusted local development must add those controls externally.
- Real Ollama-backed review remains manual/local because it depends on local `vendor/hiring-agent`, Ollama, model availability, and multi-minute machine-dependent latency.
```

- [ ] **Step 4: Run docs grep checks**

Run:

```bash
grep -R --exclude-dir=superpowers "Milestone 16.*Planned\|Operational hardening.*planned" README.md docs review-service/README.md || true
```

Expected: no stale claims that Milestone 16 is still planned.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/README.md docs/PRODUCT_SPEC.md docs/ARCHITECTURE.md docs/REVIEW_SERVICE.md docs/MILESTONE_PLAN.md review-service/README.md
git commit -m "Document review service operational hardening"
```

---

### Task 4: Full verification and PR creation

**Files:**
- No source files expected.
- May create PR through `gh` if installed and authenticated.

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: PR URL and review prompt.

- [ ] **Step 1: Run full verification**

Run each command from the repository root:

```bash
python3 -m pytest review-service/tests -q
npm test -- --run
npm run build
npm run test:e2e
```

Expected:

- Backend tests pass.
- Vitest tests pass.
- Production build succeeds.
- Playwright E2E passes.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short --branch
```

Expected: clean working tree on the Milestone 16 branch, not `main`.

- [ ] **Step 3: Push branch and create PR**

If currently on `main`, create a branch before pushing:

```bash
git switch -c codex/milestone-16-review-service-operational-hardening
```

Push:

```bash
git push -u origin codex/milestone-16-review-service-operational-hardening
```

Create PR:

```bash
gh pr create \
  --base main \
  --head codex/milestone-16-review-service-operational-hardening \
  --title "Milestone 16: Review-service operational hardening" \
  --body "$(cat <<'EOF'
## Summary
- harden review-service operational config parsing for upload limits and review timeout
- expose only safe readiness/limit diagnostics through `/config`
- document responsible deployment controls for proxy limits, timeouts, concurrency, and local Ollama latency

## Verification
- `python3 -m pytest review-service/tests -q`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`
EOF
)"
```

- [ ] **Step 4: Write reviewer prompt**

Use this structure, filling in the actual PR URL and verification output:

```md
You are reviewing PR <PR_URL> for `nikolaisalazar/presume`.

Focus: Milestone 16, Review-Service Operational Hardening.

Review rigorously for:
- preserved API contracts: `POST /reviews` multipart field `file`, safe `GET /config`, fixed normalized errors;
- no leakage of filesystem paths, env values, secrets, prompts, provider responses, adapter exception text, stack traces, or raw resume contents;
- bounded and documented `MAX_UPLOAD_BYTES` and `REVIEW_TIMEOUT_SECONDS` behavior;
- deterministic tests that do not require Ollama, `vendor/hiring-agent`, hosted credentials, or network;
- no broad UI polish, review UX redesign, auth/database/queue/dashboard scope creep, or hosted-provider expansion;
- docs accuracy around local Ollama latency, proxy upload limits, worker/process sizing, timeout expectations, and external rate/concurrency limits;
- Milestone 13 and 15 contracts remaining intact, especially `/presume/` base-path E2E loading and multipart review upload validation.

Run or inspect evidence for:
- `python3 -m pytest review-service/tests -q`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e`

Please identify concrete blocking issues first, then non-blocking suggestions. For each issue, cite exact files/lines and explain the user-visible or operational risk.
```

- [ ] **Step 5: Commit any PR metadata changes only if needed**

No commit is expected for PR creation itself. If generated artifacts such as `test-results/` appear, remove them:

```bash
rm -rf test-results
```
