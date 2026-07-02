import math
import subprocess

import pytest

from app.config import Settings
from app.errors import ReviewServiceError
from app.hiring_agent_adapter import (
    SUBPROCESS_TIMEOUT_SECONDS,
    HiringAgentAdapter,
    normalize_hiring_agent_output,
)


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


def hiring_agent_output(**overrides):
    category_scores = {
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
    }
    output = {
        "scores": category_scores,
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
    output.update(overrides)
    return output


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
async def test_adapter_disables_hiring_agent_development_mode_before_score_import(
    tmp_path,
):
    hiring_agent_path = tmp_path / "hiring-agent"
    hiring_agent_path.mkdir()
    (hiring_agent_path / "config.py").write_text(
        "DEVELOPMENT_MODE = True\n",
        encoding="utf-8",
    )
    (hiring_agent_path / "github.py").write_text(
        """
from config import DEVELOPMENT_MODE
from pathlib import Path


def maybe_write_cache():
    if DEVELOPMENT_MODE:
        Path("cache").mkdir(exist_ok=True)
        Path("cache/githubcache_resume.json").write_text("cached resume data")
""",
        encoding="utf-8",
    )
    (hiring_agent_path / "score.py").write_text(
        """
from config import DEVELOPMENT_MODE
import github


class FakeEvaluation:
    def model_dump(self):
        return {
            "scores": {
                "open_source": {"score": 1, "max": 35, "evidence": "Evidence."},
                "self_projects": {"score": 2, "max": 30, "evidence": "Evidence."},
                "production": {"score": 3, "max": 25, "evidence": "Evidence."},
                "technical_skills": {"score": 4, "max": 10, "evidence": "Evidence."},
            },
            "bonus_points": {"total": 0, "breakdown": ""},
            "deductions": {"total": 0, "reasons": ""},
            "key_strengths": ["Strength."],
            "areas_for_improvement": ["Improvement."],
        }


def main(pdf_path):
    if DEVELOPMENT_MODE or github.DEVELOPMENT_MODE:
        github.maybe_write_cache()
    return FakeEvaluation()
""",
        encoding="utf-8",
    )
    adapter = HiringAgentAdapter(make_settings(str(hiring_agent_path)))

    await adapter.review_pdf(b"%PDF-1.7\n%%EOF")

    assert not (hiring_agent_path / "cache").exists()


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

    def raise_timeout(*args, **kwargs):
        assert kwargs["timeout"] == SUBPROCESS_TIMEOUT_SECONDS
        assert kwargs["timeout"] < 60
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=kwargs["timeout"])

    monkeypatch.setattr("app.hiring_agent_adapter.subprocess.run", raise_timeout)

    with pytest.raises(ReviewServiceError) as exc:
        await adapter.review_pdf(b"%PDF-1.7\n%%EOF")

    assert exc.value.code == "review_timeout"
    assert exc.value.status_code == 504


def test_normalize_clamps_category_scores_to_valid_range():
    output = hiring_agent_output()
    output["scores"]["open_source"]["score"] = -10
    output["scores"]["self_projects"]["score"] = 999

    result = normalize_hiring_agent_output(output)

    categories = {category.key: category for category in result.categories}
    assert categories["open_source"].score == 0
    assert categories["self_projects"].score == 30
    assert result.totalScore == 61
    assert result.maxScore == 100


@pytest.mark.parametrize("category_max", [0, -1])
def test_normalize_rejects_non_positive_category_max(category_max):
    output = hiring_agent_output()
    output["scores"]["open_source"]["max"] = category_max

    with pytest.raises(ReviewServiceError) as exc:
        normalize_hiring_agent_output(output)

    assert exc.value.code == "hiring_agent_failed"


def test_normalize_clamps_bonus_to_expected_range_and_matches_total_math():
    output = hiring_agent_output()
    output["bonus_points"]["total"] = 99

    result = normalize_hiring_agent_output(output)

    assert result.totalScore == 87
    assert [bonus.model_dump() for bonus in result.bonuses] == [
        {
            "label": "Bonus points",
            "points": 20.0,
            "evidence": "Strong technical writing and public demos.",
        }
    ]


def test_normalize_clamps_negative_bonus_and_deduction_to_zero():
    output = hiring_agent_output()
    output["bonus_points"]["total"] = -5
    output["deductions"]["total"] = -7

    result = normalize_hiring_agent_output(output)

    assert result.totalScore == 69
    assert result.bonuses == []
    assert result.deductions == []


@pytest.mark.parametrize(
    "path,value",
    [
        (("scores", "open_source", "score"), math.inf),
        (("scores", "open_source", "max"), math.nan),
        (("bonus_points", "total"), math.inf),
        (("deductions", "total"), math.nan),
    ],
)
def test_normalize_rejects_non_finite_values(path, value):
    output = hiring_agent_output()
    target = output
    for key in path[:-1]:
        target = target[key]
    target[path[-1]] = value

    with pytest.raises(ReviewServiceError) as exc:
        normalize_hiring_agent_output(output)

    assert exc.value.code == "hiring_agent_failed"


def test_normalize_tolerates_missing_optional_fields():
    output = hiring_agent_output(
        bonus_points={},
        deductions={},
    )
    output.pop("key_strengths")
    output.pop("areas_for_improvement")

    result = normalize_hiring_agent_output(output)

    assert result.totalScore == 69
    assert result.strengths == []
    assert result.improvements == []
    assert result.bonuses == []
    assert result.deductions == []
