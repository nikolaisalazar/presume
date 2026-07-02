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

The review service exists under `review-service/` with normalized endpoints, errors, configuration, Hiring Agent dependency readiness checks, and tests. Current integration-oriented tests cover unconfigured, configured-service-disabled, and config-error editor behavior, backend-shaped frontend errors, and safe backend error handling.

The next milestone is [Milestone 10: Real Hiring Agent Adapter Spike](MILESTONE_PLAN.md#milestone-10-real-hiring-agent-adapter-spike). It should wire the backend adapter to a local `vendor/hiring-agent` checkout enough to return one real normalized review result before broader UI polish begins.
