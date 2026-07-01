# Presume Documentation

This directory is the source of truth for Presume's product direction, current architecture, and Hiring Agent review integration.

## Docs

- [Milestone Plan](MILESTONE_PLAN.md): source of truth for deciding the next milestone and tracking milestone status.
- [Product Spec](PRODUCT_SPEC.md): product vision, target users, goals, non-goals, workflows, and UX principles.
- [Architecture](ARCHITECTURE.md): current frontend architecture, data flow, formatting behavior, and review-service boundaries.
- [Review Service](REVIEW_SERVICE.md): backend contract and setup for the FastAPI wrapper around Hiring Agent.
- [Implementation Plan](IMPLEMENTATION_PLAN.md): supporting implementation detail for review integration work after a milestone has been selected.

## Current vs Planned

The current shipped app is a browser resume editor with deterministic formatting, LocalStorage persistence, JSON import/export, PDF export, and advisory review UI that stays disabled without `VITE_REVIEW_API_URL`.

The review service now exists under `review-service/` with normalized endpoints, errors, configuration, and tests. Full end-to-end Hiring Agent execution still requires a local `vendor/hiring-agent` checkout to be wired through the adapter.
