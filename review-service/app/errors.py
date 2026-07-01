from dataclasses import dataclass
from uuid import uuid4

from .schemas import ErrorResponse, ReviewErrorCode


SAFE_ERROR_MESSAGES: dict[ReviewErrorCode, str] = {
    "invalid_upload": "Upload must be a PDF.",
    "upload_too_large": "Upload exceeds the review service size limit.",
    "pdf_parse_failed": "Could not read the uploaded PDF.",
    "llm_provider_unavailable": "Review provider is unavailable.",
    "github_rate_limited": "GitHub enrichment is rate limited.",
    "hiring_agent_failed": "Resume review failed.",
    "review_timeout": "Review request timed out.",
    "internal_error": "Review service failed.",
}


@dataclass
class ReviewServiceError(Exception):
    code: ReviewErrorCode
    message: str | None = None
    status_code: int = 500

    def safe_message(self) -> str:
        return SAFE_ERROR_MESSAGES[self.code]


def make_request_id() -> str:
    return f"req_{uuid4().hex[:12]}"


def make_error_response(error: ReviewServiceError, request_id: str) -> ErrorResponse:
    return ErrorResponse(
        error={
            "code": error.code,
            "message": error.safe_message(),
            "requestId": request_id,
        }
    )
