# Architecture

## Current State

Presume is currently a React application with an optional review service. The frontend owns editing, formatting, local persistence, JSON import/export, PDF generation, review display, stale-state tracking, and advisory annotation rendering. The backend service under `review-service/` owns the normalized review API boundary.

## Frontend Modules

| Module | Responsibility |
|---|---|
| `src/App.tsx` | Composes resume state, settings, toolbar, resume page, and resize warnings. |
| `src/documentSession.ts` / `src/useDocumentSession.ts` | Own one synchronous session above internal routes; expose immutable snapshots through `useSyncExternalStore`, revisions, edit tokens, preparation, history, and save outcomes. |
| `src/documentHistory.ts` / `src/documentCommands.ts` | Reduce bounded snapshot history and apply typed field/structure/constraint commands to the latest data. |
| `src/documentSelection.ts` | Capture and restore UTF-16 focus anchors without splitting surrogate pairs. |
| `src/formatting/` | Pure in-process module that computes a `ResumeFit` from resume data, constraints, and injected measurements. |
| `src/useResizeEngine.ts` | React/DOM/Pretext adapter that supplies live measurements to the formatting module and publishes its result. |
| `src/export.ts` | Exports single-page or multi-page Letter PDFs; its renderer API remains unchanged. |
| `src/document.ts` | Defines and validates portable `DocumentData` containing resume and constraints. |
| `src/documentBackup.ts` | Encodes versioned complete JSON backups, reads legacy resume files, validates before restore, and initiates downloads. |
| `src/constraints.ts` | Owns the constraint interface, inclusive bounds, defaults, parsing, and controlled updates. |
| `src/types.ts` | Defines resume data and validators, with compatibility re-exports for constraints. |
| `src/resumeOperations.ts` | Provides pure immutable helpers for contact, section, entry, and bullet editing operations. |
| `src/storage.ts` | Catches transitional two-key LocalStorage reads/writes and distinguishes sample, saved, recovery, and unsaved outcomes. |
| `src/defaultResume.ts` | Provides the initial resume template. |
| `src/components/*` | Renders editable resume UI, settings, toolbar, sections, entries, bullets, and header. |
| `src/styles/app.css` | App shell, toolbar, settings, and editing controls. |
| `src/styles/resume.css` | Resume page dimensions, typography variables, global scale, layout, and warning styles. |

## Current Data Model

```ts
type Resume = {
  name: string
  contact: string[]
  sections: ResumeSection[]
}

type ResumeSection = {
  title: string
  entries: ResumeEntry[]
}

type ResumeEntry = {
  title: string
  subtitle: string
  location: string
  dateRange: string
  bullets: string[]
}

type Constraints = {
  maxPages: number
  maxLinesPerBullet: number
  minFontSize: number
}
```

The public Resume shape remains the editing content model and the resume LocalStorage value. New JSON backups wrap it with formatting constraints in `DocumentData`; bare Resume JSON remains accepted for restore. Imported JSON is validated and unknown fields are stripped. Milestone 17 preserved this public shape while moving contact, section, entry, and bullet mutations into tested pure helpers so inline editor components no longer own array manipulation directly.

Persisted formatting constraints are parsed against the inclusive bounds in `src/constraints.ts`. Invalid values are rejected rather than clamped; unknown fields on otherwise valid constraint data are stripped. Invalid or inaccessible stored values enter recovery without writing defaults over the original data.

## Complete Backup Format

T2-1 writes `{ format: "presume-backup", version: 1, exportedAt, data: { resume, constraints } }` to `presume-backup.json`. `exportedAt` is a descriptive timestamp, never a conflict or replacement authority. The codec validates content with `validateResume` and settings with `parseConstraints`, strips unknown ordinary fields, and rejects invalid settings without clamping. Envelope `format`/`version` markers are reserved: malformed or unsupported envelopes cannot fall back to bare Resume parsing. Backup data excludes storage revisions, history, raw migration data, Review results, theme, zoom, and layout measurements.

The toolbar reads and validates before confirming replacement. Complete restores replace both halves of the in-memory document with one React state update; legacy imports replace text and retain the constraints current when the update is applied. A newer file selection or editor unmount invalidates an older pending read. Cancellation and errors preserve current data and reset the file input for another selection of the same file.

T2-2 replaces `useResume` with an application-owned document session. Typed commands use current state and reject stale structural epochs/edit tokens. The reducer retains at most 100 undoable groups across text, formatting, structure, restore, and reset. Ordinary same-field/same-operation input groups while events are less than 750ms apart; selection moves, blur, distinct operations and commands end groups. Repeated Enter on a constraint stepper is one gesture. History ends on reload, survives internal routes, and does not rewind the document revision. Effective replacements remount the field Fragment by reconciliation epoch while preserving the `.resume-page` root; history carries focus/selection anchors.

`prepareSnapshot()` flushes an active non-composing field and returns immutable `{ status: 'ready', data, documentRevision }`, or `{ status: 'composing' }`. Backup/PDF/Review callers prepare first. Restore/reset recheck the confirmed revision; legacy restore retains settings at application time. Basic composition guards keep an internal route pending until completion. The rich contentEditable serializer and full native history/composition/AX behavior remain T2-3 work; revision-tagged layout and Review result identity remain T3/T4 work.

Persistence is explicitly transitional: caught synchronous writes still update `presume:resume` and `presume:constraints` separately. Only both successful writes acknowledge the current document. A failure, including the second key, retains the full draft/history and exposes retry and complete backup. Invalid/denied discovery preserves original values and disables automatic writes; raw readable values can be downloaded, and replacing browser data requires confirmation. There are no startup writes for a sample. The theme storage getter is also guarded so recovery can mount. This is not atomic or concurrency-safe: partial durable pairs and older-tab overwrites remain possible (F05 open) until T2-4 replaces the adapter with IndexedDB and its recovery protocol.

## Current Formatting Behavior

The resume page uses US Letter proportions: `816px` by `1056px`, with fixed page margins and a fixed bullet column width used by the resize engine.

`useResizeEngine` runs after resume or constraint changes and adapts the browser to the pure formatting module:

1. Wait for document fonts to be ready.
2. Create local measurement adapters: Pretext measures bullet line counts, while the resume DOM measures page height after the adapter writes each candidate `--global-scale`.
3. Temporarily switch the resume to high-resolution layout coordinates while preserving its live presentation variables.
4. Call `computeResumeFit`, which derives the minimum scale, identifies impossible bullets, and binary-searches the largest global scale where page height and all satisfiable bullets fit.
5. Evaluate page overflow at minimum scale with a `0.5px` tolerance and return a `ResumeFit` containing the selected scale and structured warnings.
6. Restore the temporary layout and presentation variables.
7. Apply the selected `--global-scale` to the live document.
8. Publish the current fit only if the async measurement is still current for the resume and constraints.

Formatting warnings use explicit data rather than encoded string keys: `globalOverflow` reports page overflow at minimum scale, and `bullets` contains numeric section, entry, and bullet locations for impossible bullets. UI callers inspect that structure or use `hasBulletWarning`; binary search, warning encoding, tolerance, and impossible-bullet detection remain implementation details of `src/formatting/`.

All major resume font sizes are expressed as CSS custom properties multiplied by `--global-scale`. The current implementation does not assign independent per-bullet font variables.

## Current PDF Export Behavior

`src/export.ts` lazily loads the canonical renderer under `src/pdf/`. The renderer maps the current `Resume` data and selected global scale into a native Letter-sized PDF with embedded EB Garamond fonts. It does not read the rendered DOM, so browser zoom and presentation transforms cannot change the exported document geometry.

The same `renderResumeToPDFBlob` path serves the user-facing Export PDF action and Review submissions. A one-page resume produces one Letter page; longer content flows onto additional Letter pages while preserving section and entry hierarchy. Editor controls, formatting warnings, review annotations, and other application chrome are absent because the PDF is generated from resume data rather than a screenshot.

The current renderer does not create visible page-break UI inside the editor. The fixed `816px` by `1056px` browser canvas remains the editing reference for one Letter-page unit, while the PDF renderer owns pagination in the exported artifact.

## Current Frontend Data Flow

```mermaid
flowchart TD
  User[User edits resume] --> Components[src/components]
  Components --> App[src/App.tsx]
  App --> Session[src/documentSession.ts via useSyncExternalStore]
  Session --> History[src/documentHistory.ts]
  Session --> Storage[src/storage.ts transitional LocalStorage]
  Session --> Resize[src/useResizeEngine.ts]
  Resize --> Pretext[@chenglou/pretext]
  Resize --> DOM[Resume DOM height measurement]
  Resize --> Formatting[src/formatting pure ResumeFit computation]
  Formatting --> Fit[Structured ResumeFit]
  Fit --> Resize
  Resize --> CSS[CSS --global-scale and structured warnings]
  App --> Page[src/components/ResumePage.tsx]
  App --> Export[src/export.ts]
  Export --> PDFRenderer[src/pdf canonical renderer]
  PDFRenderer --> PDF[Single or multi-page PDF download]
  App --> Backup[src/documentBackup.ts]
  Backup --> JSON[Versioned complete backup / legacy restore]
```

## Review Architecture

The review feature uses a separate service. The frontend remains responsible for editing, formatting, local persistence, PDF generation, review display, stale-state tracking, and annotation rendering.

The backend should own PDF ingestion, Hiring Agent orchestration, LLM provider configuration, GitHub enrichment, timeouts, error normalization, and normalized review output.

The Pydantic response models attached to FastAPI routes are the authoritative review wire contract. `contracts/review.openapi.json` and `src/generated/reviewContract.ts` are generated artifacts and must not be edited manually. `npm run check:review-contract` regenerates both artifacts in a temporary directory and prevents contract drift before typechecking and tests run. Generated TypeScript types provide compile-time structure only; frontend runtime validators remain responsible for rejecting malformed network data.

`VITE_REVIEW_API_URL` is the frontend config variable. If it is missing, the app enters an unconfigured review state and disables review submission without affecting editing, export, import, or persistence. When it is present, the frontend reads `GET /config` at startup and disables review submission if the service reports review unavailable or if readiness cannot be confirmed. The frontend does not poll for later readiness changes; future live readiness changes are handled through normalized review submission errors unless a later milestone adds rechecking.

The first backend implementation provides FastAPI endpoints, safe allowlisted config projection, normalized schemas, template-based normalized errors, bounded upload validation, Hiring Agent dependency readiness checks, and a Hiring Agent adapter boundary. The frontend consumes the public readiness signal before enabling review submission. Operational hardening validates bounded upload and review-timeout settings, exposes only coarse safe readiness/limit diagnostics through `/config`, and documents external proxy, process, rate, and concurrency controls for deployments beyond trusted local use. Integration-oriented tests cover unconfigured, configured-service-disabled, and config-error editor behavior, backend-shaped frontend errors, mocked backend review success, and safe backend error handling. Playwright browser automation covers `/presume/` base-path app load, nonblank resume rendering, normal PDF export download, route-intercepted configured review states, multipart review submission shape, fixture review rendering, stale-after-edit behavior, and narrow viewport fixed-canvas scrolling. Browser-to-running-backend verification has exercised the actual frontend, FastAPI service, CORS preflight, multipart upload, adapter subprocess boundary, review result rendering, stale-after-edit behavior, disabled-service state, and backend-unavailable state with a controlled temporary adapter target. Milestone 14 verified real Ollama-backed Hiring Agent execution with a local `vendor/hiring-agent` checkout, Ollama, `gemma3:4b`, and a browser-generated Presume review PDF. Real Ollama-backed review remains manual by default because it depends on local setup and multi-minute machine-dependent model latency.

## Review Request Flow

```mermaid
sequenceDiagram
  participant User
  participant UI as Presume Frontend
  participant PDF as PDF Export Utility
  participant API as FastAPI Review Service
  participant HA as Hiring Agent Adapter
  participant LLM as Ollama or Gemini
  participant GH as GitHub API

  User->>UI: Request review
  UI->>PDF: Render current resume data and selected scale to a canonical PDF Blob
  PDF-->>UI: PDF Blob
  UI->>API: POST /reviews multipart resume.pdf
  API->>HA: Run extraction and scoring through adapter
  HA->>LLM: Prompt-based parsing/evaluation
  HA->>GH: Optional repository enrichment
  HA-->>API: Raw review output
  API-->>UI: Normalized ReviewResult
  UI-->>User: Score, evidence, suggestions, annotations
```

## Review Boundaries

- The frontend must not import Hiring Agent internals.
- The backend must not mutate Presume JSON resume content.
- Review results must be normalized before they reach UI components.
- Review annotations are display metadata, not editing commands.
- Hosted LLM providers must be opt-in because resume content may be sensitive.
