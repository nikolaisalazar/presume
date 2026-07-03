# Presume Documentation

This directory is the source of truth for Presume's product direction, current architecture, and Hiring Agent review integration.

## Docs

- [Milestone Plan](MILESTONE_PLAN.md): source of truth for deciding the next milestone and tracking milestone status.
- [Product Spec](PRODUCT_SPEC.md): product vision, target users, goals, non-goals, workflows, and UX principles.
- [Architecture](ARCHITECTURE.md): current frontend architecture, data flow, formatting behavior, and review-service boundaries.
- [Review Service](REVIEW_SERVICE.md): backend contract and setup for the FastAPI wrapper around Hiring Agent.
- [Implementation Plan](IMPLEMENTATION_PLAN.md): supporting implementation detail for review integration work after a milestone has been selected.

## Current vs Planned

The current shipped app is a browser resume editor with deterministic formatting, LocalStorage persistence, JSON import/export, PDF export, and advisory review UI that stays disabled without `VITE_REVIEW_API_URL` or when the configured review service reports review unavailable.

The review service exists under `review-service/` with normalized endpoints,
errors, configuration, Hiring Agent dependency readiness checks, a subprocess
adapter spike, and tests. Current integration-oriented tests cover
unconfigured, configured-service-disabled, and config-error editor behavior,
backend-shaped frontend errors, and safe backend error handling.

Milestone 11 verified the actual frontend can submit a browser-rendered resume
PDF to a running backend and display the normalized result using a controlled
temporary adapter target. Real Ollama-backed Hiring Agent execution still
requires `vendor/hiring-agent`, `ollama`, and the selected model installed
locally. The next milestone is
[Milestone 12: Review UX Polish Using Real Data](MILESTONE_PLAN.md#milestone-12-review-ux-polish-using-real-data).
