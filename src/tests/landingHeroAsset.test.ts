import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const publicAsset = (name: string) => `${process.cwd()}/public/landing/${name}`
const approvedCompositionHashes = {
  'document-horizon-1120.webp':
    'ccce41026d7eae284b392a4fc66be3683ca225d168e4ee56282dc4877f7eb843',
  'document-horizon-2200.webp':
    '245f1d7bb59330ae6a02e7d5e5411eb18aeac5946da41ca50c7cda7bc85f4b15',
} as const

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

  it('preserves the user-approved Working Stack with a clear resume imprint', () => {
    for (const [name, approvedHash] of Object.entries(
      approvedCompositionHashes
    )) {
      const actualHash = createHash('sha256')
        .update(readFileSync(publicAsset(name), 'latin1'), 'latin1')
        .digest('hex')

      expect(actualHash, `${name} matches the approved composition`).toBe(
        approvedHash
      )
    }
  })
})
