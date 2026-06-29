# Presume Documentation

This directory is the source of truth for Presume's product direction, current architecture, and planned Hiring Agent review integration.

## Docs

- [Product Spec](PRODUCT_SPEC.md): product vision, target users, goals, non-goals, workflows, and UX principles.
- [Architecture](ARCHITECTURE.md): current frontend architecture, data flow, formatting behavior, and future review-service boundaries.
- [Review Service](REVIEW_SERVICE.md): implementation-grade backend plan for the planned FastAPI wrapper around Hiring Agent.
- [Implementation Plan](IMPLEMENTATION_PLAN.md): roadmap for frontend review integration, backend service work, tests, and acceptance criteria.

## Current vs Planned

The current shipped app is a browser-only resume editor with deterministic formatting, LocalStorage persistence, JSON import/export, and PDF export.

The review system is planned. No backend service, review API client, review panel, or review annotations exist in the app yet.
