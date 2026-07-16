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
    await expect(page.locator('[data-slot="review-rail"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review details' })).toBeVisible()

    const commandDeck = page.locator('[data-slot="document-actions"]')
    await expect(commandDeck).toBeVisible()
    await expect(commandDeck.locator('[data-slot="button"]')).toHaveCount(4)
    await expect(commandDeck.locator('[data-slot="separator"]')).toHaveCount(0)
    await expect(commandDeck.locator('[data-slot="button"]')).toHaveText([
      'Export PDF',
      'Export JSON',
      'Import JSON',
      'Reset template',
    ])

    const shellShadows = await page
      .locator('.app-header, [data-slot="fit-region"], [data-slot="document-actions"], [data-slot="review-rail"]')
      .evaluateAll(elements => elements.map(element => getComputedStyle(element).boxShadow))
    expect(shellShadows).toHaveLength(4)
    expect(shellShadows).not.toContainEqual(
      expect.stringContaining('rgba(255, 255, 255, 0.95) 0px 1px 0px 0px')
    )

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

  test('keeps the Fit constraints header stable and its expanded controls usable', async ({ page }) => {
    await page.setViewportSize({ width: 358, height: 980 })
    await page.addInitScript(() => {
      localStorage.setItem('presume:constraints', JSON.stringify({
        maxPages: 10,
        maxLinesPerBullet: 10,
        minFontSize: 16,
      }))
    })
    await page.goto('./editor/')
    const fitTrigger = page.getByRole('button', { name: /Fit constraints/ })
    const collapsedTriggerHeight = await fitTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )
    await fitTrigger.click()
    const expandedTriggerHeight = await fitTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )

    const metrics = await page.evaluate(() => {
      const content = document.querySelector('[data-slot="collapsible-content"]') as HTMLElement
      const row = content.firstElementChild?.firstElementChild as HTMLElement
      const stepper = row.querySelector('[aria-label="Page limit"]') as HTMLElement
      const toolbar = document.querySelector('[role="toolbar"]') as HTMLElement
      const actionGroups = Array.from(toolbar.querySelectorAll('[data-slot="toolbar-group"]'))
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
    expect(collapsedTriggerHeight).toBe(48)
    expect(expandedTriggerHeight).toBe(collapsedTriggerHeight)
    expect(metrics.rowLeft).toBeGreaterThanOrEqual(0)
    expect(metrics.rowRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
    expect(metrics.stepperWidth).toBeGreaterThanOrEqual(132)
    expect(metrics.buttonWidth).toBeGreaterThanOrEqual(44)
    expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44)
    expect(metrics.actionGroups).toEqual([
      ['Export PDF', 'Export JSON'],
      ['Import JSON', 'Reset template'],
    ])

    await page.setViewportSize({ width: 560, height: 980 })
    await page.reload()
    const boundaryTrigger = page.getByRole('button', { name: /Fit constraints/ })
    const boundaryCollapsedHeight = await boundaryTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )
    await boundaryTrigger.click()
    const boundaryExpandedHeight = await boundaryTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )
    expect(boundaryCollapsedHeight).toBe(48)
    expect(boundaryExpandedHeight).toBe(boundaryCollapsedHeight)

    await page.setViewportSize({ width: 1920, height: 1100 })
    await page.reload()
    const wideTrigger = page.getByRole('button', { name: /Fit constraints/ })
    const wideCollapsedHeight = await wideTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )
    await wideTrigger.click()
    const wideExpandedHeight = await wideTrigger.evaluate(element =>
      Math.round(element.getBoundingClientRect().height)
    )
    expect(wideExpandedHeight).toBe(wideCollapsedHeight)
  })

  test('keeps viewport overflow inside the fixed resume canvas scroller at narrow widths', async ({ page }) => {
    const editorGeometry = async (width: number) => {
      await page.setViewportSize({ width, height: 1100 })
      await page.goto('./editor/')
      return page.evaluate(() => {
        const header = document.querySelector('.app-header')!.getBoundingClientRect()
        const workspace = document.querySelector('.workspace')!.getBoundingClientRect()
        const fit = document.querySelector('.fit-region')!.getBoundingClientRect()
        const editor = document.querySelector('.editor-panel')!.getBoundingClientRect()
        const review = document.querySelector('.review-region')!.getBoundingClientRect()
        const actions = document.querySelector('[data-slot="document-actions"]')!.getBoundingClientRect()
        const reviewRail = document.querySelector('[data-slot="review-rail"]')!.getBoundingClientRect()
        const resume = document.querySelector('.resume-page')!.getBoundingClientRect()
        const scroller = document.querySelector('.resume-canvas-scroll') as HTMLElement
        const scrollerRect = scroller.getBoundingClientRect()
        return {
          header: { left: header.left, right: header.right, width: header.width },
          workspace: { left: workspace.left, right: workspace.right },
          fit: { left: fit.left, right: fit.right, top: fit.top, bottom: fit.bottom, width: fit.width },
          editor: { left: editor.left, right: editor.right, top: editor.top, bottom: editor.bottom, width: editor.width },
          review: { left: review.left, right: review.right, top: review.top, bottom: review.bottom, width: review.width },
          actionsHeight: actions.height,
          reviewRailHeight: reviewRail.height,
          scroller: { left: scrollerRect.left, right: scrollerRect.right },
          resume: { left: resume.left, right: resume.right },
          resumeWidth: resume.width,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          scrollerClientWidth: scroller.clientWidth,
          scrollerScrollWidth: scroller.scrollWidth,
        }
      })
    }

    for (const width of [358, 860, 861, 880, 900, 960]) {
      await page.setViewportSize({ width, height: 980 })
      await page.goto('./editor/')
      await expect(page).toHaveURL(/\/presume\/editor\/$/)

      const metrics = await page.evaluate(() => {
        const workspace = document.querySelector('.workspace') as HTMLElement
        const review = document.querySelector('.review-region') as HTMLElement
        const scroller = document.querySelector('.resume-canvas-scroll') as HTMLElement
        const resume = document.querySelector('.resume-page') as HTMLElement
        const resumeViewport = document.querySelector('.resume-viewport') as HTMLElement
        const workspaceStyle = window.getComputedStyle(workspace)
        const scrollerStyle = window.getComputedStyle(scroller)
        const reviewRect = review.getBoundingClientRect()
        const resumeRect = resume.getBoundingClientRect()
        const resumeViewportRect = resumeViewport.getBoundingClientRect()
        const resumeStyle = getComputedStyle(resume)
        const representativeBullet = document.querySelector('.bullet-item') as HTMLElement
        return {
          bodyClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          workspaceMinWidth: workspaceStyle.minWidth,
          workspaceWidth: Math.round(workspace.getBoundingClientRect().width),
          reviewLeft: Math.round(reviewRect.left),
          reviewRight: Math.round(reviewRect.right),
          scrollerClientWidth: scroller.clientWidth,
          scrollerScrollWidth: scroller.scrollWidth,
          scrollerOverflowX: scrollerStyle.overflowX,
          resumeWidth: Math.round(resumeRect.width),
          resumeHeight: Math.round(resumeRect.height),
          resumeOffsetWidth: resume.offsetWidth,
          resumeCssZoom: resumeStyle.getPropertyValue('zoom') || '1',
          representativeBulletFontSize: Number.parseFloat(
            getComputedStyle(representativeBullet).fontSize
          ),
          resumeViewportWidth: Math.round(resumeViewportRect.width),
          resumeViewportHeight: Math.round(resumeViewportRect.height),
        }
      })

      expect(metrics.documentScrollWidth, `document overflow at ${width}px`).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.bodyScrollWidth, `body overflow at ${width}px`).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.workspaceMinWidth).toBe('0px')
      expect(metrics.workspaceWidth).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.reviewLeft).toBeGreaterThanOrEqual(0)
      expect(metrics.reviewRight).toBeLessThanOrEqual(metrics.bodyClientWidth)
      expect(metrics.scrollerOverflowX).toBe('auto')
      if (metrics.scrollerClientWidth < metrics.resumeWidth) {
        expect(metrics.scrollerClientWidth).toBeLessThan(metrics.scrollerScrollWidth)
      }
      expect(metrics.resumeWidth).toBe(816)
      expect(metrics.resumeViewportWidth, `resume viewport width at ${width}px`).toBe(816)
      expect(metrics.resumeViewportHeight, `resume viewport height at ${width}px`).toBe(
        metrics.resumeHeight
      )
      expect(metrics.resumeOffsetWidth, `author width at ${width}px`).toBe(3672)
      expect(metrics.resumeCssZoom, `CSS zoom at ${width}px`).toBe('1')
      expect(metrics.representativeBulletFontSize, `author font at ${width}px`).toBeGreaterThanOrEqual(36)
      expect(metrics.scrollerScrollWidth, `internal scale leak at ${width}px`).toBeLessThan(1000)
    }

    await page.setViewportSize({ width: 960, height: 1100 })
    await page.goto('./editor/')

    const resumeViewport = page.locator('.resume-viewport')
    const resume = page.locator('.resume-page')
    await resume.evaluate(element => {
      element.style.minHeight = '6300px'
    })

    await expect.poll(async () =>
      Math.round(await resumeViewport.evaluate(element => element.getBoundingClientRect().height))
    ).toBe(1400)

    const wide = await editorGeometry(1640)
    expect(wide.fit.right).toBeLessThanOrEqual(wide.editor.left)
    expect(wide.review.left).toBeGreaterThanOrEqual(wide.editor.right)
    expect(Math.abs((wide.editor.left + wide.editor.right) / 2 - 820)).toBeLessThanOrEqual(1)
    expect(wide.editor.width).toBe(896)
    expect(wide.header.width).toBeGreaterThan(wide.editor.width)
    expect(wide.resumeWidth).toBe(816)
    expect(Math.abs(wide.fit.width - wide.review.width)).toBeLessThanOrEqual(1)

    const wideMax = await editorGeometry(1920)
    expect(wideMax.fit.width).toBe(360)
    expect(wideMax.review.width).toBe(360)
    expect(Math.abs(wideMax.fit.bottom - wideMax.fit.top - wideMax.actionsHeight)).toBeLessThanOrEqual(1)
    expect(Math.abs(wideMax.reviewRailHeight - wideMax.actionsHeight)).toBeLessThanOrEqual(1)
    expect(
      Math.abs(
        (wideMax.resume.left + wideMax.resume.right) / 2 -
        (wideMax.scroller.left + wideMax.scroller.right) / 2
      )
    ).toBeLessThanOrEqual(1)

    const constrained = await editorGeometry(1639)
    expect(constrained.fit.bottom).toBeLessThanOrEqual(constrained.editor.top)
    expect(constrained.editor.bottom).toBeLessThanOrEqual(constrained.review.top)
    expect(Math.abs((constrained.editor.left + constrained.editor.right) / 2 - 819.5)).toBeLessThanOrEqual(1)
    expect(constrained.editor.width).toBe(896)
    expect(constrained.resumeWidth).toBe(816)

    const narrow = await editorGeometry(358)
    expect(narrow.resumeWidth).toBe(816)
    expect(narrow.documentWidth).toBeLessThanOrEqual(narrow.viewportWidth)
    expect(narrow.scrollerClientWidth).toBeLessThan(narrow.scrollerScrollWidth)
  })
})

function hasNonblankPngBytes(bytes: Buffer): boolean {
  return bytes.length > 1_000 && new Set(bytes).size > 16
}
