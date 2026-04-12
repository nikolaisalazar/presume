import type { Resume } from './types'
import { validateResume } from './types'

const PAGE_WIDTH_IN = 8.5
const PAGE_HEIGHT_IN = 11

/**
 * Captures the ResumePage DOM element as a canvas and saves it as a PDF.
 * The resize engine guarantees the page fits within the configured page limit,
 * so no clipping is needed — we capture the element as-is.
 */
export async function exportPDF(pageElement: HTMLElement): Promise<void> {
  // Dynamic imports to avoid bloating the initial bundle.
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const prevOverflow = pageElement.style.overflow
  pageElement.style.overflow = 'hidden'

  let canvas: HTMLCanvasElement
  try {
    canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
  } finally {
    pageElement.style.overflow = prevOverflow
  }

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  })

  pdf.addImage(imgData, 'PNG', 0, 0, PAGE_WIDTH_IN, PAGE_HEIGHT_IN)
  pdf.save('resume.pdf')
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
