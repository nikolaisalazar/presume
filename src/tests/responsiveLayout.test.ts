import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(
  `${process.cwd()}/src/styles/app.css`,
  'utf8'
)

describe('responsive review layout CSS', () => {
  it('defines a premium document workbench visual system', () => {
    expect(appCss).toContain('--app-bg-deep')
    expect(appCss).toContain('--command-surface')
    expect(appCss).toContain('--shadow-page-premium')
    expect(appCss).toContain('radial-gradient')
    expect(appCss).toContain('.app-header__brand-mark')
  })

  it('stages the resume canvas as the strongest physical surface', () => {
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('background: var(--stage-surface)')
    expect(appCss).toContain('box-shadow: var(--shadow-stage)')
    expect(appCss).toContain('padding: 24px')
  })

  it('composes constraints and toolbar as a command deck', () => {
    expect(appCss).toContain('.editor-panel::before')
    expect(appCss).toContain('Command deck')
    expect(appCss).toContain('.settings-panel + .toolbar')
  })

  it('uses one desktop column by default and adds a review column only with an active panel', () => {
    expect(appCss).toContain('.workspace {')
    expect(appCss).toContain('grid-template-columns: minmax(0, var(--page-width));')
    expect(appCss).toContain('.workspace--with-review')
    expect(appCss).toContain('grid-template-columns: minmax(0, var(--page-width)) minmax(320px, 360px);')
  })

  it('lets the fixed resume overflow without sizing the narrow review panel', () => {
    expect(appCss).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(appCss).toContain('max-width: min(816px, calc(100vw - 40px));')
  })

  it('keeps editor controls within the viewport while the fixed canvas scrolls intentionally', () => {
    expect(appCss).toContain('.editor-panel')
    expect(appCss).toContain('overflow-x: auto;')
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('width: max-content;')
    expect(appCss).toContain('max-width: var(--page-width);')
  })

  it('keeps in-document edit controls discoverable without dominating the printable resume', () => {
    expect(appCss).toContain('--editor-control-resting-opacity')
    expect(appCss).toContain('opacity: var(--editor-control-resting-opacity);')
    expect(appCss).toContain(':focus-visible')
  })

  it('uses one contextual editor-control language with touch-safe fallbacks', () => {
    expect(appCss).toContain('.editor-control')
    expect(appCss).toContain('.editor-rail')
    expect(appCss).toContain('focus-within')
    expect(appCss).toContain('min-height: 44px')
    expect(appCss).toContain('@media (hover: none)')
  })

  it('defines semantic colors for warning danger review and focus states', () => {
    expect(appCss).toContain('--warning-bg')
    expect(appCss).toContain('--warning-border')
    expect(appCss).toContain('--danger')
    expect(appCss).toContain('--review')
    expect(appCss).toContain('--focus')
  })

  it('keeps bullet editor controls out of the inline bullet text flow', () => {
    expect(appCss).toContain('.bullet-item > .remove-btn')
    expect(appCss).toContain('position: absolute;')
    expect(appCss).toContain('data-editor-only')
  })

  it('hides editor-only controls in print styles', () => {
    expect(appCss).toContain('@media print')
    expect(appCss).toContain('[data-editor-only=\'true\']')
    expect(appCss).toContain('display: none !important;')
  })
})
