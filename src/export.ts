import type { Resume } from './types'
import { validateResume } from './types'

const PAGE_WIDTH_IN = 8.5
const PAGE_HEIGHT_IN = 11

type PdfPageSlice = {
  sourceY: number
  sourceHeight: number
}

type PdfDocument = {
  addImage: (
    imageData: string,
    format: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => unknown
  addPage: (
    format?: string | number[],
    orientation?: 'p' | 'portrait' | 'l' | 'landscape'
  ) => unknown
  setFontSize?: (size: number) => unknown
  setTextColor?: (r: number, g: number, b: number) => unknown
  text?: (text: string | string[], x: number, y: number) => unknown
  output: (type: 'blob') => Blob
  save: (filename: string) => unknown
}

type CaptureRestoration = () => void
type PdfRenderOptions = {
  includeExtractableText?: boolean
}

export function getPdfPageSlices(
  canvasWidth: number,
  canvasHeight: number
): PdfPageSlice[] {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error('Canvas dimensions must be positive.')
  }

  const pageHeightPx = canvasWidth * (PAGE_HEIGHT_IN / PAGE_WIDTH_IN)
  const pageCount = Math.ceil(canvasHeight / pageHeightPx)

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const sourceY = pageIndex * pageHeightPx
    return {
      sourceY,
      sourceHeight: Math.min(pageHeightPx, canvasHeight - sourceY),
    }
  })
}

async function captureResumePage(pageElement: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default

  const prevOverflow = pageElement.style.overflow
  const restoreEditorControls = hideEditorControlsForCapture(pageElement)
  pageElement.style.overflow = 'hidden'

  try {
    return await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
  } finally {
    pageElement.style.overflow = prevOverflow
    restoreEditorControls()
  }
}

function hideEditorControlsForCapture(
  pageElement: HTMLElement
): CaptureRestoration {
  const editorControls = Array.from(
    pageElement.querySelectorAll<HTMLElement>(
      '.add-btn, .remove-btn, [data-editor-only="true"]'
    )
  )
  const previousVisibility = editorControls.map(control => ({
    control,
    visibility: control.style.visibility,
  }))

  editorControls.forEach(control => {
    control.style.visibility = 'hidden'
  })

  return () => {
    previousVisibility.forEach(({ control, visibility }) => {
      control.style.visibility = visibility
    })
  }
}

async function renderResumePageToPDF(
  pageElement: HTMLElement,
  options: PdfRenderOptions = {}
): Promise<PdfDocument> {
  const { jsPDF } = await import('jspdf')
  const canvas = await captureResumePage(pageElement)

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  })

  const slices = getPdfPageSlices(canvas.width, canvas.height)
  slices.forEach((slice, index) => {
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = slice.sourceHeight

    const context = pageCanvas.getContext('2d')
    if (!context) {
      throw new Error('Could not prepare PDF page canvas.')
    }

    context.drawImage(
      canvas,
      0,
      slice.sourceY,
      canvas.width,
      slice.sourceHeight,
      0,
      0,
      canvas.width,
      slice.sourceHeight
    )

    if (index > 0) {
      pdf.addPage('letter', 'portrait')
    }

    const renderedHeightIn = PAGE_WIDTH_IN * (slice.sourceHeight / canvas.width)
    pdf.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      PAGE_WIDTH_IN,
      renderedHeightIn
    )
  })

  if (options.includeExtractableText) {
    addExtractableTextAppendix(pdf, pageElement)
  }

  return pdf
}

/**
 * Captures the ResumePage DOM element and returns a PDF Blob without starting a
 * browser download. The rendered canvas is sliced into Letter-height pages using
 * the same path as the download exporter.
 */
export async function renderResumePageToPDFBlob(
  pageElement: HTMLElement,
  options: PdfRenderOptions = {}
): Promise<Blob> {
  const pdf = await renderResumePageToPDF(pageElement, options)
  return pdf.output('blob')
}

/**
 * Captures the ResumePage DOM element as a canvas and saves it as a PDF.
 * The resize engine fits the page within the configured height limit. If that
 * height spans multiple Letter pages, the captured canvas is sliced into one
 * PDF page per Letter-height segment instead of being squeezed onto one page.
 */
export async function exportPDF(pageElement: HTMLElement): Promise<void> {
  const pdf = await renderResumePageToPDF(pageElement)
  pdf.save('resume.pdf')
}

function addExtractableTextAppendix(
  pdf: PdfDocument,
  pageElement: HTMLElement
): void {
  if (!pdf.text || !pdf.setFontSize || !pdf.setTextColor) {
    return
  }

  const text = extractResumeText(pageElement)
  if (!text) {
    return
  }

  pdf.addPage('letter', 'portrait')
  pdf.setFontSize(8)
  pdf.setTextColor(255, 255, 255)

  const lines = wrapText(text, 110)
  const marginLeft = 0.35
  const marginTop = 0.45
  const lineHeight = 0.12
  const maxLinesPerPage = Math.floor((PAGE_HEIGHT_IN - marginTop * 2) / lineHeight)

  lines.forEach((line, index) => {
    if (index > 0 && index % maxLinesPerPage === 0) {
      pdf.addPage('letter', 'portrait')
      pdf.setFontSize?.(8)
      pdf.setTextColor?.(255, 255, 255)
    }

    const pageLineIndex = index % maxLinesPerPage
    pdf.text?.(line, marginLeft, marginTop + pageLineIndex * lineHeight)
  })
}

function extractResumeText(pageElement: HTMLElement): string {
  const selectors = [
    '.resume-name',
    '.resume-contact-item',
    '.resume-section-title',
    '.entry-title',
    '.entry-date',
    '.entry-subtitle',
    '.entry-location',
    '.bullet-item',
  ]

  return selectors
    .flatMap(selector =>
      Array.from(pageElement.querySelectorAll<HTMLElement>(selector))
    )
    .map(element => visibleTextWithoutEditorControls(element))
    .filter(Boolean)
    .join('\n')
}

function visibleTextWithoutEditorControls(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement
  clone
    .querySelectorAll('.add-btn, .remove-btn, [data-editor-only="true"]')
    .forEach(control => control.remove())

  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function wrapText(text: string, maxLineLength: number): string[] {
  return text.split('\n').flatMap(line => {
    const words = line.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let currentLine = ''

    words.forEach(word => {
      const nextLine = currentLine ? `${currentLine} ${word}` : word
      if (nextLine.length > maxLineLength && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = nextLine
      }
    })

    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  })
}

/**
 * Serializes the resume to JSON and triggers a browser file download.
 */
export function exportJSON(resume: Resume): void {
  const json = JSON.stringify(resume, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resume.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke to avoid racing the download on Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Reads a .json file, parses it, and validates it as a Resume.
 * Rejects with a human-readable error message if the file is invalid.
 */
export function importJSON(file: File): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      let data: unknown
      try {
        data = JSON.parse(e.target?.result as string)
      } catch {
        reject(new Error('Could not parse the file as JSON.'))
        return
      }
      // validateResume is outside the JSON.parse try/catch so any future
      // errors from validation are not mis-reported as "invalid JSON".
      const resume = validateResume(data)
      if (!resume) {
        reject(new Error('File does not match the expected resume format.'))
        return
      }
      resolve(resume)
    }
    reader.onerror = () => reject(new Error('Failed to read the file.'))
    reader.readAsText(file)
  })
}
