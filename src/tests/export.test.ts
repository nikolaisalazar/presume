import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportPDF, getPdfPageSlices, renderResumePageToPDFBlob } from '../export'

const pdfMock = vi.hoisted(() => ({
  addImage: vi.fn(),
  addPage: vi.fn(),
  output: vi.fn(),
  save: vi.fn(),
  constructor: vi.fn(),
}))

const html2canvasMock = vi.hoisted(() => vi.fn())

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}))

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(options => {
    pdfMock.constructor(options)
    return {
      addImage: pdfMock.addImage,
      addPage: pdfMock.addPage,
      output: pdfMock.output,
      save: pdfMock.save,
    }
  }),
}))

describe('getPdfPageSlices', () => {
  it('returns one slice for one Letter-height canvas', () => {
    expect(getPdfPageSlices(850, 1100)).toEqual([
      { sourceY: 0, sourceHeight: 1100 },
    ])
  })

  it('returns multiple slices for a multi-page canvas', () => {
    expect(getPdfPageSlices(850, 2420)).toEqual([
      { sourceY: 0, sourceHeight: 1100 },
      { sourceY: 1100, sourceHeight: 1100 },
      { sourceY: 2200, sourceHeight: 220 },
    ])
  })

  it('rejects invalid dimensions', () => {
    expect(() => getPdfPageSlices(0, 1100)).toThrow(
      'Canvas dimensions must be positive.'
    )
    expect(() => getPdfPageSlices(850, 0)).toThrow(
      'Canvas dimensions must be positive.'
    )
  })
})

describe('exportPDF', () => {
  const originalCreateElement = document.createElement.bind(document)
  const createdCanvases: Array<{
    canvas: HTMLCanvasElement
    drawImage: ReturnType<typeof vi.fn>
  }> = []

  beforeEach(() => {
    pdfMock.addImage.mockClear()
    pdfMock.addPage.mockClear()
    pdfMock.output.mockClear()
    pdfMock.save.mockClear()
    pdfMock.constructor.mockClear()
    html2canvasMock.mockReset()
    createdCanvases.length = 0

    vi.spyOn(document, 'createElement').mockImplementation(tagName => {
      if (tagName.toLowerCase() !== 'canvas') {
        return originalCreateElement(tagName)
      }

      const drawImage = vi.fn()
      const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage })),
        toDataURL: vi.fn(() => `data:image/png;base64,page-${createdCanvases.length}`),
      } as unknown as HTMLCanvasElement

      createdCanvases.push({ canvas, drawImage })
      return canvas
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes each Letter-height canvas slice to a separate PDF page', async () => {
    const sourceCanvas = {
      width: 850,
      height: 2420,
    } as HTMLCanvasElement
    const pageElement = document.createElement('div')
    pageElement.style.overflow = 'visible'
    html2canvasMock.mockResolvedValue(sourceCanvas)

    await exportPDF(pageElement)

    expect(html2canvasMock).toHaveBeenCalledWith(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
    expect(pdfMock.constructor).toHaveBeenCalledWith({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter',
    })
    expect(pdfMock.addPage).toHaveBeenCalledTimes(2)
    expect(pdfMock.addPage).toHaveBeenNthCalledWith(1, 'letter', 'portrait')
    expect(pdfMock.addPage).toHaveBeenNthCalledWith(2, 'letter', 'portrait')
    expect(pdfMock.addImage).toHaveBeenCalledTimes(3)
    expect(pdfMock.addImage).toHaveBeenNthCalledWith(
      1,
      'data:image/png;base64,page-1',
      'PNG',
      0,
      0,
      8.5,
      11
    )
    expect(pdfMock.addImage).toHaveBeenNthCalledWith(
      2,
      'data:image/png;base64,page-2',
      'PNG',
      0,
      0,
      8.5,
      11
    )
    expect(pdfMock.addImage).toHaveBeenNthCalledWith(
      3,
      'data:image/png;base64,page-3',
      'PNG',
      0,
      0,
      8.5,
      2.2
    )
    expect(createdCanvases.map(({ canvas }) => canvas.height)).toEqual([
      1100,
      1100,
      220,
    ])
    expect(createdCanvases[0].drawImage).toHaveBeenCalledWith(
      sourceCanvas,
      0,
      0,
      850,
      1100,
      0,
      0,
      850,
      1100
    )
    expect(createdCanvases[1].drawImage).toHaveBeenCalledWith(
      sourceCanvas,
      0,
      1100,
      850,
      1100,
      0,
      0,
      850,
      1100
    )
    expect(createdCanvases[2].drawImage).toHaveBeenCalledWith(
      sourceCanvas,
      0,
      2200,
      850,
      220,
      0,
      0,
      850,
      220
    )
    expect(pdfMock.save).toHaveBeenCalledWith('resume.pdf')
    expect(pageElement.style.overflow).toBe('visible')
  })

  it('does not add extra PDF pages for a one-page canvas', async () => {
    const sourceCanvas = {
      width: 850,
      height: 1100,
    } as HTMLCanvasElement
    html2canvasMock.mockResolvedValue(sourceCanvas)

    await exportPDF(document.createElement('div'))

    expect(pdfMock.addPage).not.toHaveBeenCalled()
    expect(pdfMock.addImage).toHaveBeenCalledTimes(1)
    expect(pdfMock.addImage).toHaveBeenCalledWith(
      'data:image/png;base64,page-1',
      'PNG',
      0,
      0,
      8.5,
      11
    )
    expect(pdfMock.save).toHaveBeenCalledWith('resume.pdf')
  })

  it('renders each Letter-height canvas slice to a PDF blob without downloading', async () => {
    const sourceCanvas = {
      width: 850,
      height: 2420,
    } as HTMLCanvasElement
    const pageElement = document.createElement('div')
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    html2canvasMock.mockResolvedValue(sourceCanvas)
    pdfMock.output.mockReturnValue(blob)

    await expect(renderResumePageToPDFBlob(pageElement)).resolves.toBe(blob)

    expect(pdfMock.addPage).toHaveBeenCalledTimes(2)
    expect(pdfMock.addImage).toHaveBeenCalledTimes(3)
    expect(pdfMock.output).toHaveBeenCalledWith('blob')
    expect(pdfMock.save).not.toHaveBeenCalled()
  })

  it('surfaces PDF blob generation errors to callers', async () => {
    const pageElement = document.createElement('div')
    pageElement.style.overflow = 'visible'
    const error = new Error('canvas failed')
    html2canvasMock.mockRejectedValue(error)

    await expect(renderResumePageToPDFBlob(pageElement)).rejects.toThrow(
      'canvas failed'
    )
    expect(pageElement.style.overflow).toBe('visible')
    expect(pdfMock.save).not.toHaveBeenCalled()
  })
})
