# Presume Documentation

This directory is the source of truth for Presume's product direction, current architecture, and Hiring Agent review integration.

## Docs

- [Milestone Plan](MILESTONE_PLAN.md): source of truth for deciding the next milestone and tracking milestone status.
- [Product Spec](PRODUCT_SPEC.md): product vision, target users, goals, non-goals, workflows, and UX principles.
- [Architecture](ARCHITECTURE.md): current frontend architecture, data flow, formatting behavior, and review-service boundaries.
- [shadcn Migration](SHADCN_MIGRATION.md): design-system decisions, migration phases, guardrails, and PR status for the incremental shadcn/Base UI adoption.
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
temporary adapter target. Milestone 13 completed general editor UI polish and
follow-up fixes for export, print, accessibility, and responsive fixed-canvas
scrolling. Milestone 14 verified the real local path with
`vendor/hiring-agent`, Ollama, `gemma3:4b`, a browser-generated Presume PDF,
the FastAPI service, the frontend validator, and the review panel. Milestone
15 added Playwright browser automation for the review and export contracts with
route-intercepted `/config` and `/reviews` fixture responses. Milestone 16 added
bounded operational config validation, safe readiness diagnostics, and deployment
guidance for running the review service beyond a single local happy path.
Milestone 17 improved the resume editing model internally by extracting tested
pure helpers for contact, section, entry, and bullet operations while preserving
the current public JSON format, inline editing UI, and review/export contracts.
