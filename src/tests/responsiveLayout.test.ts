import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(`${process.cwd()}/src/styles/app.css`, 'utf8')
const resumeCss = readFileSync(`${process.cwd()}/src/styles/resume.css`, 'utf8')

describe('custom editor CSS invariants', () => {
  it('keeps named fixed-canvas and derived wide-workspace geometry', () => {
    expect(appCss).toContain('--editor-shell-width: calc(var(--page-width) + (var(--stage-padding) * 2) + 32px);')
    expect(appCss).toContain('--editor-rail-height: calc(3.75rem + 2px);')
    expect(appCss).toContain('--wide-workspace-width: 1580px;')
    expect(appCss).toContain('@media (min-width: 1640px)')
    expect(appCss).toContain('grid-template-columns: 320px var(--editor-shell-width) 320px;')
  })

  it('keeps the stage opaque and the final document viewport most elevated', () => {
    expect(appCss).not.toContain('--editor-stage-surface:')
    expect(appCss).not.toContain('--stage-surface:')
    expect(appCss).toContain('background: var(--stage);')
    expect(appCss).toContain('border-radius: var(--radius-structural);')
    expect(appCss).toContain('.resume-canvas .resume-viewport')
    expect(appCss).toContain('box-shadow: var(--shadow-document);')
    expect(appCss).toContain('--shadow-page: var(--shadow-document);')
    expect(appCss).not.toContain('filter: drop-shadow(')
  })

  it('reserves scrollbar tolerance at the exact wide-workbench boundary', () => {
    expect(appCss).toMatch(
      /@media \(min-width: 1640px\) \{[\s\S]*?\.app \{[\s\S]*?padding-inline: 20px;/
    )
  })

  it('keeps fixed-canvas scrolling and the 3px review progress hook custom', () => {
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('overflow-x: auto')
    expect(appCss).not.toContain('scrollbar-gutter: stable both-edges')
    expect(appCss).toContain('.review-rail__progress')
    expect(appCss).toContain('height: 3px')
    expect(appCss).toContain('background: var(--review-progress);')
    expect(appCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.review-rail__progress \{[\s\S]*?width: 100%;[\s\S]*?left: 0;[\s\S]*?transform: none;[\s\S]*?animation: none;/
    )
  })

  it('keeps in-document controls and print hiding intact', () => {
    expect(appCss).toContain('--editor-control-resting-opacity')
    expect(appCss).toContain('.editor-control')
    expect(appCss).toContain('.add-btn')
    expect(appCss).toContain('.remove-btn')
    expect(appCss).toContain('@media print')
    expect(appCss).toContain("[data-editor-only='true']")
  })

  it('keeps a canonical gap between section headings and their rules', () => {
    expect(resumeCss).toContain(
      'padding-bottom: calc(1px * var(--resume-layout-scale));'
    )
  })

  it('does not retain superseded shell generations', () => {
    const retiredSelectorPattern = /\.(?:landing-nav__brand|review-annotation-explorer__(?:detail|heading)|review-annotation-legend(?:__(?:item|items|label|swatch|marker(?:--(?:warning|info|strong))?))?|review-annotation__meta|review-annotations__list|review-category-detail__heading|review-category-grid|review-findings|review-list(?:--compact|__item|__meta)?|review-subsection-heading)(?![\w-])/
    const retiredSelectorExamples = [
      '.review-annotation-legend__marker--warning',
      '.review-annotation-legend__marker--info',
      '.review-annotation-legend__marker--strong',
    ]

    for (const selector of retiredSelectorExamples) {
      expect(selector).toMatch(retiredSelectorPattern)
    }

    expect(appCss).not.toContain('.workspace--with-review')
    expect(appCss).not.toContain('.resume-stage__chrome')
    expect(appCss).not.toContain('.app-header__status')
    expect(appCss).not.toContain('@media (max-width: 1220px)')
    expect(appCss).not.toMatch(
      /--(?:app-bg|app-bg-deep|danger|editor-stage-surface|focus|ink|line|shadow-page-premium|shadow-panel|shadow-stage|stage-surface|surface-subtle):/
    )
    expect(appCss).not.toMatch(retiredSelectorPattern)
  })

  it('stretches information-first Review sections across the expanded panel', () => {
    expect(appCss).toMatch(
      /\.review-report--information \.review-stage-panel\[data-review-stage\] \{[^}]*align-items: stretch;/
    )
  })

  it('presents Score and Feedback as a filled segmented button control', () => {
    expect(appCss).toMatch(
      /\.review-report--information \.review-stage-navigation \{[^}]*border: 1px solid var\(--border\);[^}]*background: var\(--surface-pressed\);/
    )
    expect(appCss).toMatch(
      /\.review-report--information \.review-stage-navigation > \*\[aria-pressed='true'\] \{[^}]*border-color: var\(--primary\);[^}]*background: var\(--surface-raised\);/
    )
    expect(appCss).not.toContain('box-shadow: inset 0 -2px 0 var(--primary);')
  })

  it('keeps the score-to-breakdown transition compact without enlarging the score', () => {
    expect(appCss).toMatch(
      /\.review-report--information \.review-overall \{[^}]*padding: 0 0 12px;/
    )
    expect(appCss).toMatch(
      /\.review-report--information \.review-category-section \{[^}]*padding: 16px 0 20px;/
    )
    expect(appCss).toMatch(
      /\.review-report--information \.review-overall__score \{[^}]*font-size: 30px;/
    )
  })

  it('lets the wide elastic Review grow with the page instead of clipping to the viewport', () => {
    expect(appCss).toMatch(
      /@media \(min-width: 1640px\) \{[\s\S]*?\.review-panel \{[^}]*max-height: none;/
    )
  })

  it('keeps the selected elastic workbench and Border Notch free of preview selectors', () => {
    expect(appCss).toMatch(
      /\.workspace\[data-review-open='true'\] \{[^}]*grid-template-columns: var\(--editor-shell-width\) minmax\(0, 1fr\);/
    )
    expect(appCss).toMatch(
      /\.workspace\[data-review-open='true'\] > \.fit-region \{[^}]*width: 24px;[^}]*height: 48px;/
    )
    expect(appCss).not.toContain('preview')
    expect(appCss).not.toContain('review-report--candidate')
  })

  it('uses True White in Light mode and Dark Surround in Dark mode', () => {
    expect(appCss).toMatch(
      /\.landing-hero \{[^}]*background: var\(--surface-raised\);[^}]*color: var\(--foreground\);/
    )
    expect(appCss).toMatch(
      /\.landing-hero::after \{[^}]*background: color-mix\(in srgb, var\(--surface-raised\) 76%, transparent\);/
    )
    expect(appCss).toMatch(
      /\.dark \.landing-hero \{[^}]*background: var\(--surface\);[^}]*color: var\(--foreground\);/
    )
    expect(appCss).toMatch(
      /\.dark \.landing-hero::after \{[^}]*background: color-mix\(in srgb, var\(--background\) 72%, transparent\);/
    )
    expect(appCss).not.toMatch(/\.landing-hero__media > img \{[^}]*sepia\(/)
  })

  it('keeps keyboard focus visible inside the clipped Border Notch and on review targets', () => {
    expect(appCss).toMatch(
      /\.workspace\[data-review-open='true'\] > \.fit-region:not\(:has\(\[aria-expanded='true'\]\)\)[\s\S]*?\[data-slot='collapsible-trigger'\]:focus-visible \{[^}]*outline: none;[^}]*box-shadow:[^}]*inset/
    )
    expect(appCss).toMatch(
      /\.review-annotation-marker:focus \{[^}]*outline:[^}]*var\(--paper-ink\);[^}]*outline-offset:/
    )
  })
})
