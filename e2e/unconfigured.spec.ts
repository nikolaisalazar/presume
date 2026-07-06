import { expect, test } from '@playwright/test'

test.describe('unconfigured browser contracts', () => {
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
