import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_RESUME } from '../defaultResume'
import { exportPDF, renderResumeToPDFBlob } from '../export'
import { renderResumePdf } from '../pdf/renderResumePdf'

vi.mock('../pdf/renderResumePdf', () => ({
  renderResumePdf: vi.fn(),
}))

const renderResumePdfMock = vi.mocked(renderResumePdf)

describe('canonical PDF export', () => {
  const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
  const click = vi.fn()

  beforeEach(() => {
    renderResumePdfMock.mockResolvedValue(pdf)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:resume'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('renders resume data at the selected scale without reading DOM geometry', async () => {
    await expect(renderResumeToPDFBlob(DEFAULT_RESUME, 1.0584)).resolves.toBe(pdf)

    expect(renderResumePdfMock).toHaveBeenCalledWith(DEFAULT_RESUME, 1.0584)
  })

  it('downloads the canonical blob and schedules its object URL for release', async () => {
    vi.useFakeTimers()

    await exportPDF(DEFAULT_RESUME, 1.0584)

    expect(renderResumePdfMock).toHaveBeenCalledWith(DEFAULT_RESUME, 1.0584)
    expect(URL.createObjectURL).toHaveBeenCalledWith(pdf)
    expect(click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:resume')
    vi.useRealTimers()
  })
})
