import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(
  `${process.cwd()}/src/styles/app.css`,
  'utf8'
)

describe('responsive review layout CSS', () => {
  it('lets the fixed resume overflow without sizing the narrow review panel', () => {
    expect(appCss).toContain('grid-template-columns: minmax(0, 1fr);')
    expect(appCss).toContain('max-width: min(816px, calc(100vw - 32px));')
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

  it('hides editor-only controls in print styles', () => {
    expect(appCss).toContain('@media print')
    expect(appCss).toContain('[data-editor-only=\'true\']')
    expect(appCss).toContain('display: none !important;')
  })
})
