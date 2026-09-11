This is the selected durable evidence for the September 10, 2026 Presume audit
of source commit `c52e175`. It was copied from the original local diagnostic
folder when the user authorized the remediation kickoff.

Browser experiments used synthetic resumes and isolated contexts. The screenshots
are observations of the shipped source, not proposed designs. Product-pass editor
observations used reduced motion and exposed F19; the paired reduced-motion JSON
distinguishes that behavior from the normal-motion default.

The parent audit reports explain the scenarios, source locations, interpretations,
and limitations. These selected artifacts preserve the reports' cited evidence;
they are not a standalone regression suite or proof that any finding is fixed.
Some JSON and logs retain original absolute environment paths as historical data.

- `verify-node24.log`: contract/type checks, 232 frontend tests, and 50 backend tests.
- `e2e.log`: nine unconfigured and three configured Chromium browser tests.
- `build.log`: the final production build without a configured Review endpoint.
- `npm-audit.json` and `pip-audit.json`: advisory scanner snapshots; the codebase
  report distinguishes raw counts from the application's actual exposure.
- The remaining JSON/JSONL records and PNGs are linked from the audit findings.

The broader temporary directory contained additional scripts, PDFs, and captures.
Reproduce assigned findings in the current worktree and add appropriate regression
coverage as implementation proceeds. Do not assume all original temporary files
are available on another machine.
