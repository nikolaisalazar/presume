from pathlib import Path

from fastapi.testclient import TestClient

from app.config import (
    DEFAULT_MAX_UPLOAD_BYTES,
    DEFAULT_REVIEW_TIMEOUT_SECONDS,
    MAX_ALLOWED_UPLOAD_BYTES,
    MAX_REVIEW_TIMEOUT_SECONDS,
    MIN_ALLOWED_UPLOAD_BYTES,
    MIN_REVIEW_TIMEOUT_SECONDS,
    load_settings,
    parse_max_upload_bytes,
    parse_review_timeout_seconds,
    resolve_hiring_agent_path,
)
from app.main import create_app


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


def test_health_returns_ok():
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_config_uses_safe_defaults_and_hides_secrets(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "gemma3:4b")
    monkeypatch.setenv("GEMINI_API_KEY", "secret-gemini-key")
    monkeypatch.setenv("GITHUB_TOKEN", "secret-github-token")
    monkeypatch.setenv("HIRING_AGENT_PATH", "/private/vendor/hiring-agent")

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json() == {
        "reviewEnabled": False,
        "llmProvider": "ollama",
        "defaultModel": "gemma3:4b",
        "githubEnrichmentEnabled": True,
        "maxUploadBytes": 26_214_400,
        "reviewReadiness": "unavailable",
        "reviewReadinessReason": "missing_hiring_agent",
        "reviewTimeoutSeconds": 360,
    }
    serialized = response.text
    assert "secret" not in serialized
    assert "private" not in serialized
    assert "hiring-agent" not in serialized


def test_config_defaults_to_local_ollama_with_review_disabled_without_hiring_agent(
    monkeypatch, tmp_path
):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("DEFAULT_MODEL", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.setenv(
        "HIRING_AGENT_PATH", str(tmp_path / "missing-hiring-agent")
    )

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    config = response.json()
    assert config["reviewEnabled"] is False
    assert config["llmProvider"] == "ollama"
    assert config["defaultModel"] == "gemma3:4b"
    assert config["githubEnrichmentEnabled"] is False


def test_default_upload_limit_covers_browser_generated_review_pdf(monkeypatch):
    monkeypatch.delenv("MAX_UPLOAD_BYTES", raising=False)

    settings = load_settings()

    assert settings.max_upload_bytes == 25 * 1024 * 1024


def test_upload_limit_parser_rejects_invalid_and_clamps_bounds():
    assert parse_max_upload_bytes(None) == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("not-a-number") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("0") == DEFAULT_MAX_UPLOAD_BYTES
    assert parse_max_upload_bytes("-1") == DEFAULT_MAX_UPLOAD_BYTES
    assert (
        parse_max_upload_bytes(str(MIN_ALLOWED_UPLOAD_BYTES - 1))
        == MIN_ALLOWED_UPLOAD_BYTES
    )
    assert parse_max_upload_bytes(str(MIN_ALLOWED_UPLOAD_BYTES)) == MIN_ALLOWED_UPLOAD_BYTES
    assert (
        parse_max_upload_bytes(str(MAX_ALLOWED_UPLOAD_BYTES + 1))
        == MAX_ALLOWED_UPLOAD_BYTES
    )
    assert parse_max_upload_bytes(str(MAX_ALLOWED_UPLOAD_BYTES)) == MAX_ALLOWED_UPLOAD_BYTES


def test_review_timeout_parser_rejects_invalid_and_clamps_bounds():
    assert parse_review_timeout_seconds(None) == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("not-a-number") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("0") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert parse_review_timeout_seconds("-1") == DEFAULT_REVIEW_TIMEOUT_SECONDS
    assert (
        parse_review_timeout_seconds(str(MIN_REVIEW_TIMEOUT_SECONDS - 1))
        == MIN_REVIEW_TIMEOUT_SECONDS
    )
    assert (
        parse_review_timeout_seconds(str(MIN_REVIEW_TIMEOUT_SECONDS))
        == MIN_REVIEW_TIMEOUT_SECONDS
    )
    assert (
        parse_review_timeout_seconds(str(MAX_REVIEW_TIMEOUT_SECONDS + 1))
        == MAX_REVIEW_TIMEOUT_SECONDS
    )
    assert (
        parse_review_timeout_seconds(str(MAX_REVIEW_TIMEOUT_SECONDS))
        == MAX_REVIEW_TIMEOUT_SECONDS
    )


def test_default_cors_allows_localhost_vite_origin(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    client = TestClient(create_app())

    response = client.options(
        "/reviews",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:5173"
    )


def test_default_cors_allows_127_loopback_vite_origin(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    client = TestClient(create_app())

    response = client.options(
        "/reviews",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://127.0.0.1:5173"
    )


def test_default_cors_rejects_unconfigured_origin(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    client = TestClient(create_app())

    response = client.options(
        "/reviews",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_config_enables_review_when_local_provider_and_hiring_agent_exist(
    monkeypatch, tmp_path
):
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
    assert body["llmProvider"] == "ollama"
    assert body["defaultModel"] == "gemma3:4b"
    assert str(hiring_agent_path) not in response.text


def test_default_hiring_agent_path_resolves_from_repository_root(monkeypatch):
    monkeypatch.delenv("HIRING_AGENT_PATH", raising=False)

    settings = load_settings()

    assert settings.hiring_agent_path == "vendor/hiring-agent"
    assert resolve_hiring_agent_path(settings.hiring_agent_path) == (
        REPOSITORY_ROOT / "vendor" / "hiring-agent"
    )


def test_absolute_hiring_agent_path_resolves_without_rebasing(tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"

    assert resolve_hiring_agent_path(str(hiring_agent_path)) == hiring_agent_path


def test_relative_vendor_hiring_agent_path_resolves_from_repository_root():
    assert resolve_hiring_agent_path("vendor/hiring-agent") == (
        REPOSITORY_ROOT / "vendor" / "hiring-agent"
    )


def test_parent_relative_hiring_agent_path_can_resolve_from_service_cwd(
    monkeypatch, tmp_path
):
    service_dir = tmp_path / "repo" / "review-service"
    hiring_agent_path = tmp_path / "repo" / "vendor" / "hiring-agent"
    service_dir.mkdir(parents=True)
    hiring_agent_path.mkdir(parents=True)
    monkeypatch.chdir(service_dir)

    assert resolve_hiring_agent_path("../vendor/hiring-agent") == (
        hiring_agent_path.resolve()
    )


def test_config_does_not_enable_review_for_file_at_hiring_agent_path(
    monkeypatch, tmp_path
):
    hiring_agent_file = tmp_path / "hiring-agent"
    hiring_agent_file.write_text("not a checkout")
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "gemma3:4b")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_file))

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json()["reviewEnabled"] is False
    assert str(hiring_agent_file) not in response.text


def test_config_sanitizes_unsafe_provider_and_model_values(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "sk-secret-provider")
    monkeypatch.setenv("DEFAULT_MODEL", "/Users/name/.config/secret-model")
    monkeypatch.setenv("GEMINI_API_KEY", "sk-secret-key")
    monkeypatch.setenv("GITHUB_TOKEN", "ghp_secret-token")

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is False
    assert body["llmProvider"] == "disabled"
    assert body["defaultModel"] == "unavailable"
    serialized = response.text
    assert "sk-secret" not in serialized
    assert "/Users" not in serialized
    assert "secret-model" not in serialized
    assert "ghp_" not in serialized


def test_config_disables_gemini_without_key(monkeypatch, tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("DEFAULT_MODEL", "gemini-2.5-flash")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json()["reviewEnabled"] is False
    assert response.json()["llmProvider"] == "gemini"
    assert response.json()["defaultModel"] == "gemini-2.5-flash"


def test_config_enables_gemini_with_key_and_hiring_agent_without_exposing_key(
    monkeypatch, tmp_path
):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("DEFAULT_MODEL", "gemini-2.5-flash")
    monkeypatch.setenv("GEMINI_API_KEY", "sk-secret-gemini-key")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is True
    assert body["llmProvider"] == "gemini"
    assert body["defaultModel"] == "gemini-2.5-flash"
    assert "sk-secret" not in response.text
    assert str(hiring_agent_path) not in response.text


def test_config_replaces_unsupported_gemini_model_with_upstream_supported_default(
    monkeypatch, tmp_path
):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("DEFAULT_MODEL", "gemini-1.5-flash")
    monkeypatch.setenv("GEMINI_API_KEY", "sk-secret-gemini-key")
    monkeypatch.setenv("HIRING_AGENT_PATH", str(hiring_agent_path))

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    body = response.json()
    assert body["reviewEnabled"] is True
    assert body["llmProvider"] == "gemini"
    assert body["defaultModel"] == "gemini-2.5-flash"
    assert "gemini-1.5-flash" not in response.text


def test_config_replaces_arbitrary_model_env_value(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "sk-secret-model-name")

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json()["defaultModel"] == "gemma3:4b"
    assert "sk-secret-model-name" not in response.text


def test_config_reports_safe_missing_hiring_agent_readiness_without_path(
    monkeypatch, tmp_path
):
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
