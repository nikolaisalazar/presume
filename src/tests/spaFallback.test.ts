// @ts-nocheck
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createSpaFallback } from '../../scripts/create-spa-fallback.mjs'

let tempDir: string | null = null

describe('SPA fallback build artifact', () => {
  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
      tempDir = null
    }
  })

  it('copies index.html to 404.html for GitHub Pages route fallback', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'presume-spa-fallback-'))
    const indexHtml = '<!doctype html><title>Presume</title>'
    await writeFile(join(tempDir, 'index.html'), indexHtml)

    await createSpaFallback(tempDir)

    await expect(readFile(join(tempDir, '404.html'), 'utf8')).resolves.toBe(indexHtml)
  })
})
