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
})
