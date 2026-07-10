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

    const commandDeck = page.locator('[data-slot="command-deck"]')
    await expect(commandDeck).toBeVisible()
    await expect(commandDeck.locator('[data-slot="button"]')).toHaveCount(4)
    await expect(commandDeck.locator('[data-slot="separator"]')).toHaveCount(1)
    await expect(commandDeck.locator('[data-slot="button"]')).toHaveText([
      'Export PDF',
      'Export JSON',
      'Import JSON',
      'Reset template',
    ])

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
    await page.emulateMedia({ reducedMotion: 'reduce' })
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

    const collectBoundaryMetrics = async (width: number) => {
      await page.setViewportSize({ width, height: 980 })
      await page.evaluate(() => new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }))

      return page.evaluate(() => {
        const header = document.querySelector<HTMLElement>(
          'header[aria-label="Presume landing navigation"]'
        )!
        const headerAction = header.querySelector<HTMLElement>('[data-slot="button"]')!
        const preview = document.querySelector<HTMLElement>(
          '[role="img"][aria-label="Presume editor preview"]'
        )!
        const hero = preview.parentElement!
        const heroCopy = preview.previousElementSibling as HTMLElement
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>('[data-slot="card"]')
        ).map(card => card.getBoundingClientRect())
        const steps = Array.from(
          document.querySelectorAll<HTMLElement>('section[aria-labelledby="workflow-title"] ol > li')
        ).map(step => step.getBoundingClientRect())
        const previewRect = preview.getBoundingClientRect()
        const heroRect = hero.getBoundingClientRect()
        const heroCopyRect = heroCopy.getBoundingClientRect()
        const previewVisible = getComputedStyle(preview).display !== 'none'
        const previewOverlapsCopy = previewVisible && !(
          heroCopyRect.right <= previewRect.left ||
          previewRect.right <= heroCopyRect.left ||
          heroCopyRect.bottom <= previewRect.top ||
          previewRect.bottom <= heroCopyRect.top
        )

        return {
          bodyClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          headerActionHeight: Math.round(headerAction.getBoundingClientRect().height),
          headerFlexDirection: getComputedStyle(header).flexDirection,
          previewVisible,
          featureLefts: cards.map(card => Math.round(card.left)),
          featureTops: cards.map(card => Math.round(card.top)),
          workflowLefts: steps.map(step => Math.round(step.left)),
          workflowTops: steps.map(step => Math.round(step.top)),
          heroColumnCount: getComputedStyle(hero).gridTemplateColumns.split(' ').length,
          previewOverlapsCopy,
          previewWithinHero: !previewVisible || (
            previewRect.left >= heroRect.left &&
            previewRect.right <= heroRect.right &&
            previewRect.top >= heroRect.top &&
            previewRect.bottom <= heroRect.bottom
          ),
        }
      })
    }

    const at640 = await collectBoundaryMetrics(640)
    expect.soft(at640.headerActionHeight, 'header action height at 640px').toBeGreaterThanOrEqual(44)
    expect.soft(at640.headerFlexDirection, 'header direction at 640px').toBe('column')
    expect.soft(at640.previewVisible, 'preview visibility at 640px').toBe(false)
    expect.soft(new Set(at640.featureLefts).size, 'feature columns at 640px').toBe(1)
    expect.soft(new Set(at640.featureTops).size, 'feature rows at 640px').toBe(4)
    expect.soft(at640.documentScrollWidth, 'document overflow at 640px').toBeLessThanOrEqual(
      at640.bodyClientWidth
    )

    const at641 = await collectBoundaryMetrics(641)
    expect.soft(at641.headerActionHeight, 'header action height at 641px').toBe(32)
    expect.soft(at641.headerFlexDirection, 'header direction at 641px').toBe('row')
    expect.soft(at641.previewVisible, 'preview visibility at 641px').toBe(true)
    expect.soft(new Set(at641.featureLefts).size, 'feature columns at 641px').toBe(2)
    expect.soft(new Set(at641.featureTops).size, 'feature rows at 641px').toBe(2)

    const at920 = await collectBoundaryMetrics(920)
    expect.soft(new Set(at920.featureLefts).size, 'feature columns at 920px').toBe(2)
    expect.soft(new Set(at920.featureTops).size, 'feature rows at 920px').toBe(2)
    expect.soft(new Set(at920.workflowLefts).size, 'workflow columns at 920px').toBe(1)
    expect.soft(new Set(at920.workflowTops).size, 'workflow rows at 920px').toBe(3)
    expect.soft(at920.documentScrollWidth, 'document overflow at 920px').toBeLessThanOrEqual(
      at920.bodyClientWidth
    )

    const at921 = await collectBoundaryMetrics(921)
    expect.soft(new Set(at921.featureLefts).size, 'feature columns at 921px').toBe(4)
    expect.soft(new Set(at921.featureTops).size, 'feature rows at 921px').toBe(1)
    expect.soft(new Set(at921.workflowTops).size, 'workflow rows at 921px').toBe(1)
    expect.soft(at921.workflowLefts[0], 'first workflow step at 921px').toBeLessThan(
      at921.workflowLefts[1]
    )
    expect.soft(at921.workflowLefts[1], 'second workflow step at 921px').toBeLessThan(
      at921.workflowLefts[2]
    )
    expect.soft(at921.previewVisible, 'preview visibility at 921px').toBe(true)
    expect.soft(at921.heroColumnCount, 'hero columns at 921px').toBe(2)
    expect.soft(at921.previewOverlapsCopy, 'hero overlap at 921px').toBe(false)
    expect.soft(at921.previewWithinHero, 'preview bounds at 921px').toBe(true)
  })

  test('keeps expanded fit constraints usable at narrow widths', async ({ page }) => {
    await page.setViewportSize({ width: 358, height: 980 })
    await page.goto('./editor/')
    await page.getByRole('button', { name: /Fit constraints/ }).click()

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('[data-slot="collapsible-content"]') as HTMLElement
      const row = content.firstElementChild?.firstElementChild as HTMLElement
      const stepper = row.querySelector('[aria-label="Page limit"]') as HTMLElement
      const toolbar = document.querySelector('[role="toolbar"]') as HTMLElement
      const actionGroups = Array.from(toolbar.children)
        .filter(child => (child as HTMLElement).classList.contains('toolbar__group'))
        .map(group => Array.from(group.querySelectorAll('[data-slot="button"]'))
          .map(button => button.textContent?.trim()))
      const decrease = stepper.querySelector('button') as HTMLElement
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
        actionGroups,
      }
    })

    expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.rowLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.rowRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.stepperWidth).toBeGreaterThanOrEqual(132)
    expect(metrics.buttonWidth).toBeGreaterThanOrEqual(44)
    expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44)
    expect(metrics.actionGroups).toEqual([
      ['Export PDF', 'Export JSON'],
      ['Import JSON', 'Reset template'],
    ])
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
