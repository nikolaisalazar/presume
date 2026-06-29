# Presume

Presume is a WYSIWYG resume editor for building resumes that stay directly editable while fitting cleanly on the page. The current app focuses on deterministic browser-side formatting; the planned next phase adds an explainable review loop powered by HackerRank's open-source Hiring Agent.

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
- Client-side PDF export.

Planned, not shipped:

- A FastAPI review service wrapping HackerRank Hiring Agent.
- A review panel with score, evidence, strengths, improvements, bonuses, and deductions.
- Non-destructive annotations that map review findings back to resume content when possible.

## How It Works

The frontend renders a US Letter resume page and stores the resume as typed JSON. As the resume changes, `@chenglou/pretext` measures bullet text and the resize engine binary-searches a global CSS scale so the document satisfies the configured page and line constraints. Content that cannot fit within the configured minimum font size is marked with a formatting warning.

PDF export is fully client-side using `html2canvas` and `jsPDF`. JSON export/import provides a portable save format.

The planned review flow keeps semantic evaluation outside the static frontend. A local or self-hosted FastAPI service will accept the current resume PDF, run Hiring Agent through an adapter, and return a normalized review result for the frontend to display. If no review endpoint is configured, the review UI should be disabled rather than breaking the editor.

## Tech Stack

- React 18, TypeScript, and Vite.
- `@chenglou/pretext` for text measurement.
- `html2canvas` and `jsPDF` for browser PDF export.
- Vitest and jsdom for tests.
- Planned: FastAPI review service, `vendor/hiring-agent`, Ollama by default, optional Gemini configuration, and optional GitHub enrichment.

## Development

```sh
npm install
npm run dev
npm test
npm run build
```

The frontend can run as a static app. The planned review feature requires a separate backend service; see [docs/REVIEW_SERVICE.md](docs/REVIEW_SERVICE.md).

## Documentation

Start with the [documentation index](docs/README.md) for product, architecture, review-service, and implementation planning docs.

## License

MIT
