# Milestone 17 Resume Editing Model Helpers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the resume editing model by extracting contact, section, entry, and bullet mutations into pure tested helper functions while preserving current inline editing behavior and JSON compatibility.

**Architecture:** Add a focused `src/resumeOperations.ts` module that owns immutable resume editing operations and default inserted values. Existing React components call these helpers instead of hand-writing array mutations. Tests verify helper behavior, immutability, safe out-of-range handling, and existing JSON validation compatibility.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Vite, FastAPI/Pytest backend verification.

## Global Constraints

- Preserve direct inline resume editing.
- Preserve JSON portability and the current plain `Resume` JSON schema.
- Preserve LocalStorage persistence.
- Preserve existing PDF export behavior.
- Preserve review feedback as advisory and non-mutating.
- Preserve normal Export PDF as the user-facing canvas/image export path.
- Preserve review-only extractable text appendix behavior for review submissions.
- Preserve `POST /reviews` multipart contract with required PDF field `file`.
- Preserve safe `/config` behavior.
- Preserve Milestone 13 responsive contracts.
- Preserve Milestone 15 Playwright E2E contracts, including `/presume/` base-path loading and multipart review upload validation.
- Keep tests deterministic and independent of real Ollama, `vendor/hiring-agent`, hosted credentials, or third-party network access.

---

## File Structure

- Create `src/resumeOperations.ts`: pure immutable editing operations and default values for added contacts, sections, entries, and bullets.
- Create `src/tests/resumeOperations.test.ts`: focused tests for operation results, immutability, defaults, and safe out-of-range behavior.
- Modify `src/components/ResumeHeader.tsx`: call name/contact helpers.
- Modify `src/components/ResumePage.tsx`: call section helpers.
- Modify `src/components/Section.tsx`: call entry helpers.
- Modify `src/components/Entry.tsx`: call bullet helpers.
- Modify `src/tests/types.test.ts`: strengthen JSON compatibility coverage for unknown-field stripping.
- Modify docs: `docs/MILESTONE_PLAN.md`, `docs/README.md`, `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `README.md`.

---

### Task 1: Add Pure Resume Operation Helpers

**Files:**
- Create: `src/resumeOperations.ts`
- Create: `src/tests/resumeOperations.test.ts`

**Interfaces:**
- Consumes: `Resume`, `ResumeSection`, `ResumeEntry` from `src/types.ts`.
- Produces:
  - `DEFAULT_CONTACT_ITEM: string`
  - `DEFAULT_SECTION: ResumeSection`
  - `DEFAULT_ENTRY: ResumeEntry`
  - `DEFAULT_BULLET: string`
  - `updateResumeName(resume: Resume, name: string): Resume`
  - `updateContactItem(resume: Resume, index: number, value: string): Resume`
  - `addContactItem(resume: Resume, value?: string): Resume`
  - `removeContactItem(resume: Resume, index: number): Resume`
  - `updateSection(resume: Resume, sectionIndex: number, section: ResumeSection): Resume`
  - `addSection(resume: Resume, section?: ResumeSection): Resume`
  - `removeSection(resume: Resume, sectionIndex: number): Resume`
  - `updateEntry(section: ResumeSection, entryIndex: number, entry: ResumeEntry): ResumeSection`
  - `addEntry(section: ResumeSection, entry?: ResumeEntry): ResumeSection`
  - `removeEntry(section: ResumeSection, entryIndex: number): ResumeSection`
  - `updateBullet(entry: ResumeEntry, bulletIndex: number, text: string): ResumeEntry`
  - `addBullet(entry: ResumeEntry, text?: string): ResumeEntry`
  - `removeBullet(entry: ResumeEntry, bulletIndex: number): ResumeEntry`

- [ ] **Step 1: Write the failing tests**

Create `src/tests/resumeOperations.test.ts` with tests that import all functions listed above. Include assertions for expected updates, defaults, input immutability, and out-of-range no-op behavior.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/tests/resumeOperations.test.ts`
Expected: FAIL because `../resumeOperations` does not exist.

- [ ] **Step 3: Implement helpers**

Create `src/resumeOperations.ts`. Use immutable spreads/slices. For out-of-range update/remove, return the original object reference unchanged to make no-op behavior explicit and cheap.

- [ ] **Step 4: Run helper tests**

Run: `npm test -- --run src/tests/resumeOperations.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/resumeOperations.ts src/tests/resumeOperations.test.ts
git commit -m "Add tested resume editing operations"
```

---

### Task 2: Wire Components To Operation Helpers

**Files:**
- Modify: `src/components/ResumeHeader.tsx`
- Modify: `src/components/ResumePage.tsx`
- Modify: `src/components/Section.tsx`
- Modify: `src/components/Entry.tsx`
- Test: existing `src/tests/appIntegration.test.tsx`, `src/tests/reviewUi.test.tsx`, and `src/tests/resizeEngine.test.ts`

**Interfaces:**
- Consumes: helpers from `src/resumeOperations.ts`.
- Produces: unchanged component props and rendered DOM behavior.

- [ ] **Step 1: Add component integration regression tests if needed**

Run existing integration tests first because they already cover inline editing, add/remove controls indirectly, persistence, review annotation mapping, and shell behavior.

Run: `npm test -- --run src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx`
Expected: PASS before refactor.

- [ ] **Step 2: Replace inline mutations in `ResumeHeader.tsx`**

Import `updateResumeName`, `updateContactItem`, `addContactItem`, and `removeContactItem`. Use helpers for name/contact callbacks while preserving labels/placeholders.

- [ ] **Step 3: Replace inline mutations in `ResumePage.tsx`**

Import `updateSection`, `addSection`, and `removeSection`. Use helpers for section callbacks while preserving the `+ section` button and current DOM.

- [ ] **Step 4: Replace inline mutations in `Section.tsx`**

Import `updateEntry`, `addEntry`, and `removeEntry`. Use helpers for entry callbacks while preserving the `+ entry` button and current DOM.

- [ ] **Step 5: Replace inline mutations in `Entry.tsx`**

Import `updateBullet`, `addBullet`, and `removeBullet`. Use helpers for bullet callbacks while preserving the `+ bullet` button, delete button, warnings, and review annotations.

- [ ] **Step 6: Run focused frontend tests**

Run: `npm test -- --run src/tests/resumeOperations.test.ts src/tests/appIntegration.test.tsx src/tests/reviewUi.test.tsx src/tests/resizeEngine.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ResumeHeader.tsx src/components/ResumePage.tsx src/components/Section.tsx src/components/Entry.tsx src/resumeOperations.ts src/tests/resumeOperations.test.ts
git commit -m "Use resume operation helpers in editor components"
```

---

### Task 3: Strengthen JSON Compatibility Tests

**Files:**
- Modify: `src/tests/types.test.ts`

**Interfaces:**
- Consumes: existing `validateResume(data: unknown): Resume | null` from `src/types.ts`.
- Produces: test coverage that current plain resume JSON stays accepted and unknown fields remain stripped.

- [ ] **Step 1: Add compatibility tests**

Add tests to `src/tests/types.test.ts` verifying:

```ts
it('strips unknown fields from valid resume JSON', () => {
  const resume = validateResume({
    schemaVersion: 99,
    name: 'Jake Ryan',
    contact: ['jake@example.com'],
    sections: [
      {
        id: 'section_1',
        title: 'Experience',
        entries: [
          {
            id: 'entry_1',
            title: 'Engineer',
            subtitle: 'Acme',
            location: 'NYC',
            dateRange: '2020–2022',
            bullets: ['Did things'],
            metadata: { hidden: true },
          },
        ],
      },
    ],
  })

  expect(resume).toEqual({
    name: 'Jake Ryan',
    contact: ['jake@example.com'],
    sections: [
      {
        title: 'Experience',
        entries: [
          {
            title: 'Engineer',
            subtitle: 'Acme',
            location: 'NYC',
            dateRange: '2020–2022',
            bullets: ['Did things'],
          },
        ],
      },
    ],
  })
})
```

- [ ] **Step 2: Run compatibility tests**

Run: `npm test -- --run src/tests/types.test.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/tests/types.test.ts
git commit -m "Cover resume JSON compatibility"
```

---

### Task 4: Update Documentation And Milestone Status

**Files:**
- Modify: `docs/MILESTONE_PLAN.md`
- Modify: `docs/README.md`
- Modify: `docs/PRODUCT_SPEC.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: implemented helper module and tests.
- Produces: accurate docs stating Milestone 17 completed a narrow internal editing-model improvement without public JSON format changes.

- [ ] **Step 1: Update milestone plan**

Change Milestone 17 status from `Planned` to `Complete`. Add completion evidence for `src/resumeOperations.ts`, `src/tests/resumeOperations.test.ts`, component integration, JSON compatibility tests, docs, and verification commands.

- [ ] **Step 2: Update architecture docs**

In `docs/ARCHITECTURE.md`, add `src/resumeOperations.ts` to the frontend module table and state that the public data model remains unchanged while component mutations are routed through pure helpers.

- [ ] **Step 3: Update product/docs/README files**

Update `docs/README.md`, `docs/PRODUCT_SPEC.md`, and `README.md` to remove “still planned” language for this narrow milestone and describe the completed internal editing model helpers. Do not claim a full data-format change, stable IDs, reorder UI, or hosted/backend work.

- [ ] **Step 4: Run docs diff review**

Run: `git diff -- docs/MILESTONE_PLAN.md docs/README.md docs/PRODUCT_SPEC.md docs/ARCHITECTURE.md README.md`
Expected: docs accurately describe only implemented work.

- [ ] **Step 5: Commit**

```bash
git add docs/MILESTONE_PLAN.md docs/README.md docs/PRODUCT_SPEC.md docs/ARCHITECTURE.md README.md
git commit -m "Document milestone 17 editing model helpers"
```

---

### Task 5: Full Verification And PR Prep

**Files:**
- No source files expected unless verification reveals a defect.

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: verified Milestone 17 branch ready for PR.

- [ ] **Step 1: Run backend tests**

Run: `python3 -m pytest review-service/tests -q`
Expected: `49 passed`.

- [ ] **Step 2: Run frontend tests**

Run: `npm test -- --run`
Expected: all Vitest files pass, including `src/tests/resumeOperations.test.ts`.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: TypeScript and Vite build pass.

- [ ] **Step 4: Run browser E2E tests**

Run: `npm run test:e2e`
Expected: unconfigured and configured Playwright suites pass.

- [ ] **Step 5: Check git status**

Run: `git status --short --branch`
Expected: clean working tree on `main` ahead of `origin/main` by the Milestone 17 commits.

- [ ] **Step 6: Create PR**

Push a Milestone 17 branch and create a PR titled `Milestone 17: Resume editing model helpers`. Include the exact verification command results in the PR body.
