from fastapi.testclient import TestClient

from app.main import create_app


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
        "maxUploadBytes": 10_485_760,
    }
    serialized = response.text
    assert "secret" not in serialized
    assert "private" not in serialized
    assert "hiring-agent" not in serialized


def test_config_defaults_to_local_ollama_with_review_disabled_without_hiring_agent(
    monkeypatch,
):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.delenv("DEFAULT_MODEL", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    config = response.json()
    assert config["reviewEnabled"] is False
    assert config["llmProvider"] == "ollama"
    assert config["defaultModel"] == "gemma3:4b"
    assert config["githubEnrichmentEnabled"] is False


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


def test_config_disables_gemini_without_key(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    monkeypatch.setenv("DEFAULT_MODEL", "gemini-1.5-flash")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json()["reviewEnabled"] is False
    assert response.json()["llmProvider"] == "gemini"
    assert response.json()["defaultModel"] == "gemini-1.5-flash"


def test_config_enables_gemini_with_key_and_hiring_agent_without_exposing_key(
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
    assert body["defaultModel"] == "gemini-1.5-flash"
    assert "sk-secret" not in response.text
    assert str(hiring_agent_path) not in response.text


def test_config_replaces_arbitrary_model_env_value(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "ollama")
    monkeypatch.setenv("DEFAULT_MODEL", "sk-secret-model-name")

    client = TestClient(create_app())

    response = client.get("/config")

    assert response.status_code == 200
    assert response.json()["defaultModel"] == "gemma3:4b"
    assert "sk-secret-model-name" not in response.text
