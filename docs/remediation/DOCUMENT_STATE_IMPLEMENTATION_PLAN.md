**T2: Document state and editing — implementation plan, September 10, 2026.**

Status: T2-1 implemented on `plan/audit-document-state`; independent review and validation are recorded in the [T2-1 handoff](T2_1_BACKUP_HANDOFF.md). T2-2 through T2-5 remain pending under [Milestone 19](../MILESTONE_PLAN.md#milestone-19-dependable-document-and-review-behavior). The original September 10 kickoff produced this plan only; the September 12 implementation request authorizes T2-1. Broader behavior below remains planned. The baseline is `1e91742`, containing the audits and remediation tracker. Product wording is representative and remains subject to T1/T5 review.

The outcome is a document that retains the user's text, supports deliberate recovery, reports whether saving succeeded, and moves between browsers with its formatting choices intact. This serves both the everyday-use standard in [PRODUCT.md](../../PRODUCT.md) and the portfolio standard. Preserve the direct document interaction, existing React stack, and [design system](../../DESIGN.md).

T2 owns F03, F04, F05, F07, F09, and the history prerequisite for F01 in the [codebase audit](../audits/2026-09-10-codebase-product-audit.md). The [product assessment](../audits/2026-09-10-product-and-landing-audit.md) supplies the recovery, save-state, and practical action-label requirements. The [work map](../audits/2026-09-10-remediation-work-map.md) assigns hit targets/layout/PDF to T3, Review/service/dependencies to T4, and landing/first-use presentation to T5. T2 alone cannot close F01: correct target selection and undo must be verified together after T3 integrates.

**Current behavior and the proposed boundary.**

| Current source | Consequence | Planned responsibility |
| --- | --- | --- |
| [useResume.ts](../../src/useResume.ts) loads two values and writes them in separate effects | No document-wide transaction, history, conflict handling, or save result | One document session with synchronous commands and one persistence coordinator |
| [storage.ts](../../src/storage.ts) conflates missing, invalid, and unreadable values; writes throw | Startup can replace unreadable data with defaults; save failures escape into React | Typed load/write outcomes, validated migration, and transactional browser storage |
| [EditableText.tsx](../../src/components/EditableText.tsx) saves `textContent` and ignores updates while focused | Hard breaks disappear, pasted styles diverge, and replacements can leave old DOM visible | A small plain-text input adapter with explicit field, composition, and reconciliation contracts |
| [resumeOperations.ts](../../src/resumeOperations.ts) already provides immutable operations | Useful core behavior exists, but components pass nested values captured by old renders | Reuse the helpers through commands applied to the session's latest state |
| [export.ts](../../src/export.ts) exports a bare Resume | Backups omit constraints | A versioned document backup codec; keep the PDF path separate |
| [App.tsx](../../src/App.tsx), [Toolbar.tsx](../../src/components/Toolbar.tsx), and [AppHeader.tsx](../../src/components/AppHeader.tsx) own separate reset/import/status assumptions | Actions can use stale values and “Saved locally” is unconditional | One session above the landing/editor route split; actions and status consume its contract |

Keep the public [Resume type and validator](../../src/types.ts) compatible. Do not add persistent IDs to sections, entries, or bullets. Keep [constraint validation](../../src/constraints.ts) independent and use its existing bounds. Add a `DocumentData` wrapper containing `{ resume, constraints }`; visual scale, warnings, browser zoom, theme, and Review results are derived or application state and are excluded.

Use a pure document reducer, a small session controller, a native IndexedDB adapter, and a backup codec. Expose the controller through React's existing `useSyncExternalStore` API so event handlers can dispatch against the current snapshot synchronously; React observes immutable snapshots. This avoids assuming that a state update has rendered before a toolbar action reads it. React documents the required stable subscription and cached snapshot behavior in its [external-store reference](https://react.dev/reference/react/useSyncExternalStore). No state-management framework or editor framework is proposed.

**Document session contract.**

The session belongs to `App`, survives internal landing/editor navigation, and is disposed only when that application instance ends. Opening the landing may discover whether a saved document exists, but it never creates a default saved document. Subscription cleanup, Strict Mode remounts, and late asynchronous callbacks must be tested.

```ts
type DocumentData = { resume: Resume; constraints: Constraints }
type DocumentRevision = string // opaque, local to this session's change history
type StorageRevision = string  // opaque, written with the durable record

type SaveState =
  | { status: 'loading' }
  | { status: 'sample' }
  | { status: 'pending' }
  | { status: 'saving' }
  | { status: 'saved'; storageRevision: StorageRevision }
  | { status: 'unsaved'; reason: 'unavailable' | 'quota' | 'write-failed' }
  | { status: 'conflict'; savedCandidate: StoredDocument | null }
  | { status: 'recovery'; reason: 'invalid' | 'unsupported-version' | 'read-failed' }

type StoredDocument = {
  schemaVersion: 1
  revision: StorageRevision
  updatedAt: string
  data: DocumentData
}
```

These are interface sketches, not generated production types. The implemented union must distinguish an unhydrated session from an editable one rather than exposing undefined data as a normal editable document. `sample` means a known-empty browser has the example in memory and it has not been written. `saved` means the latest canonical document matches a completed transaction; an unfinished composition or newer local edit prevents that status. Recovery details and raw data stay outside generic error strings and never enter logs or Review requests.

The ready snapshot exposes `data`, `documentRevision`, `saveState`, `canUndo`, `canRedo`, an action label for each history direction, and a `reconciliationEpoch`. It also retains the exact last persisted payload/revision and any active field draft privately. A document revision changes for every effective content or constraint change, including undo, redo, reset, restore, and accepted external replacement. It never rewinds with history. No-op changes produce no history entry or revision. Storage revisions identify committed records and must not be used to decide whether unsaved edits invalidate Review.

| Session operation | Contract |
| --- | --- |
| `beginFieldEdit(field, selection)` | Register the typed field path and current epoch; return an edit token that stale DOM events cannot reuse |
| `editField(token, text, inputKind, selection)` | Apply plain text to the latest document; composition drafts remain separate until committed |
| `finishFieldEdit(token)` | Commit any final non-composing input and close the history group; idempotent for duplicate blur/input ordering |
| `dispatch(command)` | Apply add/remove, field, or constraint operations to the latest document using the immutable helpers |
| `undo()` / `redo()` | Close an active text group, change document state, reconcile the DOM, and schedule persistence |
| `restore(parsedBackup)` / `resetTemplate()` | Perform one complete undoable replacement after preparation/confirmation, preserving both halves of the document in history |
| `prepareSnapshot()` | Flush the active non-composing edit and return immutable `{ data, documentRevision }`; return a typed composing/loading outcome when preparation cannot finish |
| `retrySave()` / `resolveConflict(choice, expectedRevision)` | Retry through the same conditional transaction; never bypass concurrency checks |
| `refreshSavedDocument()` | Re-read after cross-tab notification or browser focus; preserve active edits and report conflicts |

`FieldPath` is a discriminated union for name, contact index, section title, entry field, and bullet index. Structural commands also carry the epoch in which their path was selected. The reducer checks that epoch and the relevant indexes before applying them. It must not replace the current document with an entire stale object captured by a component. This is a session-level defense; T3 still owns which control receives the pointer action.

**Plain-text editing and accessible fields.**

Retain direct, naturally wrapping fields using `contentEditable="plaintext-only"` within `EditableText`. A native textarea is the fallback when that mode is unavailable or fails the supported-browser acceptance gate. A textarea is intrinsically preferable for plain text, but replacing every inline field immediately introduces sizing and wrapping changes across the canonical document; that would entangle this package with T3. The retained adapter must stay small. If reliable composition/selection handling requires an editor engine or accumulating browser-specific patches, stop and review a native-field implementation with T3 before expanding it.

The HTML standard defines [plain-text editing hosts](https://html.spec.whatwg.org/multipage/interaction.html#contenteditable), and [MDN's contenteditable reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable) documents formatting removal during paste. Detect support at runtime; do not infer editing behavior from an attribute's presence. Verify the actual operations in Chromium, Firefox, and WebKit. No support promise for old embedded browsers is implied by this plan.

| Input | Required behavior |
| --- | --- |
| Ordinary typing, deletion, selection replacement, spelling correction | Preserve the resulting Unicode text and selection; commit meaningful input to the session immediately |
| Enter or Shift+Enter | Insert a hard `\n` in the current field; neither submits the document nor creates another bullet/entry |
| Soft line wrapping | Remains presentation only and inserts no characters into the model |
| Paste | Insert `text/plain` at the selection; preserve hard breaks; remove source formatting, links, and images; never insert clipboard HTML into the live document |
| Clipboard with no usable plain text, or a file/image drop | Leave the document intact and explain that text is required; do not silently create an empty replacement |
| Text drop | Insert plain text as one history action at the resolved drop caret; test movement versus copying so a failed target insertion cannot erase the source |
| Tab / Shift+Tab | Finish the field edit and move through the normal focus order; no literal tab insertion by keyboard |
| IME composition | Let the platform own the composing DOM and candidate selection; commit the final text once composition finishes |

All existing string fields can retain hard breaks; the public schema already permits them. This plan does not silently turn a multi-line name into a concatenated or space-separated name. Normalize newly authored CRLF/CR line endings to LF, with no automatic trimming, accent removal, Unicode normalization, or whitespace collapse. Import and backup preserve existing string content. T3 must verify that explicit breaks render consistently in document text and PDF; the shared representation is plain text containing `\n`.

Own serialization in a tested `readPlainText`/selection adapter. Explicit `<br>` and block boundaries produced by a browser must map to hard breaks, while layout-induced wrapping and CSS text transformations must not change stored content. Preserve leading, repeated, and trailing breaks and distinguish a browser's empty-editor filler from an intentional newline. Avoid both raw `textContent` and an unqualified switch to `innerText`. Use text nodes/DOM ranges to insert normalized text and render authoritative replacements; no `innerHTML`, deprecated editing commands, or rich-text schema is needed.

Use `beforeinput` when cancelable to handle line breaks, paste/format commands, and application undo/redo. Always handle `input` as the reconciliation path for spelling corrections, autofill, and non-cancelable events. Mozilla documents that [beforeinput does not cover every modification and can be non-cancelable](https://developer.mozilla.org/en-US/docs/Web/API/Element/beforeinput_event). During composition, do not normalize the DOM, remount the field, or intercept candidate-selection Enter/Escape. Publish an active-draft state so exports, replacement actions, and the saved indicator cannot pretend the unfinished composition has been committed. Complete or cancel composition through the platform before executing queued document actions; do not guess from a timer.

Every field requires a programmatic label, `role="textbox"`, and `aria-multiline="true"` for this behavior. Example names are “Full name,” “Contact item 2,” “Section title, section 1,” “Job title or degree, entry 2 in Experience,” and “Bullet 1, entry 2 in Experience.” Index context distinguishes repeated/empty values; freeze contextual names during an active edit to avoid announcing changing labels on every keystroke. The placeholder remains a visual hint, never the sole accessible name. Provide a visible active-field label or compact instruction outside measured document content, with the same words in the programmatic name. T3 owns its placement and target geometry; the programmatic names ship with T2.

Give resume sections real heading structure surrounding the editing field; keep the heading's semantics separate from the textbox role. Verify the resulting heading name and textbox in the accessibility tree and actual screen-reader navigation. Do not put competing heading/textbox roles on one element. Preserve normal tab order, visible focus, and reachable actions, and keep helper labels out of PDF/export content. Add/remove controls retain precise contextual names. Use a stable polite status region for save and recovery outcomes, without announcing “saving/saved” on every keystroke.

**History, structural actions, and focused DOM reconciliation.**

Use immutable document snapshots in a bounded history of at most 100 undoable groups; clear redo when a new effective user action follows undo. Resume content and constraints participate in the same history. Reuse structural sharing from the current helpers, and test memory/latency with a realistically large resume before considering patches or more elaborate history storage. History is in memory for the current application session; it is not a backup or a promise of undo after reload.

Coalesce ordinary consecutive typing/deletion in the same field while successive events are less than 750ms apart. Close the group on blur, selection relocation, a different field, a change of operation kind, or any document command. Paste, cut, text drop, explicit hard break, structural add/remove, completed composition, restore, and reset each have their own group. A constraint stepper gesture forms one group and ends on release/blur; do not combine unrelated constraint changes. Set the history boundary independently of the autosave schedule.

Provide Undo/Redo buttons and standard document shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, and Ctrl+Y. In document fields, route native `historyUndo`/`historyRedo` input types through this history as well, including browser menu/touch routes where available. Prevent a second browser-native undo from changing only the DOM; if a non-cancelable native history event slips through, restore the authoritative session value before applying the one intended command. Handle each gesture once. Do not steal shortcuts inside unrelated native inputs or while IME is choosing a candidate. A shortcut on the document action surface acts on document history.

Structural actions first finish the active field transaction, then operate on the current data. Increment `reconciliationEpoch` after structural changes and whole-document/history replacements. Key the field subtree by that epoch using a React Fragment; keep the `.resume-page` root and its `pageRef` stable for T3. This deliberately remounts index-keyed fields at structural boundaries rather than adding IDs to the public schema. Ordinary typing does not remount anything.

History frames include focus anchors: typed field path plus UTF-16 selection offsets and direction. After a text undo, restore focus/caret in that field. After adding an item, focus its first field; after deletion, focus the nearest surviving sibling, then its parent action if no sibling exists. Undoing deletion restores and focuses the removed content. Restore/reset focus the name field. Selection offsets must be clamped to the new value without splitting surrogate pairs. Scroll only enough to reveal the chosen focus; do not reset canvas scroll on routine typing.

External or historical values must update the DOM even if the previous field was focused. Only a matching edit token from the current epoch may emit input/blur changes. This prevents an old blur event from restoring text after import or undo. For a nonstructural programmatic replacement, compare the update's origin/token with the active edit and apply the authoritative value with a saved selection; “never sync while focused” is removed. Tests must invoke replacement while focus is actually inside the field, not only after a simulated blur.

Reset replaces both content and constraints with their documented defaults, following a confirmation that states both effects. It is one undoable action and does not clear history. Restore first parses and validates the file, then presents the replacement confirmation; canceled, invalid, unsupported, or unreadable files change neither document nor history. Recheck the document revision before applying a file that was read asynchronously. If the document changed during the read/confirmation, refresh the confirmation against the latest state rather than applying an obsolete decision.

**Transactional persistence and two-tab behavior.**

Use native IndexedDB database `presume-document`, database version 1, with a `documents` object store containing key `current`, plus a `metadata` store for migration/recovery provenance. A single `StoredDocument` contains content and constraints. Keep database version and record schema version distinct. Generate an opaque next revision before the write transaction; `updatedAt` is display metadata and never a conflict-ordering authority.

The HTML specification advises treating [localStorage as having no locking mechanism](https://html.spec.whatwg.org/multipage/webstorage.html#the-localstorage-attribute). A get/compare/set sequence or a BroadcastChannel election cannot provide the needed atomicity. IndexedDB serializes overlapping read/write transactions; one transaction can read the current revision and conditionally replace the record. That scheduling guarantee is defined in [IndexedDB transaction scheduling](https://w3c.github.io/IndexedDB/#transaction-scheduling).

`commit(expectedStorageRevision, immutableData)` opens one `readwrite` transaction over `documents`, reads `current`, validates its schema, and compares its revision with `expectedStorageRevision` inside that same transaction. A mismatch, unexpected deletion, invalid record, or unsupported schema returns a typed conflict/recovery result without overwriting it. Only a match permits the new record to be put. Creation expects an absent record. Resolve “saved” from `transaction.oncomplete`, not the individual put request's success. Keep network, timers, hashing, user prompts, and unrelated awaits outside the transaction; transactions can become inactive between tasks, as explained in [IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction).

The session permits one in-flight commit. After every committed input it marks the current data pending and schedules the latest snapshot, with a short 150ms coalescing delay and a 1s maximum wait. Blur, structural actions, and internal navigation flush that delay. The in-flight payload is immutable and carries its document revision. When it completes, advance the last-persisted payload/revision to exactly what was committed, then compare against the latest local snapshot. If the user typed or undid something meanwhile, retain those changes and enqueue the newest snapshot using the returned storage revision. Never replace the UI with the completed save's older payload or mark later edits saved. A conflict pauses automatic commits; retry cannot silently rebase a stale whole document over the winning version.

Use BroadcastChannel only to announce a committed revision and request a re-read; messages contain no resume content. Re-read on window focus, `pageshow`, and return to visible state as well. If BroadcastChannel is missing or messages are missed, the next conditional transaction still prevents overwriting a newer record. Availability and same-origin messaging are documented in the [BroadcastChannel reference](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel). A notification is a hint, never an authoritative document or lock.

| Observed change | Session behavior |
| --- | --- |
| Another tab saved; this tab has no local changes, active field, or pending write | Adopt the validated record, clear local history, increment the document revision/epoch, and announce the update |
| Another tab saved while this tab is focused in a field, composing, dirty, or saving | Keep this tab's content/caret; retain the other record as a candidate; finish any already-started transaction and enter the appropriate conflict state |
| Two tabs commit from the same base revision | Exactly one replaces `current`; the other receives a conflict and keeps its entire local draft |
| Saved record disappeared, storage was cleared, or an incompatible record appeared | Preserve the in-memory draft and show recovery choices; do not recreate or replace automatically |

A conflict offers “Download this tab's backup,” “Download saved version,” “Use saved version,” and “Replace saved version with this tab.” The replacement choice explicitly states that it replaces the complete saved document; there is no automatic field merge. Using the saved version confirms discarding local edits and clears local undo/redo only after the chosen record loads. Replacing it performs another conditional transaction against the revision shown to the user. If another tab writes again, remain in conflict and present the newer candidate. Cancellation keeps both versions available. Pending/composing edits must be settled before either choice is applied.

The losing tab's draft is retained in memory and downloadable; this design does not create a persistent branch library. Clearly report that its conflicting changes have not been saved. A page-close warning is appropriate while there is unsaved work, but cannot establish durability: [beforeunload is unreliable on some lifecycle paths](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event). A forced browser/device shutdown can lose an uncommitted draft. Do not describe browser storage or in-memory conflict recovery as an independent backup.

**Startup, storage failures, and migration.**

Async hydration gates editing. Initially show loading state; do not render an editable default template or run a save effect before reads settle. Landing actions remain usable with neutral “Open the editor” wording while discovery is unknown. Show “Continue editing” only after a valid current or recoverable legacy document is discovered; inaccessible or invalid data is not evidence of a saved usable document. Keep one controller through the route change, so returning to the landing does not discard unsaved edits. T5 owns route focus/scroll; T2 removes the unguarded `hasSavedResume()` read.

After a slow or blocked open, offer Retry and Continue without browser saving with an explanation. Choosing the latter creates a deliberate in-memory session, preferably seeded from a validated read-only legacy candidate when available. Invalidate the old hydration request; a late result must never replace new local edits. Retrying storage later reads its current revision and presents any competing document before saving. There is no fallback that writes the legacy keys.

| Load/save outcome | Required recovery behavior |
| --- | --- |
| No current record and no legacy data | Use the sample in memory; first effective user edit creates the first saved document |
| Valid stored document | Hydrate content and constraints together and mark that exact payload saved |
| Invalid JSON/shape in legacy data or invalid current record | Keep the original bytes/value untouched; show recovery, offer a download of readable raw data, and require a deliberate replacement before writing |
| Unknown future schema/backup version | Preserve the original, report that this version cannot read it, and offer download/retry; never interpret it as an empty document |
| Storage access/read denied or unavailable | Keep the app usable in explicit unsaved mode; Retry and Download backup remain available; do not claim the old draft was absent |
| Quota, transaction abort, or other write error | Keep the latest in-memory document and history; show “Changes are not saved in this browser,” the available recovery actions, and a Retry control |
| Upgrade blocked by another connection | Report the blocked state, offer retry/unsaved operation, and explain which tabs to close or reload without deleting the database |
| `versionchange` or abnormal connection close during editing | Stop new writes, close the connection as required, retain local state, and expose recovery/reload actions; never force a reload with unsaved edits |

Use structured errors that distinguish read, validation, version, quota, and availability outcomes. Do not expose resume text in thrown errors or console logs. Keep save failure banners visible until resolved/dismissed with the persistent status still truthful. “Saved in this browser” communicates storage location; supporting backup help explains browser/profile isolation, clearing data, and portability. Keep the theme preference separate. Its writes are already caught, but [initializeTheme](../../src/theme.ts) evaluates `window.localStorage` before entering the reader's catch, and [main.tsx](../../src/main.tsx) calls it before rendering React. Include that getter in the defensive startup boundary so denied storage cannot prevent the recovery UI from mounting. Test a throwing storage getter as well as throwing `getItem`/`setItem` methods.

Migration is one way from `presume:resume` and `presume:constraints`; new code never writes or deletes those legacy keys. With no current IndexedDB record, read both legacy strings defensively and validate them separately. A valid legacy Resume with a missing constraints key receives documented default constraints; an invalid present constraints value is recovery, not a silent default. Missing Resume plus valid legacy constraints may initialize a sample with those constraints only after explaining that no saved resume was found. Preserve raw legacy inputs and the accepted pair as migration provenance in `metadata` in the same IndexedDB transaction that creates `current`. Concurrent new tabs cannot migrate over an already-created record.

Read the legacy pair again after migration, listen for legacy `storage` events, and recheck it when the application becomes visible. Compare with the exact accepted/acknowledged migration pair. A difference becomes a separate legacy recovery candidate and a notice that an older tab may contain edits. Keep the original migration snapshot and original keys; provide downloads and an explicit route to restore the candidate through the ordinary backup/history/concurrency path. Do not automatically apply it, mirror it into the new store, or mark it more recent by timestamp. If a read-only legacy candidate is adopted, validate its content and constraints again and record the user's acknowledgment only after the new conditional write succeeds.

An old running bundle cannot obey this protocol and can still overwrite other old tabs' legacy keys. No migration claim can make those old writers safe. Modern writes stay isolated in IndexedDB, and later legacy changes are surfaced for recovery. Explain that older editor tabs should be backed up and closed/reloaded before continuing mixed-version work. There is no atomic snapshot across two localStorage keys and IndexedDB; the post-migration comparison detects observable divergence, but cannot reconstruct old edits already overwritten by old code. This limitation belongs in rollout notes and a mixed-version browser regression case.

**Complete backups and restore.**

Use a dedicated `documentBackup.ts` codec and file-reading/download helpers, leaving the PDF renderer API in [export.ts](../../src/export.ts) available to T3/T4. A new backup is:

```json
{
  "format": "presume-backup",
  "version": 1,
  "exportedAt": "2026-09-10T12:00:00.000Z",
  "data": {
    "resume": { "name": "Example", "contact": [], "sections": [] },
    "constraints": { "maxPages": 1, "maxLinesPerBullet": 3, "minFontSize": 12 }
  }
}
```

`format` and `version` select the decoder; validate `data.resume` with `validateResume` and `data.constraints` with `parseConstraints`. Build fresh validated objects and strip unknown ordinary fields. An envelope identifying itself as a Presume backup with an unsupported version or invalid/missing constraints fails as that envelope; do not fall through to legacy Resume parsing. `exportedAt` is descriptive, never an authority for choosing a document. The backup omits storage revisions, migration raw data, history, Review results/provider secrets, and device-specific layout measurements.

Continue accepting bare Resume JSON produced by the current exporter. For that legacy format, preserve the current constraints and explain before replacement: “This file contains resume text only. Your current formatting settings will be kept.” A fresh session already has defaults, so this remains predictable in another browser. A versioned backup restores exactly its validated constraints. Reject invalid semantic constraint values rather than clamping an imported document without consent. The public Resume validator and the existing plain Resume schema remain usable independently.

Download from `prepareSnapshot()` so text still focused in a field is included. The confirmation/error surface and filename should explain purpose (“Download backup” / “Restore backup,” `presume-backup.json`), with JSON as secondary format detail. These functional labels can ship with the repaired actions, coordinated with T1/T5; a broad toolbar redesign is outside this package. Display success only after the browser download action has been initiated; do not claim the user saved the file to disk. Import cancellation/errors must preserve the original file input's ability to select the same file again.

**Shared interfaces and file ownership.**

| Owner | Files/surfaces | Handoff |
| --- | --- | --- |
| T2 | Proposed `src/documentSession.ts`, `src/useDocumentSession.ts`, `src/documentBackup.ts`; replacement of document logic in `src/storage.ts` and `src/useResume.ts`; their focused tests | Session types, transaction contract, history semantics, migration and backup format |
| T2, followed by explicit T3 handoff | `EditableText.tsx`, `ResumeHeader.tsx`, `Section.tsx`, `Entry.tsx`, `Bullet.tsx`, `ResumePage.tsx` | Typed field/command callbacks, contextual labels, stable page root, reconciliation epoch and focus restoration; T3 subsequently owns control positioning and content geometry |
| T2, coordinated integration | `App.tsx`, `Toolbar.tsx`, `AppHeader.tsx`, the narrow storage-getter guard in `theme.ts`, targeted status/label CSS | Session lifetime, safe startup, save/recovery controls, history and file actions; T5 later changes visual hierarchy and route presentation |
| T3 | `useResizeEngine.ts`, formatting modules, PDF modules, document tokens and geometry CSS | Given `{ data, documentRevision }`, return a layout result tagged with that same revision; editor-only helpers must not enter content measurement |
| T4 | `useResumeReview.ts`, Review UI/client/service, contracts and dependency files | Consume prepared snapshot and revision-tagged layout; preserve result-to-submission identity without assuming saved status equals current content |
| T6 | Integrated fixtures and cross-browser/user verification | Validate the fixed commit across text, history, saves, backups, fitting and PDF output |

T2 publishes `prepareSnapshot()` and `documentRevision` without rewriting Review's state machine. T3 must bind `globalScale`/readiness to the measured revision. Export and Review capture immutable data and the matching completed layout result before starting asynchronous work; later edits cannot change that request's input. T4 records that revision with each returned result and derives staleness against the current revision, including changes during a failed rerun. Constraint changes invalidate the artifact revision even when resume text did not change. T4 may later compare exact artifact inputs to recognize an identical undo result, but a conservative stale result is preferable to presenting a different document's review as current.

Keep the existing PDF helper signature until T3/T4 explicitly integrate the revision wrapper. T2 exposes the contract and checks callers use a flushed snapshot; T3/T4 own layout readiness and review correctness respectively. Declare shared-file ownership before parallel edits. Avoid simultaneous independent implementations in `App.tsx`, `Toolbar.tsx`, or the document components.

**Ordered PR-sized implementation steps.**

Each step includes the relevant tests in the same change and an independent review. The September 12 implementation request selects T2-1; the other rows remain future deliverables. Keep one lead owner across the T2 changes. Parallel assistance is useful for a bounded browser-input investigation or test review, with explicit file ownership; it should not split canonical state and persistence across competing implementations.

| PR | Concrete change | Evidence required before integration |
| --- | --- | --- |
| T2-1: Document format and complete backup | Add `DocumentData`/backup codec, strict envelope validation, bare Resume import compatibility, and toolbar backup/restore of both content and constraints. Keep PDF exports untouched. | Actual file download → fresh browser restore preserves non-default constraints and all text; malformed/unknown envelopes and legacy import behave as specified. F09 can close here. |
| T2-2: Session and history | Introduce the reducer/controller and React adapter; move commands/constraints/import/reset through it; retain state across internal routes; add bounded undo/redo and focus epochs. Keep the old persistence adapter only as a caught, explicitly transitional writer until T2-4; do not claim F05 fixed. | Structural undo/redo and focused import/reset work; typing grouping, redo invalidation, index shifts, no-op actions, and 100-group cap pass; a failed transitional write retains the application and unsaved state. |
| T2-3: Plain-text accessible editing | Replace rich editing semantics with the bounded input adapter, composition handling, labels/headings, keyboard history integration, and selection recovery. | Real typing/paste/Enter in three engines, actual focused-field replacements, AX inspection, manual IME/assistive-tech checks with limitations recorded. F03/F07 close only with appropriate evidence. Hand the settled component interfaces to T3. |
| T2-4: Atomic document repository | Add the IndexedDB adapter, typed hydration/failure outcomes, serialized conditional commits, migration provenance and legacy detection; remove all document legacy writes and unguarded landing reads. | Real concurrent tab transactions, delayed saves followed by new input, storage-denied/quota/abort/blocked cases, migration/mixed-version scenarios and no template write before hydration. This adapter change requires its recovery/status UI in the same PR. |
| T2-5: Recovery and integrated document journey | Refine and validate already-functional conflict choices and retry/backup routes, navigation/close handling, integrated docs, and regression coverage across the preceding changes. Coordinate T3/T4 snapshot consumption. | Edit → delete → undo → save → reopen → restore elsewhere → export; all assigned findings rechecked on the integrated commit, with F01 jointly closed with T3. No unsupported save claims remain. |

T2-2's transitional localStorage code must catch reads/writes and expose actual outcomes; it is intentionally not the final concurrency implementation. If the migration/recovery work would make T2-4 too large to review, split internal adapter and migration tests into a preparatory PR that is not wired to production, followed by one cohesive UI/runtime activation PR. Do not deploy the new data path with recovery controls deferred to a later change. T2-5 refines and validates already-functional recovery; it does not supply missing safety for T2-4.

**Meaningful acceptance and verification.**

Use the repository's Node 24/Python 3.11 verification baseline until the runtime owner changes it. The existing [storage tests](../../src/tests/storage.test.ts), [operation tests](../../src/tests/resumeOperations.test.ts), [app integration tests](../../src/tests/appIntegration.test.tsx), and [browser tests](../../e2e/unconfigured.spec.ts) are useful starting points. They currently omit the relevant browser input and concurrency interleavings. Replace brittle source-string or exact-button-count expectations when they merely encode old presentation. Retain behavior and contract coverage.

| Layer | Required scenarios and observable outcome |
| --- | --- |
| Pure reducer/codec tests | Resume+constraints replacements are atomic; validators stay compatible; grouping/cap/redo/no-op behavior; invalid paths/epochs cannot edit a shifted neighbor; complete/legacy/unknown/invalid backup cases |
| Persistence coordinator tests | Older save resolves after later input and after undo; only its payload is acknowledged; latest draft remains dirty until its own commit; conflict/error callbacks never replace local content; disposed/obsolete hydration callbacks cannot reinitialize a live session |
| Real browser storage tests | Two pages in one browser context load the same base, dispatch independent edits concurrently, and race transactions: one save, one visible conflict, both drafts intact. Assert persisted data and UI, then retry after a third competing write. Disable BroadcastChannel to prove it is not the lock. |
| Hydration/migration tests | Slow read, missing/invalid/current/future records, bad constraints, denied legacy access, two simultaneous migrations, legacy writes before/during/after migration, current record deletion, blocked version upgrade, and reopening a recovered draft |
| Actual input tests | Type `Alice`, Enter, `Smith`; leading/repeated/trailing breaks, HTML paste with fonts/color/links, cross-field paste, selection replacement, cut/drop, undo via keyboard and browser input types. Compare visible text, session, stored data, backup, and export input; reload and compare again. |
| Focus/structure tests | Delete the first of repeated items; undo and edit the restored field; import/reset/undo while a field remains focused; late blur from removed DOM; add/remove an item during active editing. Focus and content must agree with the current epoch. |
| Failure recovery tests | Inject denied/open/transaction/quota failures before load and after edits; application remains visible, saved status is truthful, and the current full backup remains downloadable. Resume and constraints must never show mixed commit versions. |
| Cross-package tests | Export/Review uses the latest prepared input with matching measured revision, edits during work do not alter submitted input, and current result identity is independently tracked. T3 validates hard-break/PDF agreement; T4 validates failed rerun staleness. |

For concurrency tests, use real pages in the same browser context and native IndexedDB, not only a mock localStorage object or separate isolated browser contexts. Add a deterministic barrier at the repository's test seam so both sessions start from the same expected revision, then release their commits together. Also run the ordinary user sequence without the seam. A fake IndexedDB implementation, if later selected, is supplemental; it cannot establish browser transaction or lifecycle behavior by itself.

Manual acceptance includes Japanese/Chinese IME candidate selection and cancellation, emoji/combining characters, spelling correction, context-menu/touch undo, and keyboard-only editing with VoiceOver/Safari plus NVDA/Firefox or Chrome. Synthetic composition events alone do not prove real IME behavior. Inspect the default 48 fields and dynamically added fields for distinct names, roles, values, headings, focus, and status announcements. Check 200% zoom, both themes, forced colors where available, touch editing, and reduced motion for integrated regressions with T3. T3 owns glyph coverage; preserving characters in the model is not proof that PDF fonts can render them.

At each PR, run focused unit/browser checks and type checking for that change. Run full `npm run verify`, `npm run test:e2e`, and `npm run build` on the integrated release candidate under the declared runtimes. Add the assigned cross-browser cases to the maintained browser configuration rather than treating a one-time smoke script as coverage. Record exact versions, commit, artifacts, manual checks and unperformed checks. Do not call F03/F04/F05/F07/F09 or combined F01 fixed solely because the old suite remains green.

**Migration release and rollback conditions.**

Before activating the new repository, preserve old keys, validate normal and failure migrations, and check mixed old/new tabs. Document the new browser storage location, backup v1, legacy compatibility, history's session limit, and recovery messages in the product/architecture documentation. Browser-local data remains local to this origin/profile; this migration introduces no account, synchronization, service request, or analytics. Final persistence/backup copy must match the implemented failure states.

Block rollout on any unexplained content difference, incorrect revision acknowledgment, silent conflict overwrite, failed focused replacement, or absence of usable recovery from a write failure. Block the editing adapter on unresolved composition/clipboard loss in a supported browser. A failing native-field fallback or PDF line-break mismatch requires a T2/T3 decision before claiming complete editing fidelity.

After new writes exist, do not roll back by deploying the old bundle and resuming legacy writes: it cannot see the new current document and may present an older draft. Prefer a forward fix that can read schema version 1. An emergency recovery build should open the new store read-only and allow complete backup downloads while retaining the database and legacy keys. Any later change of storage format must add a compatible reader/migration first. Never delete the database or overwrite legacy keys as an automatic rollback.

**Decisions and remaining questions.**

Routine implementation choices resolved by this plan are one complete document payload, native IndexedDB conditional transactions, explicit conflicts instead of automatic merging, session-scoped bounded history, preserved plain text/newlines, backward-compatible bare Resume imports, and independent complete backups. These choices should be reviewed as a contract before implementation; they are not a claim of user approval for a production redesign.

No product question blocks preparing the T2 implementation work. T1/T5 should settle final action/status/help wording and presentation around these behaviors. Named variants, cloud synchronization, automatic merge, and persistent multi-session history remain separate product decisions outside T2. The primary technical tradeoff to validate early is whether the retained plain-text editing host stays smaller and more reliable than a native field integrated with T3's geometry. The PR gate above supplies a clear point to change that choice using browser evidence.

Original plan verification (September 10): source and audit review plus platform-documentation review; no application implementation, dependency installation, live user research, or product regression execution was performed for this planning task. Link and whitespace checks are recorded with the documentation handoff. Future implementation must reproduce the audit cases against its then-current checkout.
