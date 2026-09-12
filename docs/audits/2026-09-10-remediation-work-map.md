Use four milestones and six focused work threads over time, with this audit conversation available for coordination. Start with at most two concurrent coding threads. Within each thread, keep one lead responsible for the outcome and delegate bounded investigation, implementation, or review only where the work can proceed independently.

The user adopted this execution structure on September 10, 2026 and authorized the documentation kickoff: commit the audits, update the milestone tracker, and begin T1 product direction and the T2 document-state implementation plan. Product changes remain recommendations until selected. Application implementation and the later work packages have not started.

Source reports:

- [Codebase audit: F01–F19](2026-09-10-codebase-product-audit.md)
- [Product and landing assessment](2026-09-10-product-and-landing-audit.md)

The four milestones are product direction, dependable product behavior, landing and first-use delivery, and validation. Review engineering belongs in the dependable-behavior milestone; its product presentation also informs the landing. Each milestone can contain several small PRs.

| Thread | Milestone | Outcome and audit coverage | Dependencies |
| --- | --- | --- | --- |
| T1: Product direction | 18 | Revised audience/task statement, claim-to-evidence map, representative copy, landing structure, first-use priorities, and Review's public role | Working brief prepared; distinguish adopted decisions from proposals |
| T2: Document state and editing | 19 | Plain-text editing, accessible field semantics, reliable persistence and save status, tab conflict handling, structural undo, complete backup/restore. Owns F03, F04, F05, F07, F09; supplies undo for F01 | Plan prepared; establish the document-session and backup contracts before dependent UI work |
| T3: Layout, controls, and PDF | 19 | Exclusive action targets, controls outside document flow, consistent fitting/export, glyph coverage, pagination, contrast, and motion-independent measurement. Owns F01, F02, F06, F08, F16, F19 | Use T2's editing/undo contract; serialize changes to shared document components |
| T4: Review and service | 19 | Correct stale state, discovery retry/deadlines, provider disclosure, useful feedback, early upload limits, compatible dependency updates, truthful readiness. Owns F10, F11, F12, F13, F14, F15, F18 | Backend work can begin independently; frontend integration uses T2's revision model and T1's product decisions |
| T5: Landing and first use | 20 | Implement selected copy/narrative, verified desktop and mobile proof, practical first-use guidance and action labels, project links, route scroll/focus. Owns F17 and selected product recommendations | T1's direction; T2/T3 behavior for production evidence; T4 results for real Review examples |
| T6: Integrated validation | 21 | Verify the combined product, exercise both user journeys, prepare user-test tasks, record observed results, finish the case study and release evidence | Integrated implementation; real participants for customer evidence |

F01 is complete only when T3's correct hit targets and T2's undo work together. F15 has one dependency owner in T4 even when an update affects another package. T6 verifies all findings; it does not inherit unfinished implementation by default.

**Sequence.** Begin T1 and T2 after preserving the audit baseline. T1 is primarily product/design work, so T4's backend can be the second coding thread if capacity permits. T3 can investigate PDF/layout cases during this period, but document-component edits should follow the agreed T2 interface or use an explicit ownership handoff. T5 can prepare disposable copy/layout studies once the direction is selected; final production captures wait for working behavior. T6 performs focused checks as packages arrive and a final integrated pass. There is no benefit in opening every thread on day one.

**Coordination.** Keep milestone state in the repository. [MILESTONE_PLAN.md](../MILESTONE_PLAN.md) is the milestone authority; Milestones 18–21 track this work. The older `docs/IMPLEMENTATION_PLAN.md` is historical review-integration material. It should not silently determine this work's order.

The coordinating owner maintains the selected product decisions, package dependencies, shared interfaces, and integration order. Each work thread handles its own implementation and verification and returns a concise handoff: changed behavior, audit IDs addressed, branch/commit, relevant tests and artifacts, and unresolved limitations. A new conversation should receive this repository context explicitly. It should not rely on automatic access to another thread's reasoning.

**Use worktrees for concurrent writers.** A chat is an organizational boundary; a worktree gives it a separate checkout. Official OpenAI documentation describes [worktrees for independent parallel chats](https://learn.chatgpt.com/docs/environments/git-worktrees). Use one worktree and distinct branch per concurrently writing thread. Subagents in this session share their parent's workspace unless they are explicitly assigned a separate checkout, so spawning them alone does not isolate files.

Worktrees prevent simultaneous edits to the same checkout, but integration still needs ownership. Important shared surfaces are `App.tsx`, `Toolbar.tsx`, `EditableText.tsx` and its consumers, `export.ts`, `app.css`, document tokens, generated review contracts, and dependency manifests/lockfiles. Agree on changes to these surfaces before overlapping work begins. Keep JSON and PDF export changes coordinated even if they later move into separate modules.

Before creating implementation worktrees, put the selected audit reports, work map, and milestone updates into Git so each checkout starts with the same written context. The documentation kickoff preserves this baseline before the planning worktrees branch from it. The preexisting `.codex/` directory is unrelated to these documentation changes. Preserve selected useful audit evidence or replace it with reproducible regression coverage rather than relying on a temporary directory as permanent storage.

**Use small agent teams.** A useful default is one lead implementer and one independent reviewer. Add another specialist when it has a clear interface, owned files, and a result that can be verified independently. The official [Codex best-practices guidance](https://learn.chatgpt.com/guides/best-practices#organize-long-running-chats) likewise recommends coherent chats and bounded subagent tasks. The suggested team size here is a judgment about Presume's dependencies, not a platform limit.

| Work | Useful delegation | Lead responsibility |
| --- | --- | --- |
| Product direction | Separate copy critique and skeptical job-seeker/portfolio walkthrough | Synthesize one coherent direction; record product decisions |
| Document editing | Investigate IME/paste behavior, storage interleavings, or accessibility independently | Own canonical document state, revisions, undo, and recovery semantics |
| Layout/PDF | Investigate glyph coverage or pagination while the lead resolves browser measurement | Own the shared layout contract and integrated output; give PDF implementation one writer |
| Review | Backend and client work after the API contract is explicit | Own contract compatibility and a complete configured flow |
| Landing | Asset preparation or accessibility review alongside a single page/copy owner | Preserve whole-page narrative and visual consistency |
| Validation | Separate browser/keyboard, PDF, and service checks on a fixed integrated commit | Reconcile results, reproduce failures, and report actual completion |

Avoid assigning each bug or landing section to a different writer. The important relationships cross those boundaries: save/undo/import affect the same document session; action controls affect fitting; fitting affects export and review; copy and evidence form one argument. A fresh reviewer is useful, but agent agreement cannot establish what actual job seekers understand.

**Reviewable changes.** Split a thread's work into cohesive PRs where helpful. For example, T2 can deliver editing semantics, persistence/conflict behavior, and backup/history in separate changes while retaining one owner of their interaction. Before broad refactoring, reproduce the assigned finding in the current checkout and retain the smallest meaningful regression check. Run the package's relevant checks, then validate the integrated state after dependencies land. One coordinating owner handles integrations sequentially and records the resulting commit for downstream work.

For runtime consistency, the audit's passing baseline used Node 24 and Python 3.11. Each worktree needs its own usable dependency setup. Browser servers should use distinct ports; avoid sharing mutable test storage, output directories, or services whose configuration is being changed by another task. Successful existing tests do not replace the targeted reproductions in the audit.

**Starter brief for a new work thread.** Replace the thread ID and chosen milestone/branch with actual values. Read repository-relative paths from that checkout. Audit observations refer to the recorded baseline; reproduce them against the current source before editing.

```text
Work on T2: Document state and editing from
docs/audits/2026-09-10-remediation-work-map.md.

Read the two audit reports linked there, PRODUCT.md, DESIGN.md, the selected
audit-remediation milestone in docs/MILESTONE_PLAN.md, and
docs/remediation/DOCUMENT_STATE_IMPLEMENTATION_PLAN.md. Use
docs/remediation/PRODUCT_DIRECTION_BRIEF.md for proposed product context; do not
treat its open choices as approved production changes. Check the current Git
state and relevant local instructions. The standard is both portfolio quality
and dependable everyday use.

Reproduce the assigned findings on this checkout. Define any shared interface
changes before implementation and keep work within this package. Use this thread's
worktree for changes. Delegate bounded independent subtasks and an independent
review where useful; give every writer explicit ownership of files and interfaces.

Deliver reviewable changes and meaningful validation. Report the audit IDs
addressed, the branch and commit, observed behavior, tests/artifacts, and unresolved
limitations so the coordinating thread can integrate the result.
```

Use an equivalent outcome-specific brief for the other threads. For T1, request the product brief and representative desktop/narrow studies before production implementation, following the landing-direction skill. For T6, request independent validation of the integrated commit and distinguish automated/expert inspection from completed sessions with real users.

The documentation kickoff is complete. The next work is to select the T1 direction
and begin T2 implementation from its reviewed plan. T2-1 is the first proposed PR;
later UI packages use the session, revision, and backup contracts recorded there.

**Kickoff record.** The audit/evidence baseline and Milestones 18–21 were committed
as `1e91742`. Two isolated planning branches were then created from that baseline:

| Thread | Branch | Workspace relative to the main checkout | Completed planning artifact |
| --- | --- | --- | --- |
| T1 | `plan/audit-product-direction` | `.worktrees/audit-product-direction` | [Working product brief](../remediation/PRODUCT_DIRECTION_BRIEF.md); source `d28ade2`, integrated `a789af1` |
| T2 | `plan/audit-document-state` | `.worktrees/audit-document-state-plan` | [Document-state implementation plan](../remediation/DOCUMENT_STATE_IMPLEMENTATION_PLAN.md); source `efb152f`, integrated `6367b87` |

The coordinating thread reviewed and integrated both documents. T2 also received
an independent review against the product brief and assigned findings, with no
unresolved blockers. Link, whitespace, and documentation-only scope checks passed;
application tests were not rerun for this kickoff. No audit finding is marked fixed
by a plan, and the working product brief does not replace the approved landing brief.

Before later implementation begins, bring its
worktree up to the selected integrated baseline and read the current milestone;
the presence of a planning branch is not evidence that application work has begun.
