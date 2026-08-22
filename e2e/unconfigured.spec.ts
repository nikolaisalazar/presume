import { expect, test } from '@playwright/test'

test.describe('unconfigured browser contracts', () => {
  test('loads, renders a nonblank resume, exports PDF, and keeps editing available', async ({ page, context }) => {
    await page.goto('./')

    await expect(page).toHaveURL(/\/presume\/$/)
    await expect(page).toHaveTitle('Presume — Local-first resume editor with stable PDF export')
    await expect(page.getByRole('heading', { name: 'Your resume should stay yours.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open the editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Edit your resume' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Appearance' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Pretext Fit Lab' })).toHaveCount(0)

    const modifier: 'Meta' | 'Control' = process.platform === 'darwin' ? 'Meta' : 'Control'
    const modifiedEditorPagePromise = context.waitForEvent('page')
    await page.getByRole('link', { name: 'Editor ↗' }).click({ modifiers: [modifier] })
    const modifiedEditorPage = await modifiedEditorPagePromise
    await expect(modifiedEditorPage).toHaveURL(/\/presume\/editor\/$/)
    await expect(page).toHaveURL(/\/presume\/$/)
    await modifiedEditorPage.close()

    await page.getByRole('button', { name: 'Open the editor' }).click()

    await expect(page).toHaveURL(/\/presume\/editor\/$/)
    await expect(page.getByRole('banner')).toContainText('Presume')
    await expect(page.locator('.resume-page')).toBeVisible()
    await expect(page.locator('[data-slot="review-rail"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review details' })).toBeVisible()

    const appearance = page.getByRole('group', { name: 'Appearance' })
    const resumePaper = page.locator('.resume-page')
    const initialPaper = await resumePaper.evaluate(element => ({
      backgroundColor: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
      width: Math.round(element.getBoundingClientRect().width),
    }))
    expect(initialPaper).toEqual({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(16, 24, 39)',
      width: 816,
    })
    await appearance.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.app-header')).toHaveCSS(
      'background-color',
      'rgb(26, 33, 31)'
    )
    await expect(appearance.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(await resumePaper.evaluate(element => ({
      backgroundColor: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
      width: Math.round(element.getBoundingClientRect().width),
    }))).toEqual(initialPaper)

    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('group', { name: 'Appearance' })
      .getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')

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

    const structuralRadii = await page
      .locator('[data-slot="fit-region"], [data-slot="document-actions"], [data-slot="review-rail"]')
      .evaluateAll(elements => elements.map(element => getComputedStyle(element).borderRadius))
    expect(structuralRadii).toEqual(['2px', '2px', '2px'])

    const stage = page.locator('.resume-canvas-scroll')
    await expect(stage).toHaveCSS('border-radius', '2px')
    await expect(stage).toHaveCSS('background-image', 'none')
    expect(await stage.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none')
    expect(await page.locator('.resume-viewport').evaluate(
      element => getComputedStyle(element).boxShadow
    )).not.toBe('none')

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

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.getByRole('group', { name: 'Appearance' })
      .getByRole('button', { name: 'System' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.goBack()
    await expect(page).toHaveURL(/\/presume\/$/)
    await expect(page.getByRole('heading', {
      name: 'Your resume should stay yours.',
    })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue editing' })).toHaveCount(2)
    await expect(page.locator('.landing-page')).toHaveCSS('background-color', 'rgb(237, 242, 240)')
  })

  test('keeps the approved landing responsive at every inclusive boundary', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('./')

    const metrics = async (width: number) => {
      await page.setViewportSize({ width, height: 980 })
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
      return page.evaluate(() => {
        const rect = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect()
        const heroCopy = rect('.landing-hero__copy')
        const heroEvidence = rect('.landing-product-stage')
        const fitCopy = rect('.landing-fit__copy')
        const fitEvidence = rect('.landing-evidence-plate')
        const reviewCopy = rect('.landing-review__copy')
        const reviewEvidence = rect('.landing-review-plate')
        const continuityCopy = rect('.landing-continuity__intro')
        const continuityPath = rect('.landing-path')
        const boundariesCopy = rect('.landing-boundaries__inner > div:first-child')
        const boundariesList = rect('.landing-boundaries__list')
        const heading = document.querySelector<HTMLElement>('.landing-hero h1')!
        const headingRect = heading.getBoundingClientRect()
        const lineHeight = Number.parseFloat(getComputedStyle(heading).lineHeight)
        const fitLink = document.querySelector<HTMLElement>('.landing-nav__links a[href="#fit"]')!
        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          h1Lines: Math.round(headingRect.height / lineHeight),
          heroStacked: heroEvidence.top >= heroCopy.bottom,
          fitStacked: fitEvidence.top >= fitCopy.bottom,
          reviewStacked: reviewEvidence.top >= reviewCopy.bottom,
          continuityStacked: continuityPath.top >= continuityCopy.bottom,
          boundariesStacked: boundariesList.top >= boundariesCopy.bottom,
          fitLinkVisible: getComputedStyle(fitLink).display !== 'none',
        }
      })
    }

    for (const [width, expected] of [
      [1001, { heroStacked: false }], [1000, { heroStacked: true }],
      [921, { reviewStacked: false }], [920, { reviewStacked: true }],
      [861, { fitStacked: false }], [860, { fitStacked: true }],
      [781, { continuityStacked: false, boundariesStacked: false }],
      [780, { continuityStacked: true, boundariesStacked: true }],
      [701, { fitLinkVisible: true }], [700, { fitLinkVisible: false }],
      [401, {}], [400, {}], [390, {}], [320, {}],
    ] as const) {
      const result = await metrics(width)
      expect.soft(result.scrollWidth, `overflow at ${width}px`).toBeLessThanOrEqual(result.clientWidth)
      expect.soft(result.h1Lines, `H1 lines at ${width}px`).toBeLessThanOrEqual(3)
      for (const [key, value] of Object.entries(expected)) {
        expect.soft(result[key as keyof typeof result], `${key} at ${width}px`).toBe(value)
      }
    }

    await page.setViewportSize({ width: 400, height: 980 })
    await page.locator('.landing-review-plate').scrollIntoViewIfNeeded()
    expect(await page.locator('.landing-capture--review img').evaluate(image => (image as HTMLImageElement).currentSrc))
      .toContain('working-review-narrow-essential-hardened')

    await page.goto('./')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
  })

  test('operates the live Pretext boundary with keyboard and pointer at wide and narrow widths', async ({ page }) => {
    await page.goto('./')

    for (const width of [1200, 390]) {
      await page.setViewportSize({ width, height: 980 })
      const instrument = page.locator('.landing-pretext')
      await instrument.scrollIntoViewIfNeeded()
      await expect(instrument).toHaveAttribute('aria-busy', 'false')
      const slider = page.getByRole('slider', { name: 'Available text width' })
      await expect(instrument.locator('[data-pretext-stage]')).toHaveCSS('touch-action', 'auto')
      await expect(slider).toHaveCSS('touch-action', 'none')
      const widthReadout = instrument.locator('[data-pretext-width]')
      const lineReadout = instrument.locator('[data-pretext-lines]')
      await expect(widthReadout).toHaveText(/\d+px/)
      await expect(lineReadout).toHaveText(/\d+/)
      const lineGeometry = await instrument.evaluate(element => {
        const available = Number.parseFloat(element.querySelector<HTMLElement>('[data-pretext-width]')!.textContent!)
        const text = element.querySelector<HTMLElement>('.landing-pretext__text')!
        const lineWidths = Array.from(text.children).map(line => {
          const range = document.createRange()
          range.selectNodeContents(line)
          return range.getBoundingClientRect().width
        })
        const style = getComputedStyle(text)
        const measuredWidestLine = Number.parseFloat(
          element.querySelector<HTMLElement>('[data-pretext-widest]')!.textContent!.match(/[\d.]+/)![0]
        )
        return {
          available,
          measuredWidestLine,
          widestRenderedLine: Math.max(...lineWidths),
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          letterSpacing: style.letterSpacing,
        }
      })
      expect(lineGeometry.widestRenderedLine).toBeLessThanOrEqual(lineGeometry.available + 1)
      expect(Math.abs(lineGeometry.widestRenderedLine - lineGeometry.measuredWidestLine)).toBeLessThanOrEqual(2)
      expect(lineGeometry.fontFamily).toContain('Geist')
      expect(lineGeometry.fontSize).toBe('28px')
      expect(lineGeometry.fontWeight).toBe('540')
      expect(['0px', 'normal']).toContain(lineGeometry.letterSpacing)
      if (width === 1200) {
        await expect(widthReadout).toHaveText('340px')
        await expect(lineReadout).toHaveText('3')
      }

      await slider.focus()
      await page.keyboard.press('Home')
      await expect(slider).toHaveAttribute('aria-valuenow', '116')
      const homeLines = Number(await lineReadout.textContent())
      await page.keyboard.press('Shift+ArrowRight')
      await expect(slider).toHaveAttribute('aria-valuenow', '132')
      await page.keyboard.press('End')
      const endWidth = Number(await slider.getAttribute('aria-valuenow'))
      const endLines = Number(await lineReadout.textContent())
      expect(endWidth).toBeGreaterThan(132)
      expect(endLines).toBeLessThanOrEqual(homeLines)

      const grip = instrument.locator('.landing-pretext__grip')
      const box = await grip.boundingBox()
      if (!box) throw new Error('Pretext grip has no layout box')
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await expect(slider).toHaveClass(/is-dragging/)
      await page.mouse.move(box.x + box.width / 2 - 48, box.y + box.height / 2)
      await page.mouse.up()
      await expect(slider).not.toHaveClass(/is-dragging/)
      expect(Number(await slider.getAttribute('aria-valuenow'))).toBe(endWidth - 48)
      await expect(slider).toHaveAttribute('aria-valuetext', /pixels available width, \d+ lines/)

      const overflow = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }))
      expect(overflow.scroll).toBeLessThanOrEqual(overflow.client)
    }

    const link = page.getByRole('link', { name: 'Explore Pretext’s live demos ↗' })
    await expect(link).toHaveAttribute('href', 'https://chenglou.me/pretext/')
    await expect(page.getByText('Text changes shape as the space around it changes.')).toBeVisible()
    expect(await page.locator('.landing-pretext').textContent()).not.toMatch(/\b(resume|document|paper|date|warning|target)\b/i)
  })

  test('preloads Geist and keeps cold-load layout shift within budget', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      Reflect.set(window, '__landingCls', 0)
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number }
          if (!shift.hadRecentInput) {
            Reflect.set(window, '__landingCls', Reflect.get(window, '__landingCls') + shift.value)
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })

    await page.goto('./', { waitUntil: 'networkidle' })
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

    await expect(page.locator('link[rel="preload"][as="font"]')).toHaveAttribute(
      'href',
      /\/presume\/assets\/Geist-Variable-.*\.woff2$/
    )
    expect(await page.evaluate(() => Reflect.get(window, '__landingCls'))).toBeLessThanOrEqual(0.01)
  })

  test('loads only prioritized hero evidence eagerly and preserves an accessible image failure state', async ({ page }) => {
    const requests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/landing/') && request.resourceType() === 'image') requests.push(request.url())
    })
    let rejectReviewCapture!: () => void
    const reviewCaptureGate = new Promise<void>(resolve => { rejectReviewCapture = resolve })
    await page.route('**/landing/working-review-*.png', async route => {
      await reviewCaptureGate
      await route.abort()
    })
    await page.setViewportSize({ width: 700, height: 800 })
    await page.goto('./')

    const heroImage = page.locator('.landing-product-stage img')
    await expect(heroImage).toBeVisible()
    await expect(heroImage).toHaveAttribute('loading', 'eager')
    await expect(heroImage).toHaveAttribute('fetchpriority', 'high')
    await expect(page.locator('.landing-capture--review img')).toHaveAttribute('loading', 'lazy')
    expect(requests.some(url => url.includes('editor-hero-narrow-hardened'))).toBe(true)

    await page.locator('.landing-review-plate').scrollIntoViewIfNeeded()
    await expect.poll(() => requests.some(url => url.includes('working-review'))).toBe(true)
    const reservedGeometry = await page.locator('.landing-capture--review').evaluate(element => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }))
    rejectReviewCapture()
    await expect(page.getByRole('status', { name: 'Review product capture unavailable' }))
      .toHaveText('Product capture unavailable')
    await expect(page.getByText('Deterministic repository response')).toBeVisible()
    const fallbackGeometry = await page.locator('.landing-capture--review').evaluate(element => ({
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }))
    expect(Math.abs(fallbackGeometry.width - reservedGeometry.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(fallbackGeometry.height - reservedGeometry.height)).toBeLessThanOrEqual(1)
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
      const segments = stepper.querySelector('[data-slot="constraint-stepper-segments"]') as HTMLElement
      const toolbar = document.querySelector('[role="toolbar"]') as HTMLElement
      const actionGroups = Array.from(toolbar.querySelectorAll('[data-slot="toolbar-group"]'))
        .map(group => Array.from(group.querySelectorAll('[data-slot="button"]'))
          .map(button => button.textContent?.trim()))
      const decrease = stepper.querySelector('button') as HTMLElement
      const value = stepper.querySelector('[data-slot="constraint-stepper-value"]') as HTMLElement
      const rowRect = row.getBoundingClientRect()
      const stepperRect = stepper.getBoundingClientRect()
      const decreaseRect = decrease.getBoundingClientRect()
      const stepperStyle = getComputedStyle(stepper)
      const segmentsStyle = segments ? getComputedStyle(segments) : null
      const decreaseStyle = getComputedStyle(decrease)
      const valueStyle = getComputedStyle(value)
      return {
        bodyClientWidth: document.documentElement.clientWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        rowLeft: Math.round(rowRect.left),
        rowRight: Math.round(rowRect.right),
        stepperWidth: Math.round(stepperRect.width),
        buttonWidth: Math.round(decreaseRect.width),
        buttonHeight: Math.round(decreaseRect.height),
        stepperBorderRadius: stepperStyle.borderRadius,
        stepperOverflow: stepperStyle.overflow,
        segmentsOverflow: segmentsStyle?.overflow ?? null,
        stepperBackground: stepperStyle.backgroundColor,
        buttonBorderWidth: decreaseStyle.borderWidth,
        valueBackground: valueStyle.backgroundColor,
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
    expect(metrics.stepperBorderRadius).toBe('4px')
    expect(metrics.stepperOverflow).toBe('visible')
    expect(metrics.segmentsOverflow).toBe('hidden')
    expect(metrics.buttonBorderWidth).toBe('0px')
    expect(metrics.valueBackground).not.toBe(metrics.stepperBackground)
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

  test('keeps the wide Fit summary fully readable', async ({ page }) => {
    await page.setViewportSize({ width: 1640, height: 1100 })
    await page.goto('./editor/')

    const fitTrigger = page.getByRole('button', { name: /Fit constraints/ })
    const summary = fitTrigger.getByText('1 page · 1 line/bullet · 8px min', {
      exact: true,
    })
    const summaryMetrics = await fitTrigger.evaluate((trigger, summaryText) => {
      const label = Array.from(trigger.querySelectorAll('span')).find(
        element => element.textContent?.trim() === 'Fit constraints'
      )!
      const summaryElement = Array.from(trigger.querySelectorAll('span')).find(
        element => element.textContent?.trim() === summaryText
      )!
      const labelRect = label.getBoundingClientRect()
      const summaryRect = summaryElement.getBoundingClientRect()
      const triggerGap = Number.parseFloat(getComputedStyle(trigger).columnGap)
      return {
        client: summaryElement.clientWidth,
        scroll: summaryElement.scrollWidth,
        headroom: summaryRect.left - labelRect.right - triggerGap,
      }
    }, '1 page · 1 line/bullet · 8px min')
    expect(summaryMetrics.scroll).toBeLessThanOrEqual(summaryMetrics.client)
    expect(summaryMetrics.headroom).toBeGreaterThanOrEqual(4)
  })

  test('keeps the Light-theme Fit keyboard focus visible', async ({ page }) => {
    await page.setViewportSize({ width: 1640, height: 1100 })
    await page.goto('./editor/')

    const appearance = page.getByRole('group', { name: 'Appearance' })
    await appearance.getByRole('button', { name: 'Light' }).click()
    const fitTrigger = page.getByRole('button', { name: /Fit constraints/ })

    await page.keyboard.press('Tab')
    await expect(fitTrigger).toBeFocused()

    const focusStyle = async (element: ReturnType<typeof page.getByRole>) =>
      element.evaluate(node => {
        const style = getComputedStyle(node)
        return {
          outlineWidth: style.outlineWidth,
          outlineOffset: style.outlineOffset,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        }
      })

    expect(await focusStyle(fitTrigger)).toEqual({
      outlineWidth: '2px',
      outlineOffset: '3px',
      outlineStyle: 'solid',
      boxShadow: expect.stringContaining('rgb(20, 121, 111)'),
    })
    await expect(page.locator('[data-slot="fit-region"]')).toHaveCSS(
      'overflow',
      'visible'
    )

    await page.keyboard.press('Enter')
    await page.keyboard.press('Tab')
    const increasePages = page.getByRole('button', { name: 'Increase max pages' })
    await expect(increasePages).toBeFocused()
    const pageStepper = page.locator('[data-slot="constraint-stepper"]', {
      has: increasePages,
    })
    expect(await focusStyle(pageStepper)).toEqual({
      outlineWidth: '2px',
      outlineOffset: '3px',
      outlineStyle: 'solid',
      boxShadow: expect.stringContaining('rgb(20, 121, 111)'),
    })
    await expect(pageStepper).toHaveCSS('overflow', 'visible')
    await expect(
      pageStepper.locator('[data-slot="constraint-stepper-segments"]')
    ).toHaveCSS('overflow', 'hidden')
    expect((await increasePages.evaluate(element => getComputedStyle(element).boxShadow)))
      .toContain('rgb(20, 121, 111)')
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
    expect(wide.documentWidth).toBeLessThanOrEqual(wide.viewportWidth)

    const wideMax = await editorGeometry(1920)
    expect(wideMax.fit.width).toBe(320)
    expect(wideMax.review.width).toBe(320)
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
