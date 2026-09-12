import type { Resume } from './types'

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
