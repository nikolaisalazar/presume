import { expect, test } from '@playwright/test'

test.describe('configured review browser contracts', () => {
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

    await page.goto('./')
    await expect(page).toHaveURL(/\/presume\/$/)

    await expect(page.getByRole('button', { name: 'Review unavailable' })).toBeDisabled()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
  })

  test('renders config-error state when backend cannot be reached', async ({ page }) => {
    await page.route('http://127.0.0.1:8124/config', route => route.abort('failed'))

    await page.goto('./')
    await expect(page).toHaveURL(/\/presume\/$/)

    await expect(page.getByRole('button', { name: 'Review unavailable' })).toBeDisabled()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
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
      sawReviewUpload = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(reviewFixture),
      })
    })

    await page.goto('./')
    await expect(page).toHaveURL(/\/presume\/$/)
    await expect(page.getByRole('button', { name: 'Review resume' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Review resume' }).click()

    await expect(page.getByRole('complementary', { name: 'Resume review' })).toBeVisible()
    await expect(page.getByText('81 / 100')).toBeVisible()
    await expect(page.getByText('Competitive')).toBeVisible()
    await expect(page.getByText('Open Source', { exact: true })).toBeVisible()
    await expect(page.getByText('Production Experience')).toBeVisible()
    await expect(page.getByText('Clear project ownership.')).toBeVisible()
    await expect(page.getByText('Add one production metric.').first()).toBeVisible()
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
