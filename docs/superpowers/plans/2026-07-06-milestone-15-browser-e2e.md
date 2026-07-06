# Milestone 15 Browser/E2E Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic Playwright browser automation for Presume's review and export contracts.

**Architecture:** Add Playwright as the only browser E2E runner, served by Vite web servers with and without `VITE_REVIEW_API_URL`. Tests use route interception for `GET /config` and `POST /reviews` so the real browser app exercises frontend review/export behavior without real Ollama, `vendor/hiring-agent`, or third-party network access.

**Tech Stack:** Playwright, Vite, React 18, TypeScript, existing FastAPI/Vitest checks.

## Global Constraints

- Do not change the core review API contract.
- `POST /reviews` remains multipart form data with required PDF field `file`.
- `GET /config` exposes only safe capability information.
- Review feedback is advisory and non-mutating.
- Normal Export PDF remains the user-facing canvas/image export path.
- Review submissions may add the review-only extractable text appendix.
- `vendor/hiring-agent` remains a local prerequisite and is not vendored.
- Preserve Milestone 13 responsive contracts including `.workspace { min-width: 0; }`, responsive `.workspace` `grid-template-columns: minmax(0, 1fr)` and `width: 100%`, `.review-panel { width: 100%; max-width: min(816px, calc(100vw - 32px)); }`, and only `.resume-canvas-scroll` horizontally scrolls the fixed `816px` resume canvas on narrow viewports.
- Real Ollama-backed Hiring Agent review remains manual/local verification by default.

---

### Task 1: Add Playwright runner configuration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`

**Interfaces:**
- Produces: `npm run test:e2e`, two Playwright projects named `unconfigured` and `configured-review`, base URL `http://127.0.0.1:4173/presume/`.

- [ ] **Step 1: Install Playwright test dependency**

Run: `npm install --save-dev @playwright/test`
Expected: `package.json` and `package-lock.json` update with `@playwright/test`.

- [ ] **Step 2: Add the failing E2E script expectation**

Temporarily run: `npm run test:e2e`
Expected: FAIL with `Missing script: "test:e2e"`.

- [ ] **Step 3: Add npm script and Playwright config**

Edit `package.json` scripts to include:

```json
"test:e2e": "playwright test"
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

const baseUrl = 'http://127.0.0.1:4173/presume/'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: baseUrl,
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'unconfigured',
      use: { ...devices['Desktop Chrome'] },
      webServer: {
        command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        url: baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
    {
      name: 'configured-review',
      use: { ...devices['Desktop Chrome'] },
      webServer: {
        command:
          'VITE_REVIEW_API_URL=http://127.0.0.1:8124 npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
        url: baseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    },
  ],
})
```

- [ ] **Step 4: Run the empty runner**

Run: `npm run test:e2e`
Expected: Playwright exits with no tests found or equivalent runner-level output proving the script/config is wired. If browsers are missing, run `npx playwright install chromium` once locally and rerun.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.ts
git commit -m "Add Playwright e2e runner"
```

### Task 2: Add unconfigured browser/export/layout tests

**Files:**
- Create: `e2e/presume.spec.ts`

**Interfaces:**
- Consumes: Playwright `page.goto('/')` from Task 1.
- Produces: Browser assertions for app load, nonblank resume surface, PDF download, editor viability, unconfigured review state, and narrow overflow geometry.

- [ ] **Step 1: Write failing tests**

Create `e2e/presume.spec.ts` with the unconfigured tests:

```ts
import { expect, test } from '@playwright/test'

test.describe('unconfigured browser contracts', () => {
  test.skip(({ browserName }) => browserName !== 'chromium')

  test('loads, renders a nonblank resume, exports PDF, and keeps editing available', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner')).toContainText('Presume')
    await expect(page.locator('.resume-page')).toBeVisible()
    await expect(page.getByText('Review service not configured')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review resume' })).toBeDisabled()

    const screenshot = await page.locator('.resume-page').screenshot()
    expect(hasNonblankPngBytes(screenshot)).toBe(true)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export PDF' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('resume.pdf')

    const name = page.locator('.resume-name')
    await name.click()
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
    await page.keyboard.type('Ada Browser')
    await expect(name).toHaveText('Ada Browser')
  })

  test('keeps narrow viewport overflow inside the fixed resume canvas scroller', async ({ page }) => {
    await page.setViewportSize({ width: 358, height: 980 })
    await page.goto('/')

    const metrics = await page.evaluate(() => {
      const workspace = document.querySelector('.workspace') as HTMLElement
      const panel = document.querySelector('.review-panel') as HTMLElement
      const scroller = document.querySelector('.resume-canvas-scroll') as HTMLElement
      const resume = document.querySelector('.resume-page') as HTMLElement
      const workspaceStyle = window.getComputedStyle(workspace)
      const panelRect = panel.getBoundingClientRect()
      return {
        bodyClientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.documentElement.scrollWidth,
        workspaceMinWidth: workspaceStyle.minWidth,
        workspaceColumns: workspaceStyle.gridTemplateColumns,
        workspaceWidth: Math.round(workspace.getBoundingClientRect().width),
        panelWidth: Math.round(panelRect.width),
        panelLeft: Math.round(panelRect.left),
        panelRight: Math.round(panelRect.right),
        scrollerClientWidth: scroller.clientWidth,
        scrollerScrollWidth: scroller.scrollWidth,
        resumeWidth: Math.round(resume.getBoundingClientRect().width),
      }
    })

    expect(metrics.bodyScrollWidth).toBe(metrics.bodyClientWidth)
    expect(metrics.workspaceMinWidth).toBe('0px')
    expect(metrics.workspaceWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.panelLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.panelRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.panelWidth).toBeLessThanOrEqual(326)
    expect(metrics.scrollerClientWidth).toBeLessThan(metrics.scrollerScrollWidth)
    expect(metrics.resumeWidth).toBe(816)
  })
})

function hasNonblankPngBytes(bytes: Buffer): boolean {
  return bytes.length > 1_000 && new Set(bytes).size > 16
}
```

- [ ] **Step 2: Run tests to verify they fail before full support is stable**

Run: `npm run test:e2e -- --project=unconfigured`
Expected: FAIL if browsers are not installed or if selectors/download behavior need adjustment; record the exact failure.

- [ ] **Step 3: Make minimal adjustments only if needed**

If the tests fail because the base path or selector is wrong, adjust only the test/config path or selector to match the existing app. Do not change production UI behavior unless the browser exposes a real contract bug.

- [ ] **Step 4: Run tests to verify green**

Run: `npm run test:e2e -- --project=unconfigured`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/presume.spec.ts playwright.config.ts package.json package-lock.json
git commit -m "Add browser export and responsive e2e coverage"
```

### Task 3: Add configured review route-interception tests

**Files:**
- Modify: `e2e/presume.spec.ts`

**Interfaces:**
- Consumes: configured-review project with `VITE_REVIEW_API_URL=http://127.0.0.1:8124`.
- Produces: Route interception for `/config` and `/reviews`, multipart PDF assertion, fixture review rendering, stale-after-edit coverage, disabled config state, config-error state.

- [ ] **Step 1: Write failing configured tests**

Append this configured-review block to `e2e/presume.spec.ts`:

```ts
test.describe('configured review browser contracts', () => {
  test.skip(({ browserName }) => browserName !== 'chromium')

  test('renders disabled service state from safe config', async ({ page }) => {
    await page.route('http://127.0.0.1:8124/config', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviewEnabled: false,
          llmProvider: 'ollama',
          defaultModel: 'gemma3:4b',
          githubEnrichmentEnabled: false,
          maxUploadBytes: 26214400,
        }),
      })
    )

    await page.goto('/')

    await expect(page.getByText('Review service unavailable')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review resume' })).toBeDisabled()
  })

  test('renders config-error state when backend cannot be reached', async ({ page }) => {
    await page.route('http://127.0.0.1:8124/config', route => route.abort('failed'))

    await page.goto('/')

    await expect(page.getByText('Review service unavailable')).toBeVisible()
    await expect(page.getByText('Could not reach the review service.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review resume' })).toBeDisabled()
  })

  test('submits a PDF review, renders normalized result, and marks it stale after edit', async ({ page }) => {
    let sawReviewUpload = false
    await page.route('http://127.0.0.1:8124/config', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reviewEnabled: true,
          llmProvider: 'ollama',
          defaultModel: 'gemma3:4b',
          githubEnrichmentEnabled: false,
          maxUploadBytes: 26214400,
        }),
      })
    )
    await page.route('http://127.0.0.1:8124/reviews', async route => {
      const request = route.request()
      expect(request.method()).toBe('POST')
      const multipart = await request.multipartData()
      expect(multipart?.file).toBeTruthy()
      const file = multipart!.file as { name: string; mimeType: string; buffer: Buffer }
      expect(file.name).toBe('resume.pdf')
      expect(file.mimeType).toBe('application/pdf')
      expect(file.buffer.subarray(0, 4).toString()).toBe('%PDF')
      sawReviewUpload = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reviewFixture),
      })
    })

    await page.goto('/')
    await expect(page.getByText('Ready for review')).toBeVisible()

    await page.getByRole('button', { name: 'Review resume' }).click()

    await expect(page.getByText('81 / 100')).toBeVisible()
    await expect(page.getByText('Competitive')).toBeVisible()
    await expect(page.getByText('Open Source')).toBeVisible()
    await expect(page.getByText('Production Experience')).toBeVisible()
    await expect(page.getByText('Clear project ownership.')).toBeVisible()
    await expect(page.getByText('Add one production metric.')).toBeVisible()
    await expect(page.getByText('Open source signal')).toBeVisible()
    await expect(page.getByText('Missing scale')).toBeVisible()
    await expect(page.getByText('Good technical evidence.')).toBeVisible()
    expect(sawReviewUpload).toBe(true)

    const name = page.locator('.resume-name')
    await name.click()
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
    await page.keyboard.type('Stale Review Candidate')

    await expect(page.getByText('Review is stale')).toBeVisible()
    await expect(page.getByText('81 / 100')).toBeVisible()
  })
})

const reviewFixture = {
  id: 'review_e2e',
  reviewedAt: '2026-07-06T12:00:00Z',
  totalScore: 81,
  maxScore: 100,
  tier: 'competitive',
  categories: [
    {
      key: 'open_source',
      label: 'Open Source',
      score: 20,
      maxScore: 35,
      evidence: ['Public project work is visible.'],
      suggestions: ['Show merged contributions if available.'],
    },
    {
      key: 'production',
      label: 'Production Experience',
      score: 22,
      maxScore: 25,
      evidence: ['Internship work shows production exposure.'],
      suggestions: ['Add one production metric.'],
    },
  ],
  strengths: ['Clear project ownership.'],
  improvements: ['Add one production metric.'],
  bonuses: [{ label: 'Open source signal', points: 3, evidence: 'Public repositories are listed.' }],
  deductions: [{ label: 'Missing scale', points: -2, evidence: 'Some bullets lack metrics.' }],
  annotations: [
    {
      id: 'ann_e2e',
      categoryKey: 'technical_skills',
      sectionTitle: 'Experience',
      entryTitle: 'Software Engineer Intern',
      bulletText: 'Built and shipped features across the stack using React and TypeScript.',
      message: 'Good technical evidence.',
      severity: 'strong',
    },
  ],
  raw: { source: 'e2e-fixture' },
}
```

- [ ] **Step 2: Run configured tests to verify red**

Run: `npm run test:e2e -- --project=configured-review`
Expected: FAIL initially if fixture text does not match the default resume or multipart assertion needs Playwright typing adjustment.

- [ ] **Step 3: Make minimal test/harness fixes**

If the annotation fixture does not match default resume text, inspect `src/defaultResume.ts` and update only fixture target strings. If TypeScript rejects `multipartData`, use Playwright's documented multipart value shape and keep the same assertions.

- [ ] **Step 4: Run configured tests to verify green**

Run: `npm run test:e2e -- --project=configured-review`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/presume.spec.ts
git commit -m "Add browser review contract e2e coverage"
```

### Task 4: Update docs and milestone status

**Files:**
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/PRODUCT_SPEC.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/REVIEW_SERVICE.md`
- Modify: `review-service/README.md`
- Modify: `docs/MILESTONE_PLAN.md`

**Interfaces:**
- Consumes: `npm run test:e2e` from Task 1 and coverage from Tasks 2-3.
- Produces: Documentation recording the new command, covered contracts, manual Ollama boundary, and Milestone 15 completion evidence.

- [ ] **Step 1: Write doc updates**

Update the docs with concise language:

```md
Browser/E2E automation is available with `npm run test:e2e`. The Playwright suite launches the real Vite app in Chromium and uses route interception for `/config` and `/reviews` to cover app load, nonblank resume rendering, normal PDF export download, unconfigured/disabled/config-error review states, fixture-backed review submission and rendering, stale-after-edit behavior, and narrow viewport fixed-canvas scrolling.

The automated E2E suite intentionally does not run real Ollama-backed Hiring Agent review by default. That path remains manual because it requires a local `vendor/hiring-agent` checkout, its `.venv`, a running Ollama service, a pulled model such as `gemma3:4b`, and multi-minute machine-dependent review latency.
```

Set Milestone 15 status to Complete and add completion evidence listing `playwright.config.ts`, `e2e/presume.spec.ts`, docs updates, and verification commands.

- [ ] **Step 2: Run docs-adjacent tests**

Run: `npm test -- --run src/tests/responsiveLayout.test.ts src/tests/appIntegration.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/README.md docs/PRODUCT_SPEC.md docs/ARCHITECTURE.md docs/REVIEW_SERVICE.md review-service/README.md docs/MILESTONE_PLAN.md
git commit -m "Document milestone 15 browser automation"
```

### Task 5: Final verification

**Files:**
- No code changes expected.

**Interfaces:**
- Produces: final command evidence for completion.

- [ ] **Step 1: Run backend tests**

Run: `python3 -m pytest review-service/tests -q`
Expected: `43 passed`.

- [ ] **Step 2: Run frontend tests**

Run: `npm test -- --run`
Expected: all Vitest files pass.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: TypeScript and Vite build pass.

- [ ] **Step 4: Run browser E2E tests**

Run: `npm run test:e2e`
Expected: all Playwright tests pass.

- [ ] **Step 5: Inspect git status and summarize**

Run: `git status --short --branch`
Expected: clean working tree except intentional commits ahead of origin.

## Self-Review

- Spec coverage: Tasks 1-3 implement Playwright route-intercepted browser automation; Task 4 documents command, contracts, manual boundary, and milestone completion; Task 5 verifies acceptance commands.
- Placeholder scan: No TBD/TODO placeholders remain.
- Type consistency: `test:e2e`, `playwright.config.ts`, `e2e/presume.spec.ts`, `/config`, `/reviews`, and `reviewFixture` names are consistent across tasks.
