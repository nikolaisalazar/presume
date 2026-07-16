import { pdf } from '@react-pdf/renderer'
import type { Resume } from '../types'
import { ResumePdfDocument } from './ResumePdfDocument'

export async function renderResumePdf(
  resume: Resume,
  globalScale: number
): Promise<Blob> {
  return pdf(
    <ResumePdfDocument resume={resume} globalScale={globalScale} />
  ).toBlob()
}
