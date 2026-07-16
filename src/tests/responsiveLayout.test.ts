import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(`${process.cwd()}/src/styles/app.css`, 'utf8')
const resumeCss = readFileSync(`${process.cwd()}/src/styles/resume.css`, 'utf8')

describe('custom editor CSS invariants', () => {
  it('keeps named fixed-canvas and derived wide-workspace geometry', () => {
    expect(appCss).toContain('--editor-shell-width: calc(var(--page-width) + (var(--stage-padding) * 2) + 32px);')
    expect(appCss).toContain('--wide-workspace-width: 1660px;')
    expect(appCss).toContain('@media (min-width: 1640px)')
    expect(appCss).toContain('grid-template-columns: minmax(320px, 1fr) var(--editor-shell-width) minmax(320px, 1fr);')
  })

  it('keeps fixed-canvas scrolling and the 3px review progress hook custom', () => {
    expect(appCss).toContain('.resume-canvas-scroll')
    expect(appCss).toContain('overflow-x: auto')
    expect(appCss).toContain('.review-rail__progress')
    expect(appCss).toContain('height: 3px')
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
    expect(appCss).not.toContain('.workspace--with-review')
    expect(appCss).not.toContain('.resume-stage__chrome')
    expect(appCss).not.toContain('.app-header__status')
    expect(appCss).not.toContain('@media (max-width: 1220px)')
  })
})
