import math

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from app.errors import ReviewServiceError
from app.main import create_app
from app.schemas import ReviewResult


class SuccessfulAdapter:
    async def review_pdf(self, pdf_bytes: bytes) -> ReviewResult:
        assert pdf_bytes.startswith(b"%PDF")
        return ReviewResult(
            id="review_test",
            reviewedAt="2026-07-01T12:00:00Z",
            totalScore=72,
            maxScore=100,
            tier="competitive",
            categories=[
                {
                    "key": "technical_skills",
                    "label": "Technical Skills",
                    "score": 18,
                    "maxScore": 25,
                    "evidence": ["Python and React experience are visible."],
                    "suggestions": ["Quantify the production impact."],
                }
            ],
            strengths=["Clear project ownership."],
            improvements=["Add more measurable outcomes."],
            bonuses=[],
            deductions=[],
            annotations=[
                {
                    "id": "ann_test",
                    "categoryKey": "technical_skills",
                    "sectionTitle": "Experience",
                    "entryTitle": "Software Engineer",
                    "bulletText": "Built review tooling.",
                    "message": "Good technical evidence.",
                    "severity": "strong",
                }
            ],
            raw={"source": "mock"},
        )


class FailingAdapter:
    def __init__(self, error: ReviewServiceError):
        self.error = error

    async def review_pdf(self, pdf_bytes: bytes) -> ReviewResult:
        raise self.error


class UnexpectedFailingAdapter:
    async def review_pdf(self, pdf_bytes: bytes) -> ReviewResult:
        raise RuntimeError(
            "provider failed with sk-secret-token at /Users/name/resume.pdf"
        )


def test_reviews_rejects_non_pdf_upload():
    client = TestClient(create_app(adapter=SuccessfulAdapter()))

    response = client.post(
        "/reviews",
        files={"file": ("resume.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    body = response.json()
    assert body["error"]["code"] == "invalid_upload"
    assert body["error"]["message"] == "Upload must be a PDF."
    assert body["error"]["requestId"].startswith("req_")


def test_reviews_returns_normalized_result_for_mocked_success():
    client = TestClient(create_app(adapter=SuccessfulAdapter()))

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\n%%EOF", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "review_test",
        "reviewedAt": "2026-07-01T12:00:00Z",
        "totalScore": 72.0,
        "maxScore": 100.0,
        "tier": "competitive",
        "categories": [
            {
                "key": "technical_skills",
                "label": "Technical Skills",
                "score": 18.0,
                "maxScore": 25.0,
                "evidence": ["Python and React experience are visible."],
                "suggestions": ["Quantify the production impact."],
            }
        ],
        "strengths": ["Clear project ownership."],
        "improvements": ["Add more measurable outcomes."],
        "bonuses": [],
        "deductions": [],
        "annotations": [
            {
                "id": "ann_test",
                "categoryKey": "technical_skills",
                "sectionTitle": "Experience",
                "entryTitle": "Software Engineer",
                "bulletText": "Built review tooling.",
                "message": "Good technical evidence.",
                "severity": "strong",
            }
        ],
        "raw": {"source": "mock"},
    }


def test_adapter_failures_map_to_documented_error_codes():
    client = TestClient(
        create_app(
            adapter=FailingAdapter(
                ReviewServiceError(
                    code="hiring_agent_failed",
                    message="internal safe-looking message should not be public",
                    status_code=502,
                )
            )
        )
    )

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\n%%EOF", "application/pdf")},
    )

    assert response.status_code == 502
    body = response.json()
    assert body["error"]["code"] == "hiring_agent_failed"
    assert body["error"]["message"] == "Resume review failed."
    assert body["error"]["requestId"].startswith("req_")


def test_error_response_does_not_expose_leaky_adapter_message():
    client = TestClient(
        create_app(
            adapter=FailingAdapter(
                ReviewServiceError(
                    code="hiring_agent_failed",
                    message="provider failed: sk-secret at /Users/name/resume.pdf",
                    status_code=502,
                )
            )
        )
    )

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\n%%EOF", "application/pdf")},
    )

    assert response.status_code == 502
    serialized = response.text
    assert response.json()["error"]["message"] == "Resume review failed."
    assert "sk-secret" not in serialized
    assert "/Users/name" not in serialized
    assert "resume.pdf" not in serialized


def test_unexpected_errors_return_safe_internal_error_without_details():
    client = TestClient(
        create_app(adapter=UnexpectedFailingAdapter()),
        raise_server_exceptions=False,
    )

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\n%%EOF", "application/pdf")},
    )

    assert response.status_code == 500
    body = response.json()
    assert body["error"]["code"] == "internal_error"
    assert body["error"]["message"] == "Review service failed."
    assert body["error"]["requestId"].startswith("req_")
    serialized = response.text
    assert "sk-secret-token" not in serialized
    assert "/Users/name" not in serialized
    assert "resume.pdf" not in serialized
    assert "RuntimeError" not in serialized


def test_review_timeout_maps_to_timeout_error():
    client = TestClient(
        create_app(
            adapter=FailingAdapter(
                ReviewServiceError(
                    code="review_timeout",
                    message="Review request timed out.",
                    status_code=504,
                )
            )
        )
    )

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\n%%EOF", "application/pdf")},
    )

    assert response.status_code == 504
    body = response.json()
    assert body["error"]["code"] == "review_timeout"
    assert body["error"]["message"] == "Review request timed out."


def test_upload_size_limit_is_enforced_while_reading():
    client = TestClient(
        create_app(
            settings=Settings(
                llm_provider="ollama",
                default_model="gemma3:4b",
                gemini_api_key="",
                github_token="",
                cors_origins=("http://localhost:5173",),
                hiring_agent_path="../vendor/hiring-agent",
                max_upload_bytes=8,
            ),
            adapter=SuccessfulAdapter(),
        )
    )

    response = client.post(
        "/reviews",
        files={"file": ("resume.pdf", b"%PDF-1.7\nmore-bytes", "application/pdf")},
    )

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "upload_too_large"
    assert (
        response.json()["error"]["message"]
        == "Upload exceeds the review service size limit."
    )


def test_review_result_rejects_non_finite_scores():
    with pytest.raises(ValidationError):
        ReviewResult(
            id="review_bad",
            reviewedAt="2026-07-01T12:00:00Z",
            totalScore=math.inf,
            maxScore=100,
            tier="competitive",
            categories=[],
            strengths=[],
            improvements=[],
            bonuses=[],
            deductions=[],
            annotations=[],
            raw={},
        )
