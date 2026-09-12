The first audit gave more attention to implementation, reliability, and accessibility than to product judgment. This supplement supplies the missing depth: positioning, landing-page quality, copy, evidence, first use, repeat use, Review's role, portfolio presentation, and the order of work.

**My assessment: Presume has a strong visual identity and a useful core idea. Its product explanation and everyday workflow need to catch up with that visual finish.** The next milestone should let someone understand the tool, make a meaningful edit, judge the result, export it, and safely resume work later. The landing should demonstrate that same sequence.

This is an expert product assessment of `main` at `c52e175`, dated September 10, 2026. It combines source inspection with actual browser walkthroughs and screenshots at 1440, 1280, 1000, 700, 390, and 320px widths. It is not customer research, a conversion experiment, or evidence of market demand. The existing [codebase and product audit](2026-09-10-codebase-product-audit.md) contains the detailed correctness and security findings.

The landing-direction skill was applied as a focused audit of the current direction, with a hybrid product/case-study narrative, one recommended revision, the prior-approved visual system, and a written assessment. No new visual reference direction or production redesign was created. Product recommendations below remain proposals. They do not amend the approved [landing brief](../landing/PRESUME_LANDING_BRIEF.md) or the protected editor design by implication.

| Area | Assessment | Next decision or action |
| --- | --- | --- |
| Visual identity | Coherent and recognizable | Preserve the typography, mineral palette, paper treatment, and restraint |
| Positioning | Ownership is clear; the practical reason to choose the tool is less immediate | Lead with direct editing and visible formatting; let ownership support that promise |
| Landing narrative | Repeated explanation receives more space than working product proof | Move a real edit-to-export demonstration ahead of the abstract thesis |
| Copy | Accurate in intent, often written in engineering vocabulary | Translate mechanisms and limitations into decisions a job seeker understands |
| Mobile product evidence | The page removes its only resume image | Retain a useful view of the document or editor at narrow widths |
| First use | Immediate access is good; orientation and action hierarchy need work | Help the user make one edit and understand the current document state |
| Repeat use | One local document and manual JSON transfers make returning work fragile | Complete recovery and backups, then test demand for named copies and reordering |
| Optional Review | Honest caveats, weak availability and outcome story | Present it as an advanced capability with understandable examples and setup |
| Portfolio depth | Dependencies and principles are visible; original decisions are under-explained | Add a concise case study and a direct project-repository link |
| Discovery and sharing | Useful metadata and social assets already exist | Improve category clarity and verify the deployed experience before investing in acquisition |

**The product should have one primary task and two depths of explanation.** Keep job seekers—especially technically minded users, as described in [PRODUCT.md](../../PRODUCT.md#L9)—as the primary reader. A portfolio reviewer is the second reader. Both benefit when the public editor stands on its own and the deeper material explains how its behavior was designed and verified.

The practical job is: “I want to update my resume and produce a readable, controlled document without repeatedly repairing its formatting.” Direct editing, explicit layout limits, browser storage, and PDF export form a coherent answer. Optional review can help with revisions, but the basic task should feel complete without provisioning a service.

The current fixed Letter layout and software-engineering example give the product a natural initial audience. Describe that scope plainly. There is no need to expand immediately into a broad template marketplace, automated writing suite, cloud account system, or PDF/DOCX importer. Those are separate product bets; their absence is already consistent with the documented scope. User research should determine which missing task actually prevents adoption.

**The visual language deserves preservation; the page needs more useful evidence per chapter.** The desktop hero has a clear typographic hierarchy, a visible primary action, and an authentic exported resume. The mineral and pale-green fields, serif document inside a sans-serif application, and dark closing section create continuity into the editor. Motion is restrained. The initial CTA was visible within the first viewport at all six checked sizes, and the landing had no page-level horizontal overflow in those checks.

The difficulty is narrative weight. At 1440×900, the landing occupies approximately 4,576px of height. At 390×844, it occupies 4,963px, or roughly 5.9 viewport heights. Across seven chapters, approximately 350 words repeatedly return to ownership, measurement, local saving, and export. Length is not inherently a defect, but each chapter should add evidence or answer a new decision. The thesis and continuity chapters currently repeat much of the hero's promise. The two provenance rows occupy a 640px chapter in the checked layouts.

Keep generous spacing around strong evidence. Reconsider large amounts of space around repeated interpretation. The present page is visually composed; it would become more convincing through a clearer progression from claim to demonstration to practical boundaries.

**The hero states a belief before clearly naming the experience.** “Your resume should stay yours” is a useful brand line. It can suggest privacy, authorship, file ownership, or resistance to automated writing. The paragraph then has to explain all of those possibilities while also introducing Letter geometry, page and line constraints, browser storage, PDF stability, and advisory Review.

Use the first sentence to identify what someone can do. Keep the ownership idea as a supporting promise or a later interpretation. The “Open the editor” CTA is clear and low commitment; retain that simplicity. “Saved in this browser” beside a fresh-visit CTA reads like a state even though the visitor has not started a document. “No account needed” would be a clearer entry reassurance, while actual save state belongs in the editor.

**The main demonstration proves text measurement more directly than Presume's value.** The [Pretext instrument](../../src/components/landing/PretextMeasureDemo.tsx#L10) is real and thoughtfully implemented. It responds to input and exposes width and line count. Those are good engineering qualities.

Its narrative role is less successful. “See the page before export” introduces a draggable width boundary around a generic sentence in Geist. Presume's actual document has a fixed page width, Garamond text, and controls for page count, bullet wrapping, and minimum font size. The demonstration does not show someone editing a resume, resolving a limit, or inspecting an export. Its prominent next link leads to Pretext's demos.

Move this instrument into the deeper engineering explanation, where it can explain a dependency's contribution accurately. Give the main product demonstration to an authentic edit → formatting response → PDF sequence. Use real product states after the layout defects are fixed. A short user-controlled recording or a few annotated captures can prove this without building a second editor on the landing. The output should be inspectable, and an illustrative animation should be labeled if it simulates behavior.

**Mobile preserves the words while dropping the clearest product artifact.** At 700px and below, [the hero image is deliberately removed](../../src/styles/app.css#L1822). No later section shows the editor or a resume. At 390px, visitors first encounter the Fit chapter about 1,224px into the page; its interactive content remains the generic measurement sentence. Review supplies a score specimen, which also does not show the editing experience.

A typographic hero can be effective, but the rest of this page does not replace the evidence it removes. Add a narrow-screen view that communicates both the editable text and the finished document. A compact, clearly framed detail can be more legible than squeezing the whole desktop interface into a tiny image. Preserve document proportions when showing a full page. This recommendation deliberately reopens the approved no-mobile-media decision.

**The copy should explain consequences in ordinary language.** The current copy is unusually careful about technical truth, which is worth keeping. It often makes the visitor translate terms such as “local persistence,” “artifact,” “wrapping pressure,” “mutates,” and “not content-derived.” The page also repeatedly explains what automated review cannot do before demonstrating what its feedback helps someone decide.

These examples establish a possible register; they are not an approved full-page rewrite:

| Current wording | Suggested direction | Reason and condition |
| --- | --- | --- |
| “Your resume should stay yours.” | “Edit your resume directly on the page.” | Identify the interaction immediately; retain ownership as supporting language |
| “finished Letter page” | “resume page”; explain “US Letter PDF” near export details | Separate the main task from the output specification |
| “local persistence” | “Saved in this browser” | Describe the user-visible behavior, with a clear explanation of its limits |
| “wrapping pressure” | “See when a bullet runs over your line limit” | Name the visible condition and the content it affects |
| “rewrites or mutates the document” | “You choose which suggestions to use” | State the user's action while preserving the advisory boundary |
| “Example fixture · not content-derived” | “Illustrative result; not calculated from this resume.” | Keep the disclosure understandable outside software testing |
| “Export JSON” / “Import JSON” | “Download backup” / “Restore backup” | Name the purpose; retain JSON as secondary format information |
| “Two systems stay explicit.” | “How Presume handles layout and review” | Give the deeper reader a concrete reason to continue |

A representative hero could read: **“Edit your resume directly on the page.”** Supporting copy: “Set your page and line limits, edit your text, and download a PDF. Your work saves in this browser, with no account needed.” Action: **“Open the editor.”** The save claim should ship with reliable save-state handling from F04/F05.

A representative evidence section could read: **“See what changes as you edit.”** Supporting copy: “Add a longer bullet, adjust the line limit, and inspect the exported page.” Place a verified demonstration beside it. The current fit/export discrepancies must be repaired before using a demonstration to imply close agreement.

**Trust requires an understandable storage and processing model.** “Saved in this browser” is truthful about location but does not explain durability or portability. A user needs to know that another browser will not automatically contain the draft, that clearing browser data can remove it, and that a backup is the way to move or recover work. Explain these facts near saving and backup actions rather than making the whole landing a technical disclaimer.

The local editing claim also needs a separate explanation for Review. Starting a configured review uploads a generated PDF to that service; the configured model provider and optional enrichment can change where processing occurs. The first audit identified metadata that the client currently discards. Make that boundary clear before submission. Avoid a blanket claim that the resume never leaves the browser.

The current JSON backup omits formatting constraints. Repair that before elevating the backup as the mechanism that carries the document forward. Product copy and implementation should share an explicit promise about what restore preserves.

**First use should make one successful edit easy to discover.** Opening directly into the sample document is a strength. The user can try the product without an account, a file upload, or a setup wizard. The resume itself is the editing surface, as promised.

At typical laptop widths, the first surface above the document is “Fit constraints,” followed by PDF/JSON actions and “Reset template.” The sample text is small, and the page exposes many faint add/remove controls. There is no short first-use instruction near the document explaining how to replace the sample text. This is a discoverability concern to validate with users, even after the concrete accessibility defects are fixed.

Add a brief, dismissible instruction such as “Click any text to edit.” Keep it close to the document and make the same operation discoverable through accessible field names. Give the primary document action prominence; group backup and restore actions by purpose. Move resetting into a secondary file/action surface with a recovery path. The confirmation's reference to “Jake's Resume” is an unexplained change of naming from the Alex Johnson sample; use consistent product language.

Fit should report the current result as well as the requested limits. Actual page count, current printed font size, and a clear indication of the limiting factor would help someone decide whether to shorten text or adjust formatting. A 1-page setting alone does not establish that the PDF is one page, and a minimum size alone does not say how large the current text is. The normal default export measured about 7.87pt body text in the earlier audit; assess the output at real print size with users before describing it as polished or readable.

The walkthrough also exposed a distinct problem under reduced motion: the untouched sample shrank to scale 0.8 and displayed an overflow warning. Normal motion preference produced scale 1.0496 without the warning; disabling document transitions in a diagnostic browser restored the normal result. This has been added as F19 in the technical audit. It is a concrete example of why the first-use experience must be checked in real preference states, including a condition that had previously been treated as visual behavior.

The narrow editor remains a fixed-width canvas requiring horizontal scrolling. That is an explicit desktop-first design decision, not an unexpected responsive defect. At 390px the initial visible crop does not include the centered name. Provide a clear canvas navigation/editing cue and evaluate common quick edits on touch devices. A responsive landing alone does not establish comfortable mobile editing.

**Repeat use needs a complete document lifecycle.** The app can edit, save locally, export, and import. It has one current document, no direct section/entry reordering, and no named-copy workflow. Someone adapting a resume for several applications must manage variations through external files and replacement imports. The user-facing recovery story is especially weak because backups are incomplete and structural undo is absent.

First make current-document recovery dependable. Then test which next task matters most: reordering content, saving a named copy for a role, or bringing existing text into the template more efficiently. A simple “Save a copy” or versioned backup may solve the immediate need without introducing accounts and synchronization. Treat these as product opportunities rather than automatically approved additions to scope.

**Review is an optional capability whose presentation currently outruns its demonstrable usefulness.** The visible fixture disclosure is honest and should survive any rewrite. A single large “81 / 100” receives much more attention than “Add one production metric,” yet the sample provides little context for why that advice follows from the resume. The caption becomes 11px on narrow screens, weakening an important qualification relative to the score.

Give more weight to a concrete observation and the revision it could inform. Keep the score secondary, explain its software-engineering rubric, and avoid suggesting that it predicts hiring or ATS outcomes. A future content-derived example should identify its sample input and processing setup. Do not manufacture a metric, improved score, or successful outcome to complete the story.

The checked-in Pages build supplies no review endpoint. In an ordinary unconfigured editor, Details tells the visitor to set `VITE_REVIEW_API_URL` and start the service. That instruction is appropriate for a developer setup guide. A job seeker needs to understand that this public editor's review capability requires a separately configured installation, with an optional link to an example or setup documentation.

A labeled recorded example from a working local service would serve the portfolio without requiring every visitor to install a model. Hosting a public review endpoint would be a separate operating commitment involving cost, availability, privacy, and abuse controls. The current product does not require that commitment to deliver its central editing task.

**Portfolio depth should explain Presume's own decisions.** Linking Pretext and Hiring Agent credits the underlying work accurately. It does not by itself show why Presume chose these boundaries, what tradeoffs were considered, or how the finished experience was verified.

Add a direct link to this project's repository and a concise design/engineering case study. Three useful subjects are the content/layout/export contract; document ownership and recovery; and the separate advisory review pipeline. For each, show the original problem, the chosen approach, a material tradeoff, and a real validation artifact. Discussing the reliability repairs with before/after evidence would be more informative than merely listing technologies or test counts. Keep the author's GitHub and LinkedIn links as author context.

**Discovery and sharing already have a foundation.** The page includes a descriptive title, description, canonical URL, favicon, and a 1200×630 Open Graph image. The image matches the visual identity and contains an authentic exported resume. Its large ownership line repeats the hero's ambiguity; a visible “resume editor” descriptor would help when the image appears outside the site. The deployed landing returned HTTP 200 and the expected metadata during this pass.

The delivered HTML is an application shell that needs JavaScript for the page body. Google can render JavaScript, so this alone does not mean the page is unindexable. Static prerendering of the landing is a reasonable later enhancement for faster content delivery and crawlers that do not execute JavaScript; it should follow the core product work. This interpretation follows [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). Search Console data, live search visibility, social-platform previews, and field performance were not measured here.

The recommendations about visible document state, familiar language, recovery, and first-use guidance also follow [Nielsen's usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/). They are expert judgments about this interface, not measured predictions of conversion or retention.

The proposed treatment of current landing elements is:

| Current element | Treatment | Purpose in the revision |
| --- | --- | --- |
| Brand, Geist/Garamond relationship, mineral palette | Keep | Preserve continuity and the document-led identity |
| Navigation | Reframe | Provide a quick path to the editor and a legible route to how it works / project details |
| Ownership hero | Reframe | Lead with the task and support it with the ownership promise |
| Authentic exported Letter surface | Recompose | Connect output to an actual edit; supply legible narrow-screen evidence |
| Full thesis interlude | Reframe | Condense or move after the first working proof |
| Pretext instrument | Reframe | Make it deeper engineering evidence with an explicit link back to Presume's behavior |
| Continuity chapter | Recompose | Demonstrate save, restore, and export rather than repeating assurances |
| Review specimen | Recompose | Lead with useful advice, retain clear example labeling and availability boundaries |
| “It cannot take the pen” signature | Remove | The surrounding section already establishes user control; use the space for new information |
| Design Boundaries | Reframe | Explain original choices and tradeoffs, retaining dependency attribution |
| Final CTA and dark ending | Keep | Close with a clear invitation into the same working editor |
| Footer author links | Keep | Add a direct project-repository destination alongside author context |

One revised direction is sufficient at this stage: **show the document becoming useful.** The core argument is that someone can control the wording, see the layout response, and carry the finished document forward. The emotional impression remains calm and competent. The quick read explains that task; the deeper read explains the engineering choices that make it trustworthy.

Use a task-focused hero with authentic product evidence, then the edit/fit/export sequence, a concise explanation of local saving and recovery, optional Review evidence, deeper design reasoning, and the final action. The live editor remains the immediate way to try the product. Keep Mineral Quiet and existing typography; no new visual preset, palette, ornamental navigation, or motion system is needed. Any new motion should explain a state change, with a static or user-controlled alternative. The tradeoff is a smaller role for the ownership manifesto and the library demonstration. The expected benefit is clearer product understanding; that benefit needs user validation.

The practical order of work should be:

| Stage | Concrete deliverable | Completion standard |
| --- | --- | --- |
| 1. Resolve the product brief | A short revision identifying the primary task, two audiences, landing proof, Review's public role, and copy register | Every major claim maps to a working behavior or explicitly labeled example; changes to earlier approved decisions are recorded |
| 2. Protect the document | Fix content loss, wrong deletions, storage outcomes, tab conflicts, Fit/PDF agreement, glyph support, pagination, accessible editing, reduced-motion fitting, and complete backups | A user can edit, undo, reopen, restore elsewhere, and export the intended document through the relevant tested states |
| 3. Complete first use and rebuild the landing evidence | First-edit guidance, purposeful file actions, visible formatting results, revised landing narrative/copy, desktop and narrow proof | A new visitor can explain the product, identify their first action, and understand storage and export without developer vocabulary |
| 4. Make Review useful to inspect and operate | Correct state handling, recovery, understandable availability/provider information, useful feedback, and one verified example | The basic editor remains complete without Review; a configured installation delivers and explains an actual review; exposed services receive dependency and upload hardening before release |
| 5. Validate both audiences and publish the case study | Observed task sessions, revised weak points, final deployed checks, and concise design/engineering evidence | Recurring misunderstandings are resolved; the case study documents real decisions and outcomes from verification |

The brief and copy studies can progress while reliability work is underway. Production evidence that claims layout fidelity must wait for that behavior to be repaired. This is a product revision supported by targeted engineering, with the current stack retained.

For validation, run a small formative round with actual target job seekers and a separate group who review design/engineering portfolios. Ask job seekers to explain the product after a brief view, replace sample text, adjust a long bullet while preserving readability, recover a deletion, export, reopen, and restore in another browser. Ask portfolio reviewers what they believe the author designed, what technical tradeoff they can identify, and which evidence supports their confidence. Record task completion, assistance needed, misunderstandings, and document correctness. A small qualitative round identifies problems; it does not establish population-level conversion or market fit. No participant outreach was performed during this audit.

Recommended decision ledger: **Keep** the brand, document-first interaction, easy entry, local-first scope, and advisory boundary. **Change** the hierarchy of claims and evidence, practical copy, first-use guidance, recovery, and portfolio explanation. **Reject** unsupported hiring outcomes and expansion into unrelated features before the current document lifecycle is reliable. **Open** the initial audience's document needs, the most valuable repeat-use capability, and whether a public live Review service is worth operating. These are audit recommendations, not recorded user approvals.

Evidence for this supplement is retained in [the preserved audit evidence folder](evidence/2026-09-10/): [viewport and copy measurements](evidence/2026-09-10/product-pass.json), [desktop hero](evidence/2026-09-10/product-hero-1440.png), [mobile hero](evidence/2026-09-10/product-hero-390.png), [desktop whole page](evidence/2026-09-10/product-landing-1440.png), [mobile measurement demonstration](evidence/2026-09-10/product-fit-390.png), [Review presentation](evidence/2026-09-10/product-review-1440.png), and [reduced-motion diagnostic](evidence/2026-09-10/reduced-motion-fit.json). Editor screenshots from the initial product-pass script use reduced motion and therefore show the newly identified Fit defect; they should not be described as the normal-motion default. No application code was changed.
