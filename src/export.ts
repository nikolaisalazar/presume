import type { Resume } from './types'
import { validateResume } from './types'

export async function renderResumeToPDFBlob(
  resume: Resume,
  globalScale: number
): Promise<Blob> {
  const { renderResumePdf } = await import('./pdf/renderResumePdf')
  return renderResumePdf(resume, globalScale)
}

export async function exportPDF(
  resume: Resume,
  globalScale: number
): Promise<void> {
  const blob = await renderResumeToPDFBlob(resume, globalScale)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'resume.pdf'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function exportJSON(resume: Resume): void {
  const json = JSON.stringify(resume, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'resume.json'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function importJSON(file: File): Promise<Resume> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = event => {
      let data: unknown
      try {
        data = JSON.parse(event.target?.result as string)
      } catch {
        reject(new Error('Could not parse the file as JSON.'))
        return
      }

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
