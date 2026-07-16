# Presume

Presume is a WYSIWYG resume editor for building resumes that stay directly editable while fitting cleanly on the page. The app focuses on deterministic browser-side formatting and an advisory review loop designed to run through a local or self-hosted service.

## Why

Resume tools usually split writing, formatting, and feedback into separate workflows. Presume keeps the resume itself as the interface: edit the final document directly, let the app handle fit constraints, then use review feedback as evidence for manual revision.

The project is also intended to read well as a portfolio project: a small frontend with clear layout constraints today and a documented path toward a local or self-hosted review service.

## Current Status

Working today:

- Direct inline editing for resume content.
- Pretext-based fitting for page height and bullet line constraints.
- Configurable max pages, max lines per bullet, and minimum font size.
- LocalStorage persistence for resume data and formatting constraints.
- JSON export and import.
- Client-side PDF export, including multiple Letter pages when the configured page limit is greater than one.
- Review API client, review state hook, panel, and conservative non-destructive annotations that stay disabled without `VITE_REVIEW_API_URL` or when the configured review service reports review unavailable.
- FastAPI review service scaffold with safe config projection, Hiring Agent dependency readiness checks, normalized schemas, normalized errors, PDF upload validation, and mocked contract tests.
- Integration-oriented tests for unconfigured editor behavior, backend-shaped frontend errors, and safe backend error handling.
- Browser/E2E automation for the critical review and export contracts. The
  Playwright suite launches the real Vite app in Chromium and uses route
  interception for `/config` and `/reviews` so tests do not require Ollama,
  `vendor/hiring-agent`, or third-party network access.
- Browser-to-backend review flow has been exercised with a running frontend,
  running backend, controlled adapter target, and the real local
  Ollama-backed Hiring Agent path using `vendor/hiring-agent`, `gemma3:4b`, and
  a browser-generated Presume PDF. `vendor/hiring-agent` is a local prerequisite
  and is not vendored into this repository.

Recently completed:

- Resume editing model helpers for contact, section, entry, and bullet
  operations. These are internal pure functions that preserve the current JSON
  format and inline editing UI while making future editor improvements safer.

Operational note: the review service now validates bounded upload and timeout
configuration and documents proxy, process, rate, and concurrency controls for
non-local use. It still does not include built-in authentication, queues, global
concurrency limiting, or rate limiting; deployments exposed beyond trusted local
use should add those controls externally.

## How It Works

The frontend renders a US Letter resume page and stores the resume as typed JSON. As the resume changes, `@chenglou/pretext` measures bullet text and the resize engine binary-searches a global CSS scale so the document satisfies the configured page and line constraints. Content that cannot fit within the configured minimum font size is marked with a formatting warning.

PDF export is fully client-side using `@react-pdf/renderer`. A canonical renderer maps the current resume data and selected global scale directly into Letter-sized PDF pages, independently of browser zoom and live DOM geometry. Longer resumes flow onto additional Letter pages instead of being compressed onto one page. Export and Review use the same generated PDF blob, while JSON export/import provides a portable save format.

The review flow keeps semantic evaluation outside the static frontend. A local or self-hosted FastAPI service accepts the current resume PDF, runs review work through a Hiring Agent adapter boundary, and returns a normalized review result for the frontend to display. If no review endpoint is configured, or if the service reports review disabled because the local Hiring Agent checkout is unavailable, the review UI is disabled rather than breaking the editor.

## Tech Stack

- React 18, TypeScript, and Vite.
- `@chenglou/pretext` for text measurement.
- `@react-pdf/renderer` for canonical, browser-side PDF generation.
- Vitest and jsdom for tests.
- FastAPI review service, `vendor/hiring-agent` adapter boundary, Ollama by default, optional Gemini configuration, and optional GitHub enrichment.

## Development

```sh
npm install
npm run dev
npm test
npm run build
npm run test:e2e
```

To run the review flow locally, start the backend:

```sh
cd review-service
HIRING_AGENT_PATH=../vendor/hiring-agent \
LLM_PROVIDER=ollama \
DEFAULT_MODEL=gemma3:4b \
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then start the frontend from the repository root:

```sh
VITE_REVIEW_API_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1
```

The `npm run test:e2e` command covers `/presume/` base-path app load, nonblank resume rendering, normal PDF export download, unconfigured/disabled/config-error review states, fixture-backed review submission and rendering, stale-after-edit behavior, and narrow viewport fixed-canvas scrolling. It intentionally does not run the real Ollama-backed Hiring Agent path by default because that requires local `vendor/hiring-agent`, its `.venv`, a running Ollama service, a pulled model such as `gemma3:4b`, and multi-minute machine-dependent review latency. For non-local review-service deployments, align proxy upload limits with `MAX_UPLOAD_BYTES`, set timeouts above `REVIEW_TIMEOUT_SECONDS` plus upload overhead, and add external rate/concurrency controls.

The frontend can also run as a static app without review configured. Review
submission requires a separate backend service and `VITE_REVIEW_API_URL`; see
[docs/REVIEW_SERVICE.md](docs/REVIEW_SERVICE.md) and
[review-service/README.md](review-service/README.md).

## Documentation

Start with the [documentation index](docs/README.md) for product, architecture, review-service, and implementation planning docs.

## License

MIT
