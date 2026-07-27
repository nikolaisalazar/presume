import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicAsset = (name: string) => `${process.cwd()}/public/landing/${name}`

function expectWebp(name: string, maximumBytes: number) {
  const path = publicAsset(name)
  expect(existsSync(path), `${name} exists`).toBe(true)
  const bytes = readFileSync(path, 'latin1')
  expect(bytes.slice(0, 4)).toBe('RIFF')
  expect(bytes.slice(8, 12)).toBe('WEBP')
  expect(statSync(path).size).toBeLessThanOrEqual(maximumBytes)
}

describe('Document Horizon landing assets', () => {
  it('ships responsive WebP files and retires the envelope photographs', () => {
    expectWebp('document-horizon-1120.webp', 180_000)
    expectWebp('document-horizon-2200.webp', 600_000)
    expect(existsSync(publicAsset('handmade-paper-1120.webp'))).toBe(false)
    expect(existsSync(publicAsset('handmade-paper-2200.webp'))).toBe(false)
  })
})
