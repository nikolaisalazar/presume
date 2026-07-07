# Milestone 17 Resume Editing Model Helpers Design

## Context

Presume's primary UX goal is direct inline resume editing while Pretext handles the resizing work that makes resume editing tedious. The current editor already supports that workflow, but add/update/remove behavior for contact items, sections, entries, and bullets is spread across React components. Milestone 17 should improve the editing model without destabilizing the proven review, export, persistence, and browser contracts.

## Decision

Implement the narrowest useful Milestone 17 slice: extract resume editing mutations into pure, tested helper functions while preserving the current public resume JSON schema exactly.

This is an internal model improvement, not a visible editor redesign and not a full data-format migration.

## Goals

- Keep direct inline editing unchanged.
- Keep Pretext-driven resizing unchanged.
- Keep the current `Resume` JSON shape importable/exportable.
- Make editing operations easier to test and reuse.
- Reduce index-array mutation logic inside UI components.
- Preserve advisory, non-mutating review behavior.
- Preserve existing PDF export behavior and review upload contracts.

## Non-Goals

- No schema-versioned JSON envelope.
- No stable IDs for sections, entries, or bullets.
- No reorder UI.
- No broad visual redesign.
- No review UX redesign.
- No backend, auth, database, queue, or hosted-provider changes.

## Proposed Module

Add `src/resumeOperations.ts` with pure helpers for common editing operations:

- `updateResumeName(resume, name)`
- `updateContactItem(resume, index, value)`
- `addContactItem(resume, value?)`
- `removeContactItem(resume, index)`
- `updateSection(resume, sectionIndex, section)`
- `addSection(resume, section?)`
- `removeSection(resume, sectionIndex)`
- `updateEntry(section, entryIndex, entry)`
- `addEntry(section, entry?)`
- `removeEntry(section, entryIndex)`
- `updateBullet(entry, bulletIndex, text)`
- `addBullet(entry, text?)`
- `removeBullet(entry, bulletIndex)`

The helpers return fresh objects/arrays and do not mutate their inputs. Out-of-range removals and updates should leave the input value structurally unchanged or return an equivalent copy without throwing; the UI should remain forgiving.

Default added values should match today's UI behavior:

- contact: `contact@example.com`
- section: `{ title: 'New Section', entries: [] }`
- entry: current `Section.addEntry` default
- bullet: `New bullet point`

## Component Integration

Update existing components to call the helpers instead of hand-writing array manipulation:

- `ResumeHeader.tsx` for name/contact operations.
- `ResumePage.tsx` for section operations.
- `Section.tsx` for entry operations.
- `Entry.tsx` for bullet operations.

The rendered DOM, labels, placeholders, add/remove controls, and inline `contenteditable` behavior should remain unchanged.

## Import/Export Compatibility

Keep `Resume`, `ResumeSection`, and `ResumeEntry` unchanged. Keep `validateResume`, LocalStorage persistence, `exportJSON`, and `importJSON` compatible with current plain resume JSON. Add or strengthen tests that prove valid current-shape JSON remains accepted and unknown fields remain stripped.

## Review And Export Boundaries

Do not change:

- `renderResumePageToPDFBlob` or normal `exportPDF` behavior.
- Review-only extractable text appendix behavior.
- `POST /reviews` multipart upload shape.
- Review result rendering or annotation matching.
- Review stale-state behavior.
- Review feedback advisory/non-mutating guarantee.

Because the public resume shape and rendered DOM classes remain unchanged, review/export contracts should continue to pass existing tests.

## Testing Plan

Add `src/tests/resumeOperations.test.ts` covering:

- Each helper returns the expected updated model.
- Helpers do not mutate input objects or arrays.
- Defaults for added contact/section/entry/bullet match current UI behavior.
- Out-of-range operations are safe.

Update `src/tests/types.test.ts` or add import/export-focused coverage proving:

- Current plain resume JSON validates.
- Unknown fields are stripped during validation.
- Missing required fields still reject.

Run full verification:

```sh
python3 -m pytest review-service/tests -q
npm test -- --run
npm run build
npm run test:e2e
```

## Documentation Updates

Update milestone/product/architecture docs to say Milestone 17 improved the internal editing model with tested operation helpers while preserving the public JSON format and all review/export contracts.
