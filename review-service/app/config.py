import os
from dataclasses import dataclass

from .schemas import PublicConfig


DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
LOCAL_PROVIDER = "ollama"
DISABLED_PROVIDER = "disabled"
DISABLED_MODEL = "unavailable"
DEFAULT_OLLAMA_MODEL = "gemma3:4b"

ALLOWED_PROVIDERS = {LOCAL_PROVIDER, "gemini"}
ALLOWED_MODELS_BY_PROVIDER = {
    LOCAL_PROVIDER: {DEFAULT_OLLAMA_MODEL},
    "gemini": {"gemini-1.5-flash"},
}


@dataclass(frozen=True)
class Settings:
    llm_provider: str
    default_model: str
    gemini_api_key: str
    github_token: str
    cors_origins: tuple[str, ...]
    hiring_agent_path: str
    max_upload_bytes: int

    @property
    def review_enabled(self) -> bool:
        provider = self.public_provider
        if provider == LOCAL_PROVIDER:
            return True
        if provider == "gemini":
            return bool(self.gemini_api_key)
        return False

    @property
    def github_enrichment_enabled(self) -> bool:
        return bool(self.github_token)

    @property
    def public_provider(self) -> str:
        provider = self.llm_provider.strip().lower()
        return provider if provider in ALLOWED_PROVIDERS else DISABLED_PROVIDER

    @property
    def public_model(self) -> str:
        provider = self.public_provider
        if provider == DISABLED_PROVIDER:
            return DISABLED_MODEL

        model = self.default_model.strip()
        allowed_models = ALLOWED_MODELS_BY_PROVIDER[provider]
        if model in allowed_models:
            return model

        if provider == LOCAL_PROVIDER:
            return DEFAULT_OLLAMA_MODEL

        return sorted(allowed_models)[0]

    def public_config(self) -> PublicConfig:
        return PublicConfig(
            reviewEnabled=self.review_enabled,
            llmProvider=self.public_provider,
            defaultModel=self.public_model,
            githubEnrichmentEnabled=self.github_enrichment_enabled,
            maxUploadBytes=self.max_upload_bytes,
        )


def load_settings() -> Settings:
    return Settings(
        llm_provider=os.getenv("LLM_PROVIDER", LOCAL_PROVIDER).strip()
        or LOCAL_PROVIDER,
        default_model=os.getenv("DEFAULT_MODEL", DEFAULT_OLLAMA_MODEL).strip()
        or DEFAULT_OLLAMA_MODEL,
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        github_token=os.getenv("GITHUB_TOKEN", ""),
        cors_origins=parse_cors_origins(
            os.getenv("CORS_ORIGINS", "http://localhost:5173")
        ),
        hiring_agent_path=os.getenv("HIRING_AGENT_PATH", "../vendor/hiring-agent"),
        max_upload_bytes=parse_max_upload_bytes(os.getenv("MAX_UPLOAD_BYTES")),
    )


def parse_cors_origins(value: str) -> tuple[str, ...]:
    origins = tuple(origin.strip() for origin in value.split(",") if origin.strip())
    return origins or ("http://localhost:5173",)


def parse_max_upload_bytes(value: str | None) -> int:
    if value is None or not value.strip():
        return DEFAULT_MAX_UPLOAD_BYTES

    try:
        parsed = int(value)
    except ValueError:
        return DEFAULT_MAX_UPLOAD_BYTES

    return parsed if parsed > 0 else DEFAULT_MAX_UPLOAD_BYTES
