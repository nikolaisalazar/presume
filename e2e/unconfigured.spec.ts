import { expect, test } from '@playwright/test'

test.describe('unconfigured browser contracts', () => {
  test('loads, renders a nonblank resume, exports PDF, and keeps editing available', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveURL(/\/presume\/$/)
    await expect(page.getByRole('heading', { name: 'Edit your resume like the final document.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start editing' })).toBeVisible()

    await page.getByRole('button', { name: 'Start editing' }).click()

    await expect(page).toHaveURL(/\/presume\/editor\/$/)
    await expect(page.getByRole('banner')).toContainText('Presume')
    await expect(page.locator('.resume-page')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Resume review' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Review resume' })).toHaveCount(0)

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

  test('keeps the landing workflow and feature cards responsive', async ({ page }) => {
    await page.setViewportSize({ width: 1120, height: 980 })
    await page.goto('./')

    const workflow = page.getByRole('region', {
      name: 'From draft to export without leaving the page.',
    })
    const workflowSteps = workflow.locator('ol > li')
    const desktopSteps = await workflowSteps.evaluateAll(items =>
      items.map(item => {
        const rect = item.getBoundingClientRect()
        return { left: Math.round(rect.left), top: Math.round(rect.top) }
      })
    )

    expect(desktopSteps).toHaveLength(3)
    expect(new Set(desktopSteps.map(step => step.top)).size).toBe(1)
    expect(desktopSteps[0].left).toBeLessThan(desktopSteps[1].left)
    expect(desktopSteps[1].left).toBeLessThan(desktopSteps[2].left)

    await page.setViewportSize({ width: 358, height: 980 })

    await expect(page.getByRole('img', { name: 'Presume editor preview' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Start editing' })).toBeVisible()

    const mobileMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-slot="card"]'))
        .map(card => card.getBoundingClientRect())
      return {
        bodyClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        cardLefts: cards.map(card => Math.round(card.left)),
        cardTops: cards.map(card => Math.round(card.top)),
      }
    })

    expect(mobileMetrics.documentScrollWidth).toBeLessThanOrEqual(mobileMetrics.bodyClientWidth)
    expect(new Set(mobileMetrics.cardLefts).size).toBe(1)
    expect(mobileMetrics.cardTops).toEqual([...mobileMetrics.cardTops].sort((a, b) => a - b))
  })

  test('keeps expanded fit constraints usable at narrow widths', async ({ page }) => {
    await page.setViewportSize({ width: 358, height: 980 })
    await page.goto('./editor/')
    await page.getByRole('button', { name: /Fit constraints/ }).click()

    const metrics = await page.evaluate(() => {
      const row = document.querySelector('.settings-control-row') as HTMLElement
      const stepper = document.querySelector('.settings-stepper') as HTMLElement
      const decrease = document.querySelector('.settings-stepper__button') as HTMLElement
      const rowRect = row.getBoundingClientRect()
      const stepperRect = stepper.getBoundingClientRect()
      const decreaseRect = decrease.getBoundingClientRect()
      return {
        bodyClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        rowLeft: Math.round(rowRect.left),
        rowRight: Math.round(rowRect.right),
        stepperWidth: Math.round(stepperRect.width),
        buttonWidth: Math.round(decreaseRect.width),
        buttonHeight: Math.round(decreaseRect.height),
      }
    })

    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.rowLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.rowRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.stepperWidth).toBeGreaterThanOrEqual(132)
    expect(metrics.buttonWidth).toBeGreaterThanOrEqual(44)
    expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44)
  })

  test('keeps viewport overflow inside the fixed resume canvas scroller at narrow widths', async ({ page }) => {
    for (const width of [358, 860, 861, 880, 900, 960]) {
      await page.setViewportSize({ width, height: 980 })
      await page.goto('./editor/')
      await expect(page).toHaveURL(/\/presume\/editor\/$/)

      const metrics = await page.evaluate(() => {
        const workspace = document.querySelector('.workspace') as HTMLElement
        const panel = document.querySelector('.review-panel') as HTMLElement | null
        const scroller = document.querySelector('.resume-canvas-scroll') as HTMLElement
        const resume = document.querySelector('.resume-page') as HTMLElement
        const workspaceStyle = window.getComputedStyle(workspace)
        const scrollerStyle = window.getComputedStyle(scroller)
        const panelRect = panel?.getBoundingClientRect()
        return {
          bodyClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          workspaceMinWidth: workspaceStyle.minWidth,
          workspaceWidth: Math.round(workspace.getBoundingClientRect().width),
          panelWidth: panelRect ? Math.round(panelRect.width) : 0,
          panelLeft: panelRect ? Math.round(panelRect.left) : 0,
          panelRight: panelRect ? Math.round(panelRect.right) : 0,
          scrollerClientWidth: scroller.clientWidth,
          scrollerScrollWidth: scroller.scrollWidth,
          scrollerOverflowX: scrollerStyle.overflowX,
          resumeWidth: Math.round(resume.getBoundingClientRect().width),
        }
      })

      expect(metrics.documentScrollWidth, `document overflow at ${width}px`).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.bodyScrollWidth, `body overflow at ${width}px`).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.workspaceMinWidth).toBe('0px')
      expect(metrics.workspaceWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.panelLeft).toBeGreaterThanOrEqual(0)
      expect(metrics.panelRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.panelWidth).toBe(0)
      expect(metrics.scrollerOverflowX).toBe('auto')
      if (metrics.scrollerClientWidth < metrics.resumeWidth) {
        expect(metrics.scrollerClientWidth).toBeLessThan(metrics.scrollerScrollWidth)
      }
      expect(metrics.resumeWidth).toBe(816)
    }
  })
})

function hasNonblankPngBytes(bytes: Buffer): boolean {
  return bytes.length > 1_000 && new Set(bytes).size > 16
}
