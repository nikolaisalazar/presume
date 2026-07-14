import { expect, test } from '@playwright/test'

test.describe('configured review browser contracts', () => {
  test('renders disabled service state from safe config', async ({ page }) => {
    await page.setViewportSize({ width: 560, height: 900 })
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

    await page.goto('./editor/')
    await expect(page).toHaveURL(/\/presume\/editor\/$/)

    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
    const rail = page.locator('[data-slot="review-rail"]')
    await expect(rail.getByRole('button', { name: 'Review details' })).toBeEnabled()
    await rail.getByRole('button', { name: 'Review details' }).click()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toBeVisible()
    await expect(page.getByText('Review service unavailable')).toBeVisible()

    const panel = page.getByRole('complementary', { name: 'Resume review' })
    for (const action of [
      panel.getByRole('button', { name: 'Review resume' }),
      panel.getByRole('button', { name: 'Collapse review' }),
    ]) {
      await expect(action).toHaveCSS('height', '44px')
    }

    await page.setViewportSize({ width: 1640, height: 900 })
    const wide = await page.evaluate(() => {
      const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
      const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
      const review = document.querySelector('.review-region')!.getBoundingClientRect()
      return {
        fitLeft: fit.right <= editor.left,
        reviewRight: review.left >= editor.right,
      }
    })
    expect(wide).toEqual({ fitLeft: true, reviewRight: true })

    await page.setViewportSize({ width: 1639, height: 900 })
    const stacked = await page.evaluate(() => {
      const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
      const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
      const review = document.querySelector('.review-region')!.getBoundingClientRect()
      return {
        fitAbove: fit.bottom <= editor.top,
        reviewBelow: editor.bottom <= review.top,
      }
    })
    expect(stacked).toEqual({ fitAbove: true, reviewBelow: true })
  })

  test('renders config-error state when backend cannot be reached', async ({ page }) => {
    await page.route('http://127.0.0.1:8124/config', route => route.abort('failed'))

    await page.goto('./editor/')
    await expect(page).toHaveURL(/\/presume\/editor\/$/)

    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
    const rail = page.locator('[data-slot="review-rail"]')
    await expect(rail.getByRole('button', { name: 'Review details' })).toBeEnabled()
    await rail.getByRole('button', { name: 'Review details' }).click()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toBeVisible()
    await expect(page.getByText('Could not reach the review service.')).toBeVisible()
  })

  test('submits a PDF review, renders normalized result, and marks it stale after edit', async ({ page }) => {
    let requestCount = 0
    let releaseFirst!: () => void
    let releaseSecond!: () => void
    const firstGate = new Promise<void>(resolve => { releaseFirst = resolve })
    const secondGate = new Promise<void>(resolve => { releaseSecond = resolve })
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
      requestCount += 1
      const request = route.request()
      expect(request.method()).toBe('POST')
      const contentType = request.headers()['content-type'] ?? ''
      expect(contentType).toContain('multipart/form-data')
      expect(contentType).toContain('boundary=')
      const body = request.postDataBuffer()
      expect(body).not.toBeNull()
      const multipartText = body!.toString('latin1')
      expect(multipartText).toContain('name="file"')
      expect(multipartText).toContain('filename="resume.pdf"')
      expect(multipartText).toContain('Content-Type: application/pdf')
      expect(multipartText).toContain('%PDF')
      await (requestCount === 1 ? firstGate : secondGate)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reviewFixture),
      })
    })

    await page.goto('./editor/')
    await expect(page).toHaveURL(/\/presume\/editor\/$/)
    const rail = page.locator('[data-slot="review-rail"]')
    await expect(rail.getByRole('button', { name: 'Start review' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
    const readyBox = await rail.boundingBox()
    expect(readyBox).not.toBeNull()

    await rail.getByRole('button', { name: 'Start review' }).click()
    await expect(rail.getByText('Reviewing', { exact: true })).toBeVisible()
    await expect(rail.getByText('In progress', { exact: true })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
    const loadingBox = await rail.boundingBox()

    releaseFirst()
    await expect(rail.getByText('Review ready', { exact: true })).toBeVisible()
    const successBox = await rail.boundingBox()
    expect(loadingBox).toMatchObject({ width: readyBox!.width, height: 52 })
    expect(successBox).toMatchObject({ width: readyBox!.width, height: 52 })
    expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)

    await rail.getByRole('button', { name: 'View review' }).click()
    const panel = page.getByRole('complementary', { name: 'Resume review' })
    await expect(panel).toBeVisible()
    await expect(panel.getByText('81 / 100', { exact: true })).toBeVisible()
    await expect(page.getByText('Competitive')).toBeVisible()
    await expect(page.getByText('Open Source', { exact: true })).toBeVisible()
    await expect(page.getByText('Production Experience')).toBeVisible()
    await expect(page.getByText('Add one production metric.').first()).toBeVisible()
    await page.getByRole('button', { name: /Key strengths/i }).click()
    await expect(page.getByText('Clear project ownership.')).toBeVisible()
    await page.getByRole('button', { name: /Adjustment details/i }).click()
    await expect(page.getByText('Open source signal')).toBeVisible()
    await expect(page.getByText('Missing scale')).toBeVisible()
    await expect(page.getByText('Good technical evidence.')).toBeVisible()
    expect(requestCount).toBe(1)

    const name = page.locator('.resume-name')
    await name.click()
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
    await page.keyboard.type('Stale Review Candidate')

    await expect(page.getByText('Review is stale')).toBeVisible()
    await expect(panel.getByText('81 / 100', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Review resume' }).click()
    await expect(panel.getByText('81 / 100', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Collapse review' }).click()
    await expect(rail.getByText('Updating review', { exact: true })).toBeVisible()
    await expect(rail.getByRole('button', { name: 'View review' })).toBeVisible()
    await rail.getByRole('button', { name: 'View review' }).click()
    await expect(panel.getByText('81 / 100', { exact: true })).toBeVisible()

    releaseSecond()
    await expect(panel.getByRole('button', { name: 'Review resume' })).toBeEnabled()
    expect(requestCount).toBe(2)

    await page.setViewportSize({ width: 560, height: 900 })
    for (const action of [
      page.getByRole('button', { name: 'Review resume' }),
      page.getByRole('button', { name: 'Collapse review' }),
    ]) {
      await expect(action).toHaveCSS('height', '44px')
    }

    await page.setViewportSize({ width: 561, height: 900 })
    for (const action of [
      page.getByRole('button', { name: 'Review resume' }),
      page.getByRole('button', { name: 'Collapse review' }),
    ]) {
      await expect(action).toHaveCSS('height', '36px')
    }
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
  bonuses: [
    {
      label: 'Open source signal',
      points: 3,
      evidence: 'Public repositories are listed.',
    },
  ],
  deductions: [
    {
      label: 'Missing scale',
      points: -2,
      evidence: 'Some bullets lack metrics.',
    },
  ],
  annotations: [
    {
      id: 'ann_e2e',
      categoryKey: 'technical_skills',
      sectionTitle: 'Experience',
      entryTitle: 'Software Engineering Intern',
      bulletText:
        'Built a real-time dashboard with React and WebSockets enabling operations staff to monitor system metrics',
      message: 'Good technical evidence.',
      severity: 'strong',
    },
  ],
  raw: { source: 'e2e-fixture' },
}
