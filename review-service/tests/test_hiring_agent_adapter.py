import pytest

from app.config import Settings
from app.errors import ReviewServiceError
from app.hiring_agent_adapter import HiringAgentAdapter


def make_settings(hiring_agent_path: str) -> Settings:
    return Settings(
        llm_provider="ollama",
        default_model="gemma3:4b",
        gemini_api_key="",
        github_token="",
        cors_origins=("http://localhost:5173",),
        hiring_agent_path=hiring_agent_path,
        max_upload_bytes=10_485_760,
    )


def write_fake_hiring_agent(path, score_py: str) -> None:
    path.mkdir()
    (path / "score.py").write_text(score_py, encoding="utf-8")


@pytest.mark.anyio
async def test_adapter_maps_hiring_agent_success_to_review_result(tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    write_fake_hiring_agent(
        hiring_agent_path,
        """
class FakeEvaluation:
    def model_dump(self):
        return {
            "scores": {
                "open_source": {
                    "score": 12,
                    "max": 35,
                    "evidence": "Contributed small fixes to community tools.",
                },
                "self_projects": {
                    "score": 28,
                    "max": 30,
                    "evidence": "Built deployed projects with clear ownership.",
                },
                "production": {
                    "score": 20,
                    "max": 25,
                    "evidence": "Shipped production features during internships.",
                },
                "technical_skills": {
                    "score": 9,
                    "max": 10,
                    "evidence": "Python, TypeScript, React, and backend APIs.",
                },
            },
            "bonus_points": {
                "total": 4,
                "breakdown": "Strong technical writing and public demos.",
            },
            "deductions": {
                "total": 2,
                "reasons": "Some project links lack live demos.",
            },
            "key_strengths": [
                "Clear project ownership.",
                "Strong full-stack technical breadth.",
            ],
            "areas_for_improvement": [
                "Add more metrics to production bullets.",
                "Clarify open source impact.",
            ],
        }


def main(pdf_path):
    with open(pdf_path, "rb") as pdf_file:
        assert pdf_file.read().startswith(b"%PDF")
    return FakeEvaluation()
""",
    )
    adapter = HiringAgentAdapter(make_settings(str(hiring_agent_path)))

    result = await adapter.review_pdf(b"%PDF-1.7\n%%EOF")

    assert result.id.startswith("review_")
    assert result.totalScore == 71
    assert result.maxScore == 100
    assert result.tier == "competitive"
    assert [category.model_dump() for category in result.categories] == [
        {
            "key": "open_source",
            "label": "Open Source",
            "score": 12.0,
            "maxScore": 35.0,
            "evidence": ["Contributed small fixes to community tools."],
            "suggestions": [],
        },
        {
            "key": "self_projects",
            "label": "Self Projects",
            "score": 28.0,
            "maxScore": 30.0,
            "evidence": ["Built deployed projects with clear ownership."],
            "suggestions": [],
        },
        {
            "key": "production",
            "label": "Production Experience",
            "score": 20.0,
            "maxScore": 25.0,
            "evidence": ["Shipped production features during internships."],
            "suggestions": [],
        },
        {
            "key": "technical_skills",
            "label": "Technical Skills",
            "score": 9.0,
            "maxScore": 10.0,
            "evidence": ["Python, TypeScript, React, and backend APIs."],
            "suggestions": [],
        },
    ]
    assert result.strengths == [
        "Clear project ownership.",
        "Strong full-stack technical breadth.",
    ]
    assert result.improvements == [
        "Add more metrics to production bullets.",
        "Clarify open source impact.",
    ]
    assert [bonus.model_dump() for bonus in result.bonuses] == [
        {
            "label": "Bonus points",
            "points": 4.0,
            "evidence": "Strong technical writing and public demos.",
        }
    ]
    assert [deduction.model_dump() for deduction in result.deductions] == [
        {
            "label": "Deductions",
            "points": 2.0,
            "evidence": "Some project links lack live demos.",
        }
    ]
    assert result.annotations == []
    assert result.raw == {"source": "hiring-agent"}


@pytest.mark.anyio
async def test_adapter_maps_upstream_failure_to_safe_error(tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    write_fake_hiring_agent(
        hiring_agent_path,
        """
def main(pdf_path):
    raise RuntimeError("provider leaked sk-secret-token from /Users/name/resume.pdf")
""",
    )
    adapter = HiringAgentAdapter(make_settings(str(hiring_agent_path)))

    with pytest.raises(ReviewServiceError) as exc:
        await adapter.review_pdf(b"%PDF-1.7\n%%EOF")

    assert exc.value.code == "hiring_agent_failed"
    assert exc.value.status_code == 502


@pytest.mark.anyio
async def test_adapter_maps_subprocess_timeout_to_safe_timeout(monkeypatch, tmp_path):
    hiring_agent_path = tmp_path / "hiring-agent"
    write_fake_hiring_agent(hiring_agent_path, "def main(pdf_path): return None")
    adapter = HiringAgentAdapter(make_settings(str(hiring_agent_path)))

    async def raise_timeout(pdf_bytes):
        raise TimeoutError

    monkeypatch.setattr(adapter, "_run_hiring_agent", raise_timeout)

    with pytest.raises(ReviewServiceError) as exc:
        await adapter.review_pdf(b"%PDF-1.7\n%%EOF")

    assert exc.value.code == "review_timeout"
    assert exc.value.status_code == 504
