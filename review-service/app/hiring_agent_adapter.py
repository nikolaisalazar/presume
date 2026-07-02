import asyncio
from datetime import UTC, datetime
from uuid import uuid4

from .config import Settings, resolve_hiring_agent_path
from .errors import ReviewServiceError
from .schemas import ReviewResult


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
        if not hiring_agent_path.exists():
            raise ReviewServiceError(
                code="hiring_agent_failed",
                status_code=502,
            )

        # The concrete Hiring Agent API is isolated here so upstream changes
        # affect this adapter, not the public Presume API contract.
        raise ReviewServiceError(
            code="hiring_agent_failed",
            status_code=502,
        )


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
