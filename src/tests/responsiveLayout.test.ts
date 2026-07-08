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

  it('sizes the command deck and its children to the staged resume width on desktop', () => {
    expect(appCss).toContain('--editor-shell-width: calc(var(--page-width) + (var(--stage-padding) * 2) + 32px);')
    expect(appCss).toContain('grid-template-columns: minmax(0, var(--editor-shell-width));')
    expect(appCss).toContain('max-width: var(--editor-shell-width);')
    expect(appCss).toContain('width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  padding: var(--stage-padding);')
    expect(appCss).toContain('.settings-panel,\n.toolbar,\n.formatting-warning-summary')
    expect(appCss).toContain('max-width: none;')
  })

  it('stages the resume canvas as the strongest physical surface without desktop horizontal scroll', () => {
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('background: var(--stage-surface)')
    expect(appCss).toContain('box-shadow: var(--shadow-stage)')
    expect(appCss).toContain('--stage-padding: 24px')
  })

  it('composes constraints toolbar and stage as a polished command deck', () => {
    expect(appCss).toContain('.editor-panel::before')
    expect(appCss).toContain('Command deck')
    expect(appCss).toContain('.settings-panel + .toolbar')
    expect(appCss).toContain('.settings-panel__body-inner')
    expect(appCss).toContain('.settings-control-row')
    expect(appCss).toContain('.settings-stepper')
    expect(appCss).toContain('.settings-stepper__value')
    expect(appCss).toContain('grid-template-columns: minmax(160px, 0.8fr) auto minmax(220px, 1fr);')
    expect(appCss).toContain('.resume-stage__chrome')
    expect(appCss).toContain('transition: grid-template-rows')
  })

  it('uses one editor-shell column by default and adds a review column only with an active panel', () => {
    expect(appCss).toContain('.workspace {')
    expect(appCss).toContain('grid-template-columns: minmax(0, var(--editor-shell-width));')
    expect(appCss).toContain('.workspace--with-review')
    expect(appCss).toContain('grid-template-columns: minmax(0, var(--editor-shell-width)) minmax(320px, 360px);')
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
    expect(appCss).toContain('max-width: 100%;')
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

  it('formats the landing workflow as a full-width horizontal process rail', () => {
    expect(appCss).toContain('.landing-workflow__intro')
    expect(appCss).toContain('.landing-workflow__steps')
    expect(appCss).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(appCss).toContain('.landing-workflow__steps li:not(:last-child)::after')
    expect(appCss).toContain('.landing-workflow__step-dot')
    expect(appCss).toContain('flex-direction: column;')
  })

  it('hides editor-only controls in print styles', () => {
    expect(appCss).toContain('@media print')
    expect(appCss).toContain('[data-editor-only=\'true\']')
    expect(appCss).toContain('display: none !important;')
  })
})
