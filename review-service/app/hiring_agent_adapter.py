import asyncio
import json
import math
import os
import subprocess
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from .config import Settings, resolve_hiring_agent_path
from .errors import ReviewServiceError
from .schemas import ReviewResult


SUBPROCESS_TIMEOUT_SECONDS = 55
SAFE_SUBPROCESS_ENV_KEYS = {
    "HOME",
    "LANG",
    "LC_ALL",
    "OLLAMA_HOST",
    "PATH",
    "SSL_CERT_DIR",
    "SSL_CERT_FILE",
    "TMPDIR",
}

CATEGORY_LABELS = {
    "open_source": "Open Source",
    "self_projects": "Self Projects",
    "production": "Production Experience",
    "technical_skills": "Technical Skills",
}


class HiringAgentAdapter:
    """Boundary around HackerRank Hiring Agent internals.

    The upstream project is expected at ``settings.hiring_agent_path``. This
    adapter intentionally keeps imports and provider failures away from routes
    so API errors stay normalized and secret-free.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    async def review_pdf(self, pdf_bytes: bytes) -> ReviewResult:
        if not self.settings.review_enabled:
            raise ReviewServiceError(
                code="llm_provider_unavailable",
                status_code=503,
            )

        try:
            return await asyncio.wait_for(
                self._run_hiring_agent(pdf_bytes), timeout=60
            )
        except TimeoutError:
            raise ReviewServiceError(
                code="review_timeout",
                status_code=504,
            ) from None
        except ReviewServiceError:
            raise
        except Exception as exc:
            raise ReviewServiceError(
                code="hiring_agent_failed",
                status_code=502,
            ) from exc

    async def _run_hiring_agent(self, pdf_bytes: bytes) -> ReviewResult:
        hiring_agent_path = resolve_hiring_agent_path(
            self.settings.hiring_agent_path
        )
        if not hiring_agent_path.is_dir():
            raise ReviewServiceError(
                code="hiring_agent_failed",
                status_code=502,
            )

        output = await asyncio.to_thread(
            self._execute_hiring_agent_subprocess,
            hiring_agent_path,
            pdf_bytes,
        )
        return normalize_hiring_agent_output(output)

    def _execute_hiring_agent_subprocess(
        self,
        hiring_agent_path: Path,
        pdf_bytes: bytes,
    ) -> dict[str, Any]:
        score_script = hiring_agent_path / "score.py"
        if not score_script.is_file():
            raise ReviewServiceError(
                code="hiring_agent_failed",
                status_code=502,
            )

        with tempfile.TemporaryDirectory(prefix="presume_review_") as temp_dir:
            temp_path = Path(temp_dir)
            pdf_path = temp_path / "resume.pdf"
            output_path = temp_path / "review.json"
            pdf_path.write_bytes(pdf_bytes)

            env = self._subprocess_environment()
            python_executable = self._python_executable(hiring_agent_path)
            try:
                subprocess.run(
                    [
                        str(python_executable),
                        "-c",
                        HIRING_AGENT_BRIDGE_SCRIPT,
                        str(hiring_agent_path),
                        str(pdf_path),
                        str(output_path),
                        "1" if self.settings.github_enrichment_enabled else "0",
                    ],
                    cwd=hiring_agent_path,
                    env=env,
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=SUBPROCESS_TIMEOUT_SECONDS,
                    check=True,
                )
            except subprocess.TimeoutExpired:
                raise TimeoutError from None
            except subprocess.SubprocessError as exc:
                raise ReviewServiceError(
                    code="hiring_agent_failed",
                    status_code=502,
                ) from exc

            try:
                return json.loads(output_path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                raise ReviewServiceError(
                    code="hiring_agent_failed",
                    status_code=502,
                ) from exc

    def _subprocess_environment(self) -> dict[str, str]:
        env = {
            key: value
            for key, value in os.environ.items()
            if key in SAFE_SUBPROCESS_ENV_KEYS
        }
        env["LLM_PROVIDER"] = self.settings.public_provider
        env["DEFAULT_MODEL"] = self.settings.public_model
        if self.settings.gemini_api_key:
            env["GEMINI_API_KEY"] = self.settings.gemini_api_key
        if self.settings.github_token:
            env["GITHUB_TOKEN"] = self.settings.github_token
        return env

    def _python_executable(self, hiring_agent_path: Path) -> Path:
        venv_python = hiring_agent_path / ".venv" / "bin" / "python"
        if venv_python.is_file():
            return venv_python
        return Path(sys.executable)


def empty_review_result() -> ReviewResult:
    return ReviewResult(
        id=f"review_{uuid4().hex[:12]}",
        reviewedAt=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        totalScore=0,
        maxScore=100,
        tier="incomplete",
        categories=[],
        strengths=[],
        improvements=[],
        bonuses=[],
        deductions=[],
        annotations=[],
        raw={},
    )


HIRING_AGENT_BRIDGE_SCRIPT = r"""
import json
import sys
from pathlib import Path

hiring_agent_path = Path(sys.argv[1])
pdf_path = Path(sys.argv[2])
output_path = Path(sys.argv[3])
github_enrichment_enabled = sys.argv[4] == "1"

sys.path.insert(0, str(hiring_agent_path))

try:
    import config
except ModuleNotFoundError:
    config = None
else:
    config.DEVELOPMENT_MODE = False

import score

for module in tuple(sys.modules.values()):
    if hasattr(module, "DEVELOPMENT_MODE"):
        module_file = getattr(module, "__file__", None)
        if module_file is None:
            continue
        try:
            module_path = Path(module_file).resolve()
            module_path.relative_to(hiring_agent_path.resolve())
        except ValueError:
            continue
        module.DEVELOPMENT_MODE = False

if not github_enrichment_enabled:
    def _skip_github_enrichment(*args, **kwargs):
        return {}

    score.fetch_and_display_github_info = _skip_github_enrichment

evaluation = score.main(str(pdf_path))
if evaluation is None:
    raise SystemExit(4)

if hasattr(evaluation, "model_dump"):
    payload = evaluation.model_dump()
elif isinstance(evaluation, dict):
    payload = evaluation
else:
    raise SystemExit(5)

output_path.write_text(json.dumps(payload), encoding="utf-8")
"""


def normalize_hiring_agent_output(output: dict[str, Any]) -> ReviewResult:
    scores = _required_mapping(output, "scores")
    categories = []
    total_score = 0.0
    max_score = 0.0

    for key, label in CATEGORY_LABELS.items():
        category = _required_mapping(scores, key)
        score = _finite_number(category.get("score"))
        category_max = _positive_number(category.get("max"))
        evidence = _string_list(category.get("evidence"))
        normalized_score = _clamp(score, lower=0.0, upper=category_max)
        total_score += normalized_score
        max_score += category_max
        categories.append(
            {
                "key": key,
                "label": label,
                "score": normalized_score,
                "maxScore": category_max,
                "evidence": evidence,
                "suggestions": [],
            }
        )

    bonus_points = _optional_mapping(output, "bonus_points")
    bonus_total = _clamp(
        _finite_number(bonus_points.get("total", 0)),
        lower=0.0,
        upper=20.0,
    )
    bonus_breakdown = _optional_string(bonus_points.get("breakdown"))
    total_score += bonus_total

    deductions = _optional_mapping(output, "deductions")
    deduction_total = max(_finite_number(deductions.get("total", 0)), 0.0)
    deduction_reasons = _optional_string(deductions.get("reasons"))
    total_score -= deduction_total

    total_score = max(-20.0, min(total_score, max_score + 20.0))

    return ReviewResult(
        id=f"review_{uuid4().hex[:12]}",
        reviewedAt=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        totalScore=total_score,
        maxScore=max_score,
        tier=_tier_for_score(total_score, max_score),
        categories=categories,
        strengths=_string_list(output.get("key_strengths")),
        improvements=_string_list(output.get("areas_for_improvement")),
        bonuses=_adjustments("Bonus points", bonus_total, bonus_breakdown),
        deductions=_adjustments("Deductions", deduction_total, deduction_reasons),
        annotations=[],
        raw={"source": "hiring-agent"},
    )


def _required_mapping(data: dict[str, Any], key: str) -> dict[str, Any]:
    value = data.get(key)
    if not isinstance(value, dict):
        raise ReviewServiceError(
            code="hiring_agent_failed",
            status_code=502,
        )
    return value


def _optional_mapping(data: dict[str, Any], key: str) -> dict[str, Any]:
    value = data.get(key)
    return value if isinstance(value, dict) else {}


def _finite_number(value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ReviewServiceError(
            code="hiring_agent_failed",
            status_code=502,
        )
    parsed = float(value)
    if not math.isfinite(parsed):
        raise ReviewServiceError(
            code="hiring_agent_failed",
            status_code=502,
        )
    return parsed


def _positive_number(value: Any) -> float:
    parsed = _finite_number(value)
    if parsed <= 0:
        raise ReviewServiceError(
            code="hiring_agent_failed",
            status_code=502,
        )
    return parsed


def _clamp(value: float, *, lower: float, upper: float) -> float:
    return max(lower, min(value, upper))


def _optional_string(value: Any) -> str | None:
    return value if isinstance(value, str) and value else None


def _string_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value] if value else []
    if isinstance(value, list) and all(isinstance(item, str) for item in value):
        return value
    return []


def _adjustments(
    label: str,
    points: float,
    evidence: str | None,
) -> list[dict[str, Any]]:
    if points <= 0:
        return []
    return [
        {
            "label": label,
            "points": points,
            "evidence": evidence,
        }
    ]


def _tier_for_score(total_score: float, max_score: float) -> str:
    if max_score <= 0:
        return "incomplete"

    ratio = total_score / max_score
    if ratio >= 0.85:
        return "strong"
    if ratio >= 0.60:
        return "competitive"
    if ratio >= 0.35:
        return "needs_work"
    return "incomplete"
