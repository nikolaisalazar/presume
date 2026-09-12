**T2-1: Complete backups and backward-compatible restore — September 12, 2026.**

Implemented on `plan/audit-document-state` in `.worktrees/audit-document-state-plan`, pending integration. F09 is resolved on this branch. Milestone 19 and T2-2 through T2-5 remain incomplete.

The worktree was clean at `efb152f` before implementation. `git fetch origin` confirmed local `main` and `origin/main` both at `a14296cf0e6ae52d81e8a628a65b9360474a6031`. Merging `main` produced `8bec0e6efc3a18b6b676e6192c11d396e7d7236c` without conflicts. Implementation and reproduction used that updated baseline; the unrelated `.codex/` directory in the main checkout was left alone.

**Changed behavior.**

- Download backup initiates `presume-backup.json`, containing `format: "presume-backup"`, `version: 1`, descriptive `exportedAt`, and `data: { resume, constraints }`.
- Restore backup reads and validates before asking to replace current work. Versioned restores replace text and formatting together in memory. Invalid JSON, malformed envelopes, unsupported versions, missing/invalid constraints, cancellation, and read failures leave current data intact.
- Bare Resume files from the old exporter remain accepted. Their confirmation says: “This file contains resume text only. Your current formatting settings will be kept.” Settings are retained at application time, including changes made during the file read.
- The public Resume validator and constraint bounds remain unchanged. Unknown ordinary fields are stripped; envelope markers cannot fall through to legacy parsing. New backups exclude history, storage revisions, migration data, Review, theme, zoom, and measured scale.
- The file input can select the same file again after cancellation/errors. A newer selection or editor unmount invalidates an older pending read. Ordinary focused input is included in the backup.
- JSON file helpers now live in `documentBackup.ts`; the PDF renderer and both existing PDF function signatures and implementations are unchanged. Toolbar button variants and layout are retained.

**F09 evidence.**

At the updated baseline, an actual Chromium download and restore into a fresh context retained all resume text but changed `{maxPages: 1, maxLinesPerBullet: 3, minFontSize: 12}` to `{maxPages: 1, maxLinesPerBullet: 1, minFontSize: 8}`. The downloaded file contained only `name`, `contact`, and `sections`.

The same journey on the implemented source retains all text and the exact original settings after restore and reload. Preserved synthetic/example artifacts:

- [Before reproduction](evidence/t2-1/f09-before.json).
- [Actual repaired download](evidence/t2-1/downloaded-backup.json).
- [After restore and reload](evidence/t2-1/f09-after.json).

Maintained coverage in `e2e/document-backup.spec.ts` additionally downloads a fixture containing every text field, Unicode/combining characters, empty strings, whitespace, CR/CRLF, and leading/repeated/trailing newlines. It restores into a fresh context, reloads, downloads again, and compares all document data exactly. It runs in Chromium, Firefox, and WebKit via `playwright.backup.config.ts`. The backup gate uses its own strict port, 4188. CI installs all three engines and `npm run test:e2e` includes the gate.

**Validation and independent review.**

Validated on macOS with Node `v24.19.0`, Python `3.11.16`, Playwright `1.61.1`, Chromium `149.0.7827.55`, Firefox `151.0`, and WebKit `26.5`. Node dependencies were installed in this worktree with `npm ci`; the existing isolated Python 3.11 audit environment supplied backend dependencies.

| Check | Result |
| --- | --- |
| `npm run verify` | Review contract generation check, type checking, 280 frontend tests across 24 files, and 50 backend tests passed |
| `npx playwright test -c playwright.backup.config.ts` against the production build | 9 passed: complete round trip, legacy import, and invalid/future/cancel/retry coverage in three engines |
| `CI=1 npm run test:e2e:unconfigured` | 9 passed, including real PDF download, editor availability, focus, narrow layouts, and landing contracts |
| `CI=1 npm run test:e2e:configured` | 3 passed, including PDF review submission, result display, and stale-after-edit behavior with controlled responses |
| Final `npm run build` | Passed; default unconfigured production build restored |
| `git diff --check` | Passed |

The first backup browser run reached successful restore but failed a test assertion that expected “3 lines/bullet” where the existing UI says “3 line/bullet.” Correcting the assertion yielded nine passing checks; product copy was not changed for that mismatch. Existing PDF chunk-size and Python dependency deprecation warnings remain.

An independent reviewer inspected all production, tests, CI configuration, and documentation changes against the T2-1 plan. The reviewer reported no Critical, Important, or Minor findings and approved the bounded change subject to the full/browser results above. Their separate Node 24 run passed 66 tests across the codec, backup integration, and existing app integration files, plus `git diff --check`. The reviewer did not mutate the checkout.

**Remaining limitations and next owner.**

- `useResume` now holds one `DocumentData` state for coherent in-memory restore, but browser persistence still writes two localStorage keys separately. Atomic persistence, denied/quota recovery, accurate save status, and tab conflicts remain T2-4 work; F05 is open.
- A document session, `prepareSnapshot()`, revision checks, undo/history, and focused replacement reconciliation remain T2-2 work. The current ordinary-input tests do not establish reliable IME, rich paste, native hard-break editing, or stale focused DOM handling; T2-3 retains those obligations. F03/F04/F07 and combined F01 remain open.
- Reset still has its existing text-only behavior. The planned reset of both content and constraints with undo belongs to the later session change.
- New Presume accepts old bare Resume files; older application bundles cannot restore the new versioned envelopes. Browser data does not sync between profiles. Download initiation cannot establish whether the user saved a file to disk.
- PDF behavior was regression-tested, but glyph coverage, pagination/fitting audit fixes, and cross-package snapshot/layout identity remain T3/T4 responsibilities. Review browser tests use fixtures; this change did not repeat real Ollama, manual IME/assistive-technology, Windows/Linux, or real-user sessions.

The next T2 step is T2-2. Integrate this change before dependent consumers adopt the backup types; keep the session/history/persistence handoff explicit rather than treating `useResume` as the planned session controller.
