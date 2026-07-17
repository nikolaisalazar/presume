import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const globalsCss = readFileSync(`${process.cwd()}/src/styles/globals.css`, 'utf8')
const appCss = readFileSync(`${process.cwd()}/src/styles/app.css`, 'utf8')
const accentTextSources = [
  'src/components/LandingPage.tsx',
  'src/components/ReviewPanel.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/button.tsx',
].map(path => readFileSync(`${process.cwd()}/${path}`, 'utf8'))

function themeBlock(selector: ':root' | '.dark'): string {
  const match = globalsCss.match(new RegExp(`\\${selector} \\{([\\s\\S]*?)\\n\\}`))
  expect(match, `${selector} theme block`).not.toBeNull()
  return match?.[1] ?? ''
}

function variable(block: string, name: string): string | undefined {
  return block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = hex.match(/[0-9a-fA-F]{2}/g)!.map(channel => {
      const value = Number.parseInt(channel, 16) / 255
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    })
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2])
  }
  const foregroundLuminance = luminance(foreground)
  const backgroundLuminance = luminance(background)
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('theme contrast contracts', () => {
  it('keeps semantic accent text and the focus companion accessible in both themes', () => {
    for (const selector of [':root', '.dark'] as const) {
      const block = themeBlock(selector)
      const accentForeground = variable(block, 'accent-foreground')
      const focusContrast = variable(block, 'focus-contrast')
      const background = variable(block, 'background')
      const surface = variable(block, 'surface')

      expect(accentForeground).toBeDefined()
      expect(focusContrast).toBeDefined()
      expect(background).toBeDefined()
      expect(surface).toBeDefined()
      if (!accentForeground || !focusContrast || !background || !surface) continue

      expect(contrastRatio(accentForeground, background)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(accentForeground, surface)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(focusContrast, background)).toBeGreaterThanOrEqual(3)
      expect(contrastRatio(focusContrast, surface)).toBeGreaterThanOrEqual(3)
    }

    for (const source of accentTextSources) {
      expect(source).not.toMatch(/\btext-primary(?=(?:\/\d+)?(?:\s|"|'))/)
    }
    expect(appCss).not.toContain('color: #4b5563;')
    expect(appCss).toContain('var(--focus-contrast)')
  })
})
