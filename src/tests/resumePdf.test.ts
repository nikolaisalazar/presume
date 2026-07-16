import { describe, expect, it } from 'vitest'
import { DEFAULT_RESUME } from '../defaultResume'
import { renderResumePdf } from '../pdf/renderResumePdf'

describe('canonical resume PDF renderer', () => {
  it('produces a non-empty PDF blob from resume data', async () => {
    const blob = await renderResumePdf(DEFAULT_RESUME, 1.0584)

    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(1_000)
  })
})
