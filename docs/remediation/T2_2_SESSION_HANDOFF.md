**T2-2: Document session, history, and transitional persistence safeguards — September 12, 2026.**

Implemented on `feat/t2-2-document-session` in `.worktrees/t2-2-document-session`, pending integration. The handoff and implementation are committed together. Milestone 19 and T2-3 through T2-5 remain incomplete.

**Base and isolation.**

Read the milestone tracker, remediation work map, implementation plan, and T2-1 handoff before implementation. `git fetch origin` confirmed current remote `main` at `af2231a2b584d5463eac5f6919cde4bd5dc33a00` (PR #45); `git merge-base --is-ancestor ef82fe4 origin/main` succeeded. T2-1 implementation `ef82fe4a00c68a5d614414c4ef51b89abbb723e4` is integrated there. The main worktree's local branch was older and had unrelated uncommitted T1 documentation/studies. Those files and the existing `.codex/` directory were preserved. This dedicated worktree was created from the fetched main commit.

**Changed behavior and published interfaces.**

- `createDocumentSession` owns one immutable `DocumentData`, monotonically increasing local `documentRevision`, `SaveState`, bounded history, and `reconciliationEpoch`. `useDocumentSession` places it above the landing/editor split; `useSyncExternalStore` subscribers read cached snapshots. Strict Mode effect replay leaves it usable; application unmount disposes it. The transitional reader is synchronous; asynchronous hydration belongs to T2-4.
- `documentCommands.ts` defines discriminated `FieldPath`, structural commands, focus anchors, and UTF-16 selections. Commands operate on current data via existing immutable helpers. Invalid indexes and stale epochs/tokens cannot modify a shifted neighbor. No public Resume schema or persistent IDs changed.
- `documentHistory.ts` retains at most 100 undoable groups, with structural sharing and no persisted history. Typing/deletion coalesces only for the same field and operation with gaps under 750ms. Blur, selection relocation (including Select All), operation changes, and commands end a group. Paste/cut/drop/break/composition input kinds are discrete groups; their full native-input fidelity remains T2-3. Constraint clicks are separate; held Enter repeats form one gesture ending on release/blur.
- Undo/Redo buttons and document-surface Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, and Ctrl+Y traverse complete text/settings/structural history. New effective actions invalidate redo; no-ops do not change revisions or add frames. History survives internal routes and ends on reload.
- Structural actions, undo/redo, restore, and reset reconcile the field Fragment by epoch while retaining the `.resume-page` root. Focus anchors restore fields/carets, added content, surviving siblings, or parent actions. Removed DOM cannot commit a late blur. Offset clamping avoids splitting surrogate pairs.
- `prepareSnapshot()` flushes active non-composing DOM and returns immutable `{ status: 'ready', data, documentRevision }`, or `{ status: 'composing' }`. Backup and PDF prepare before capture. The small optional Review preparation seam captures that same immutable text before asynchronous PDF work; it does not introduce revision-tagged layout or rewrite the Review state machine. Browser history navigation waits for composition completion before unmounting the editor.
- Restore still validates before confirmation, invalidates obsolete reads after another selection/editor unmount, and permits selecting the same file again. Confirmation is refreshed when its document revision changes. Complete backups replace both halves; legacy Resume files retain constraints at application time. Reset replaces both halves with defaults as one undoable action. Canceled/invalid/unreadable files add no history.

The complete backup codec, public validators, and PDF renderer/signatures are unchanged. T2-1's version 1 envelope, unsupported/malformed-envelope rejection, legacy compatibility, descriptive timestamp, field preservation, and excluded metadata contracts remain intact.

**Explicitly transitional persistence.**

`storage.ts` still writes `presume:resume` and `presume:constraints` separately. Reads, storage getters, and both writes are caught and return actual outcomes. Only success of both writes acknowledges the current full payload. A failed first or second write keeps data/history available and exposes an unsaved status, Retry saving, and the existing complete backup action. Retry writes the entire current pair. The header's saved message means the latest local pair write succeeded; it is not a cross-tab guarantee.

Discovery does not save a sample. Missing, malformed, and inaccessible values are distinguished. Invalid or unreadable saved data disables automatic writes; valid recoverable halves may seed the in-memory editor while original values remain untouched. Readable raw values are separately downloadable. Retry cannot replace newer local content with a newly readable document. Replacing browser data requires explicit confirmation against the current revision. The theme getter is guarded before React mounts. A close warning covers failed/recovery/composing sessions but cannot ensure durability on forced shutdown.

This adapter is **not atomic or safe against competing tabs**. A second-key failure can leave a mixed durable pair even though the in-memory document and complete backup remain coherent. Another old/current tab can silently overwrite legacy keys. F05 stays open; no IndexedDB, migration, storage revision, conflict resolution, or asynchronous save coordinator is claimed by T2-2.

**Reproduction and verification.**

On `af2231a`, the four initial integration regressions all failed: unavailable undo after route navigation, stale focused restore, text-only reset, and a quota exception escaping the save effect. They pass on this implementation. [Recorded reproduction](evidence/t2-2/reproduction.json) retains the baseline and observed outcomes; the original cases remain in `documentSessionIntegration.test.tsx`.

Validated on macOS with Node `v24.19.0`, Python `3.11.16`, Playwright `1.61.1`, Chromium `149.0.7827.55`, Firefox `151.0`, and WebKit `26.5`. Ran `npm ci` in this worktree; backend checks used the existing isolated Python 3.11 audit environment. No dependency versions changed.

| Check | Result |
| --- | --- |
| `npm run verify` | Review contract generation check, type checking, 309 frontend tests across 26 files, and 50 backend tests passed |
| `CI=1 npm run test:e2e` | 48 passed: 9 unconfigured, 3 configured Review, 9 complete/legacy backup, and 27 session cases (session/backup run in Chromium, Firefox, and WebKit) |
| `npm run build` | Passed in the final browser gate; default/unconfigured production bundle retained |
| `git diff --check` | Passed |

The session gate uses strict isolated port 4189 and is included in `npm run test:e2e`/CI. It covers actual typing/shortcuts, selection replacement, structural history and focus, stable page root, focused import/reset, route retention, denied storage getter at bootstrap, a failed second write, backup/retry, corrupt-data preservation/replacement, and held-stepper grouping in all three engines. The composition/navigation case deliberately uses synthetic events to test session lifetime. It does not prove real platform composition behavior. Existing backup cases still use actual downloads, fresh contexts, reloads, Unicode/line-break fixtures, invalid/future envelopes, legacy restores, cancellation, and retry.

The large-document unit case uses 228,633 bytes and 1,200 bullets. It verifies structural sharing and the 100-group cap over 110 edits and 100 undos; observed isolated runs took approximately 100–120ms, and a full-suite run under contention took 255ms. This measures session/history with a stubbed successful writer, not browser storage latency or rendering performance. Existing PDF chunk-size and Python dependency deprecation warnings remain; dependency audit findings are not remediated in this package.

An early browser typing assertion expected clearing a field and subsequent typing to share one group; all engines correctly separated deletion from insertion. The test was corrected to verify both groups. Storage tests also exposed a DOMException that was not an `Error` in the test realm; error classification now recognizes DOMException explicitly.

**Independent review.**

A separate read-only reviewer inspected production changes and tests against T2-2 and the T2-1 contracts. Review reproduced two Important findings (composition plus Back stranded the session; Select All replacement joined preceding typing) and one Minor finding (held Enter stepper repeats were separate groups). All three were fixed and have maintained regressions.

The reviewer independently passed 48 focused tests, checked all three engines for the repaired cases plus undo-add parent focus, verified structural sharing/cap on the large fixture, and passed `git diff --check`. Their final assessment found no unresolved Critical, Important, or Minor findings and judged production ready for integration subject to the lead's final gates/documentation. Their temporary server was stopped and the checkout was not modified by review.

**Remaining work and handoff.**

- T2-3 owns replacing the retained rich `contentEditable`/`textContent` bridge with reliable plain-text serialization, hard breaks, paste/drop/cut semantics, native browser-menu/touch history, full IME behavior, accessible field labels/headings, and assistive-technology acceptance. F03/F07 remain open. This change repairs focused replacement and publishes typed input/grouping/focus interfaces, but does not claim editing fidelity from synthetic input tests.
- T2-4 owns atomic IndexedDB persistence, asynchronous hydration and delayed-save acknowledgment, conditional revisions, cross-tab conflicts, migration provenance, mixed old/new tabs, blocked/closed database cases, and cohesive recovery UI. F05 stays open. T2-2 repairs the reproduced F04 crash paths and provides interim unsaved/recovery behavior; final persistence acceptance remains outstanding.
- T2-5 owns integrated recovery/navigation/close validation. History is session-only; a reload or forced shutdown can lose unsaved work. Browser-local data is not a portable backup.
- T3 still owns action hit targets, content geometry, line-break/PDF agreement, glyphs, fitting, pagination, and revision-tagged completed layout. Tests activate structural controls by keyboard to select the intended action; overlapping pointer targets are not claimed fixed. Combined F01 remains open until T3 and T2 are verified together.
- T4 owns Review result identity, constraint-aware staleness, and failed-rerun behavior. Prepared text is captured now, but measured scale/readiness is not yet tied to the same document revision. Existing review tests use controlled responses; no real Ollama or hosted-provider run occurred here.
- No manual Japanese/Chinese IME, screen-reader, Windows/Linux, forced-color/touch-context-menu, or real-user acceptance was performed. Preserve these gates for T2-3/T3/T6. F09's complete backup behavior was regression-validated; the milestone is not complete.

Integrate this branch before beginning T2-3. Keep T2 ownership of shared document components until that editing adapter settles; hand its final interfaces to T3 explicitly. No publication, deployment, or merge to main was performed by this task.
