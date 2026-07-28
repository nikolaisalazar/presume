import { expect, test } from '@playwright/test'

test.describe('unconfigured browser contracts', () => {
  test('loads, renders a nonblank resume, exports PDF, and keeps editing available', async ({ page }) => {
    await page.goto('./')

    await expect(page).toHaveURL(/\/presume\/$/)
    await expect(page.getByRole('heading', { name: 'Presume is a local-first resume workbench.' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open the editor' }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Open the editor' }).first().click()

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
      name: 'Presume is a local-first resume workbench.',
    })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('keeps the landing identity responsive at its inclusive boundaries', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1120, height: 980 })
    await page.goto('./')

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
        const hero = document.querySelector<HTMLElement>('[data-slot="landing-hero"]')!
        const heroImage = hero.querySelector<HTMLElement>('[data-slot="landing-hero-media"]')!
        const heroCopy = hero.querySelector<HTMLElement>('.landing-hero__content')!
        const heroHeading = hero.querySelector<HTMLElement>('h1')!
        const capabilities = Array.from(
          document.querySelectorAll<HTMLElement>('[data-slot="capability-row"]')
        ).map(row => row.getBoundingClientRect())
        const origins = document.querySelector<HTMLElement>('.landing-origins')!
        const heroRect = hero.getBoundingClientRect()
        const heroCopyRect = heroCopy.getBoundingClientRect()
        const heroHeadingRect = heroHeading.getBoundingClientRect()
        const imageVisible = getComputedStyle(heroImage).display !== 'none'
        const heroHeadingLineHeight = Number.parseFloat(
          getComputedStyle(heroHeading).lineHeight
        )

        return {
          bodyClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          headerActionHeight: Math.round(headerAction.getBoundingClientRect().height),
          headerFlexDirection: getComputedStyle(header).flexDirection,
          imageVisible,
          heroHeadingFontSize: Number.parseFloat(
            getComputedStyle(heroHeading).fontSize
          ),
          heroHeadingWidth: Math.round(heroHeadingRect.width),
          heroHeadingLines: Math.round(
            heroHeadingRect.height / heroHeadingLineHeight
          ),
          featureLefts: capabilities.map(row => Math.round(row.left)),
          featureTops: capabilities.map(row => Math.round(row.top)),
          originsGridColumns: getComputedStyle(origins).gridTemplateColumns
            .split(' ')
            .filter(Boolean)
            .length,
          heroCopyWithinHero: (
            heroCopyRect.left >= heroRect.left
            && heroCopyRect.right <= heroRect.right
            && heroCopyRect.top >= heroRect.top
            && heroCopyRect.bottom <= heroRect.bottom
          ),
        }
      })
    }

    const at358 = await collectBoundaryMetrics(358)
    expect.soft(
      at358.heroHeadingLines,
      `hero heading lines at 358px (${at358.heroHeadingWidth}px wide at ${at358.heroHeadingFontSize}px)`
    ).toBeLessThanOrEqual(3)
    expect.soft(at358.documentScrollWidth, 'document overflow at 358px').toBeLessThanOrEqual(
      at358.bodyClientWidth
    )

    const at640 = await collectBoundaryMetrics(640)
    expect.soft(at640.headerActionHeight, 'header action height at 640px').toBeGreaterThanOrEqual(44)
    expect.soft(at640.headerFlexDirection, 'header direction at 640px').toBe('column')
    expect.soft(at640.imageVisible, 'decorative image visibility at 640px').toBe(false)
    expect.soft(new Set(at640.featureLefts).size, 'feature columns at 640px').toBe(1)
    expect.soft(new Set(at640.featureTops).size, 'feature rows at 640px').toBe(4)
    expect.soft(at640.documentScrollWidth, 'document overflow at 640px').toBeLessThanOrEqual(
      at640.bodyClientWidth
    )

    const at641 = await collectBoundaryMetrics(641)
    expect.soft(at641.headerActionHeight, 'header action height at 641px').toBe(36)
    expect.soft(at641.headerFlexDirection, 'header direction at 641px').toBe('row')
    expect.soft(at641.imageVisible, 'decorative image visibility at 641px').toBe(true)
    expect.soft(new Set(at641.featureLefts).size, 'feature columns at 641px').toBe(2)
    expect.soft(new Set(at641.featureTops).size, 'feature rows at 641px').toBe(2)

    const at920 = await collectBoundaryMetrics(920)
    expect.soft(new Set(at920.featureLefts).size, 'feature columns at 920px').toBe(2)
    expect.soft(new Set(at920.featureTops).size, 'feature rows at 920px').toBe(2)
    expect.soft(at920.originsGridColumns, 'origins columns at 920px').toBe(1)
    expect.soft(at920.documentScrollWidth, 'document overflow at 920px').toBeLessThanOrEqual(
      at920.bodyClientWidth
    )

    const at921 = await collectBoundaryMetrics(921)
    expect.soft(new Set(at921.featureLefts).size, 'feature columns at 921px').toBe(4)
    expect.soft(new Set(at921.featureTops).size, 'feature rows at 921px').toBe(1)
    expect.soft(at921.originsGridColumns, 'origins columns at 921px').toBe(2)
    expect.soft(at921.imageVisible, 'decorative image visibility at 921px').toBe(true)
    expect.soft(at921.heroCopyWithinHero, 'hero copy containment at 921px').toBe(true)
    await expect.poll(async () => (
      await page.locator('.pretext-living-flow__line').allTextContents()
    ).join(' ')).toContain('available space again.')

    const brand = page.getByRole('link', { name: 'Presume home' })
    await brand.focus()
    await expect(brand).toBeFocused()
    await expect(brand).toHaveCSS('outline-style', 'solid')

    const headerAction = page.getByRole('banner', {
      name: 'Presume landing navigation',
    }).getByRole('button', { name: 'Open editor' })
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'System' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(headerAction).toBeFocused()
    expect(await headerAction.evaluate(element => {
      const style = getComputedStyle(element)
      return {
        focusVisible: element.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
      }
    })).toEqual({
      focusVisible: true,
      outlineStyle: 'solid',
      boxShadow: expect.stringContaining('rgb(20, 121, 111)'),
    })
  })

  test('matches the Light application field and renders Dark Surround in Dark', async ({ page }) => {
    await page.setViewportSize({ width: 1120, height: 980 })
    await page.goto('./')

    const appearance = page.getByRole('group', { name: 'Appearance' })
    const hero = page.locator('[data-slot="landing-hero"]')

    await appearance.getByRole('button', { name: 'Light' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(hero).toHaveCSS('background-color', 'rgb(237, 242, 240)')
    await expect(hero).toHaveCSS('color', 'rgb(23, 33, 30)')
    expect(await hero.evaluate(element =>
      getComputedStyle(element, '::after').backgroundColor
    )).toBe('color(srgb 0.929412 0.94902 0.941176 / 0.76)')

    await appearance.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(hero).toHaveCSS('background-color', 'rgb(26, 33, 31)')
    await expect(hero).toHaveCSS('color', 'rgb(240, 243, 241)')
    expect(await hero.evaluate(element =>
      getComputedStyle(element, '::after').backgroundColor
    )).toBe('color(srgb 0.0627451 0.0823529 0.0745098 / 0.72)')

    const heroAction = hero.getByRole('button', { name: /Open the editor|Continue editing/ })
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(heroAction).toBeFocused()
    await expect(heroAction).toHaveCSS('outline-style', 'solid')
  })

  test('keeps the Pretext exhibit interactive and avoids hidden hero image transfer', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 980 })
    const heroImageRequests: string[] = []
    page.on('request', request => {
      if (request.url().includes('/landing/document-horizon')) {
        heroImageRequests.push(request.url())
      }
    })

    await page.goto('./')
    await expect(page.getByRole('button', {
      name: /Move “Text responds to its surroundings”/,
    })).toBeAttached()
    const hero = page.locator('[data-slot="landing-hero"]')
    await expect(hero).toHaveAttribute('data-layout', 'compact')
    await expect(hero.locator('source')).toHaveCount(0)
    expect(heroImageRequests).toEqual([])

    await page.setViewportSize({ width: 641, height: 980 })
    await expect(hero).toHaveAttribute('data-layout', 'wide')
    await expect(hero.locator('source')).toHaveCount(1)
    await expect(hero.locator('source')).toHaveAttribute(
      'srcset',
      /document-horizon-1120\.webp.*document-horizon-2200\.webp/
    )
    await expect.poll(() => heroImageRequests.some(path =>
      /document-horizon-(?:1120|2200)\.webp/.test(path)
    )).toBe(true)
    await page.setViewportSize({ width: 560, height: 980 })

    const movableHeadline = page.getByRole('button', {
      name: /Move “Text responds to its surroundings”/,
    })
    await expect(movableHeadline).toBeVisible()
    const initialPosition = await movableHeadline.getAttribute('data-position')
    await movableHeadline.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(movableHeadline).not.toHaveAttribute(
      'data-position',
      initialPosition ?? ''
    )
    const keyboardPosition = await movableHeadline.getAttribute('data-position')
    const headlineBox = await movableHeadline.boundingBox()
    expect(headlineBox).not.toBeNull()
    if (headlineBox) {
      await page.mouse.move(
        headlineBox.x + headlineBox.width / 2,
        headlineBox.y + headlineBox.height / 2
      )
      await page.mouse.down()
      await page.mouse.move(
        headlineBox.x + headlineBox.width / 2 - 40,
        headlineBox.y + headlineBox.height / 2 + 24
      )
      await page.mouse.up()
    }
    await expect(movableHeadline).not.toHaveAttribute(
      'data-position',
      keyboardPosition ?? ''
    )
    await expect(
      page.getByRole('button', { name: 'Reset position' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Reset position' }).click()
    await expect(
      page.getByRole('button', { name: 'Reset position' })
    ).not.toBeAttached()

    await page.getByRole('button', { name: 'Edit passage' }).click()
    const passageEditor = page.getByRole('textbox', {
      name: 'Pretext demonstration passage',
    })
    await expect(passageEditor).toBeVisible()
    await passageEditor.fill('A revised passage.')
    await page.getByRole('button', { name: 'View flow' }).click()
    await expect(
      page.getByRole('paragraph').filter({ hasText: 'A revised passage.' })
    ).toBeAttached()

    await page.setViewportSize({ width: 358, height: 980 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(358)
    await expect.poll(() => movableHeadline.evaluate(element => {
      const stage = element.closest('.pretext-living-flow__stage')!
      return (
        Math.round(element.getBoundingClientRect().right) <=
        Math.round(stage.getBoundingClientRect().right)
      )
    })).toBe(true)
  })

  test('keeps live hero content complete when the decorative image fails', async ({ page }) => {
    let requestAborted = false
    await page.route('**/landing/document-horizon-*.webp', async route => {
      requestAborted = true
      await route.abort()
    })
    await page.setViewportSize({ width: 1120, height: 980 })

    await page.goto('./')

    expect(requestAborted).toBe(true)
    const hero = page.getByRole('region', {
      name: 'Presume is a local-first resume workbench.',
    })
    await expect(
      hero.getByRole('heading', {
        name: 'Presume is a local-first resume workbench.',
      })
    ).toBeVisible()
    const primaryAction = hero.getByRole('button', { name: 'Open the editor' })
    await expect(primaryAction).toBeVisible()
    await expect(primaryAction).toBeEnabled()
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
