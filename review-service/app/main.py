from collections.abc import Awaitable
from typing import Protocol

from fastapi import FastAPI, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, load_settings
from .errors import ReviewServiceError, make_error_response, make_request_id
from .hiring_agent_adapter import HiringAgentAdapter
from .schemas import HealthResponse, PublicConfig, ReviewResult


UPLOAD_READ_CHUNK_BYTES = 1024 * 1024


class ReviewAdapter(Protocol):
    def review_pdf(self, pdf_bytes: bytes) -> Awaitable[ReviewResult]:
        ...


def create_app(
    settings: Settings | None = None,
    adapter: ReviewAdapter | None = None,
) -> FastAPI:
    resolved_settings = settings or load_settings()
    resolved_adapter = adapter or HiringAgentAdapter(resolved_settings)

    app = FastAPI(title="Presume Review Service")
    app.state.settings = resolved_settings
    app.state.adapter = resolved_adapter

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(resolved_settings.cors_origins),
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    @app.exception_handler(ReviewServiceError)
    async def handle_review_service_error(
        request: Request, error: ReviewServiceError
    ) -> JSONResponse:
        request_id = make_request_id()
        return JSONResponse(
            status_code=error.status_code,
            content=make_error_response(error, request_id).model_dump(),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request, error: Exception
    ) -> JSONResponse:
        request_id = make_request_id()
        service_error = ReviewServiceError(
            code="internal_error",
            status_code=500,
        )
        return JSONResponse(
            status_code=500,
            content=make_error_response(service_error, request_id).model_dump(),
        )

    @app.get("/health", response_model=HealthResponse)
    async def health() -> HealthResponse:
        return HealthResponse(status="ok")

    @app.get("/config", response_model=PublicConfig)
    async def config() -> PublicConfig:
        return resolved_settings.public_config()

    @app.post(
        "/reviews",
        response_model=ReviewResult,
        response_model_exclude_none=True,
    )
    async def reviews(file: UploadFile) -> ReviewResult:
        pdf_bytes = await read_upload_with_limit(
            file, resolved_settings.max_upload_bytes
        )
        validate_pdf_upload(file, pdf_bytes, resolved_settings)
        return await resolved_adapter.review_pdf(pdf_bytes)

    return app


async def read_upload_with_limit(file: UploadFile, max_upload_bytes: int) -> bytes:
    chunks: list[bytes] = []
    total_bytes = 0

    while True:
        chunk = await file.read(UPLOAD_READ_CHUNK_BYTES)
        if not chunk:
            break

        total_bytes += len(chunk)
        if total_bytes > max_upload_bytes:
            raise ReviewServiceError(
                code="upload_too_large",
                message="Upload exceeds the review service size limit.",
                status_code=413,
            )

        chunks.append(chunk)

    return b"".join(chunks)


def validate_pdf_upload(
    file: UploadFile,
    pdf_bytes: bytes,
    settings: Settings,
) -> None:
    filename = file.filename or ""
    content_type = file.content_type or ""
    is_pdf_name = filename.lower().endswith(".pdf")
    is_pdf_type = content_type in {"application/pdf", "application/x-pdf"}
    has_pdf_header = pdf_bytes.startswith(b"%PDF")

    if not pdf_bytes or not is_pdf_name or not is_pdf_type or not has_pdf_header:
        raise ReviewServiceError(
            code="invalid_upload",
            message="Upload must be a PDF.",
            status_code=400,
        )

    if len(pdf_bytes) > settings.max_upload_bytes:
        raise ReviewServiceError(
            code="upload_too_large",
            message="Upload exceeds the review service size limit.",
            status_code=413,
        )


app = create_app()
