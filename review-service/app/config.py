import os
from dataclasses import dataclass
from pathlib import Path

from .schemas import PublicConfig


DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024
MIN_ALLOWED_UPLOAD_BYTES = 1024 * 1024
MAX_ALLOWED_UPLOAD_BYTES = 100 * 1024 * 1024
DEFAULT_REVIEW_TIMEOUT_SECONDS = 360
MIN_REVIEW_TIMEOUT_SECONDS = 60
MAX_REVIEW_TIMEOUT_SECONDS = 900
DEFAULT_HIRING_AGENT_PATH = "vendor/hiring-agent"
DEFAULT_CORS_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")
LOCAL_PROVIDER = "ollama"
DISABLED_PROVIDER = "disabled"
DISABLED_MODEL = "unavailable"
DEFAULT_OLLAMA_MODEL = "gemma3:4b"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

ALLOWED_PROVIDERS = {LOCAL_PROVIDER, "gemini"}
ALLOWED_MODELS_BY_PROVIDER = {
    LOCAL_PROVIDER: {DEFAULT_OLLAMA_MODEL},
    "gemini": {
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        DEFAULT_GEMINI_MODEL,
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
    },
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
    review_timeout_seconds: int

    @property
    def review_enabled(self) -> bool:
        if not self.hiring_agent_available:
            return False

        provider = self.public_provider
        if provider == LOCAL_PROVIDER:
            return True
        if provider == "gemini":
            return bool(self.gemini_api_key)
        return False

    @property
    def hiring_agent_available(self) -> bool:
        return resolve_hiring_agent_path(self.hiring_agent_path).is_dir()

    @property
    def github_enrichment_enabled(self) -> bool:
        return bool(self.github_token)

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

        return DEFAULT_GEMINI_MODEL

    def public_config(self) -> PublicConfig:
        return PublicConfig(
            reviewEnabled=self.review_enabled,
            llmProvider=self.public_provider,
            defaultModel=self.public_model,
            githubEnrichmentEnabled=self.github_enrichment_enabled,
            maxUploadBytes=self.max_upload_bytes,
            reviewReadiness=self.readiness_state,
            reviewReadinessReason=self.readiness_reason,
            reviewTimeoutSeconds=self.review_timeout_seconds,
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
            os.getenv("CORS_ORIGINS", ",".join(DEFAULT_CORS_ORIGINS))
        ),
        hiring_agent_path=os.getenv("HIRING_AGENT_PATH", DEFAULT_HIRING_AGENT_PATH),
        max_upload_bytes=parse_max_upload_bytes(os.getenv("MAX_UPLOAD_BYTES")),
        review_timeout_seconds=parse_review_timeout_seconds(
            os.getenv("REVIEW_TIMEOUT_SECONDS")
        ),
    )


def parse_cors_origins(value: str) -> tuple[str, ...]:
    origins = tuple(origin.strip() for origin in value.split(",") if origin.strip())
    return origins or DEFAULT_CORS_ORIGINS


def parse_max_upload_bytes(value: str | None) -> int:
    return parse_bounded_int(
        value,
        default=DEFAULT_MAX_UPLOAD_BYTES,
        minimum=MIN_ALLOWED_UPLOAD_BYTES,
        maximum=MAX_ALLOWED_UPLOAD_BYTES,
    )


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


def resolve_hiring_agent_path(value: str) -> Path:
    path = Path(value).expanduser()
    if path.is_absolute():
        return path

    repository_relative_path = (REPOSITORY_ROOT / path).resolve()
    if repository_relative_path.exists():
        return repository_relative_path

    cwd_relative_path = (Path.cwd() / path).resolve()
    if cwd_relative_path.exists():
        return cwd_relative_path

    return repository_relative_path
