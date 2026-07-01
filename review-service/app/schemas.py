from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ReviewTier = Literal["strong", "competitive", "needs_work", "incomplete"]
ReviewCategoryKey = Literal[
    "open_source", "self_projects", "production", "technical_skills"
]
ReviewAnnotationSeverity = Literal["info", "warning", "strong"]
ReviewErrorCode = Literal[
    "invalid_upload",
    "upload_too_large",
    "pdf_parse_failed",
    "llm_provider_unavailable",
    "github_rate_limited",
    "hiring_agent_failed",
    "review_timeout",
    "internal_error",
]


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class ReviewCategory(StrictSchema):
    key: ReviewCategoryKey
    label: str
    score: float
    maxScore: float
    evidence: list[str]
    suggestions: list[str]


class ReviewAdjustment(StrictSchema):
    label: str
    points: float
    evidence: str | None = None


class ReviewAnnotation(StrictSchema):
    id: str
    categoryKey: ReviewCategoryKey | None = None
    sectionTitle: str | None = None
    entryTitle: str | None = None
    bulletText: str | None = None
    message: str
    severity: ReviewAnnotationSeverity


class ReviewResult(StrictSchema):
    id: str
    reviewedAt: str
    totalScore: float
    maxScore: float
    tier: ReviewTier
    categories: list[ReviewCategory]
    strengths: list[str]
    improvements: list[str]
    bonuses: list[ReviewAdjustment]
    deductions: list[ReviewAdjustment]
    annotations: list[ReviewAnnotation]
    raw: Any | None = None


class HealthResponse(StrictSchema):
    status: Literal["ok"]


class PublicConfig(StrictSchema):
    reviewEnabled: bool
    llmProvider: str
    defaultModel: str
    githubEnrichmentEnabled: bool
    maxUploadBytes: int = Field(gt=0)


class ErrorBody(StrictSchema):
    code: ReviewErrorCode
    message: str
    requestId: str


class ErrorResponse(StrictSchema):
    error: ErrorBody
