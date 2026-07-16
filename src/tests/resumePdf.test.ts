import { Font } from '@react-pdf/renderer'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_RESUME } from '../defaultResume'
import { ResumePdfDocument } from '../pdf/ResumePdfDocument'
import { renderResumePdf } from '../pdf/renderResumePdf'
import { pxToPt } from '../resumeDocumentTokens'

function findElement(
  node: ReactNode,
  predicate: (element: ReactElement) => boolean
): ReactElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate)
      if (match) return match
    }
    return undefined
  }

  if (!isValidElement(node)) return undefined
  if (predicate(node)) return node

  return findElement(
    (node.props as { children?: ReactNode }).children,
    predicate
  )
}

function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.readAsArrayBuffer(blob)
  })
}

async function extractPdfPages(blob: Blob): Promise<string[]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const loadingTask = getDocument({
    data: await readBlobBytes(blob),
    verbosity: 0,
  })
  const document = await loadingTask.promise

  try {
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(
        content.items
          .map(item => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' ')
      )
    }
    return pages
  } finally {
    await document.destroy()
  }
}

async function renderPdfPages(resume: typeof DEFAULT_RESUME): Promise<string[]> {
  const blob = await renderResumePdf(resume, 1.0583984375)
  return extractPdfPages(blob)
}

describe('canonical resume PDF renderer', () => {
  it('produces a non-empty PDF blob from resume data', async () => {
    const blob = await renderResumePdf(DEFAULT_RESUME, 1.0584)

    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(1_000)
  })

  it('resolves bold text to distinct font data for both upright and italic text', () => {
    const regular = Font.getFont({
      fontFamily: 'Presume EB Garamond',
      fontStyle: 'normal',
      fontWeight: 400,
    })
    const bold = Font.getFont({
      fontFamily: 'Presume EB Garamond',
      fontStyle: 'normal',
      fontWeight: 700,
    })
    const italic = Font.getFont({
      fontFamily: 'Presume EB Garamond',
      fontStyle: 'italic',
      fontWeight: 400,
    })
    const boldItalic = Font.getFont({
      fontFamily: 'Presume EB Garamond',
      fontStyle: 'italic',
      fontWeight: 700,
    })

    expect(bold.src).not.toBe(regular.src)
    expect(boldItalic.src).not.toBe(italic.src)
  })

  it('positions bullet markers without consuming the live editor text width', () => {
    const document = ResumePdfDocument({
      resume: DEFAULT_RESUME,
      globalScale: 1.0584,
    })
    const marker = findElement(
      document,
      element => (element.props as { children?: ReactNode }).children === '•'
    )

    expect(marker).toBeDefined()
    expect((marker!.props as { style: Record<string, unknown> }).style).toMatchObject({
      position: 'absolute',
      left: pxToPt(-8),
      width: pxToPt(8),
    })
  })

  it('keeps an entry heading, subtitle, and first bullet together at a page boundary', async () => {
    const sections = Array.from({ length: 4 }, (_, copyIndex) =>
      DEFAULT_RESUME.sections.map(section => ({
        ...section,
        title: `${section.title} ${copyIndex + 1}`,
        entries: section.entries.map(entry => ({
          ...entry,
          title:
            copyIndex === 3 && entry.title === 'SmartBudget'
              ? 'SmartBudget Boundary'
              : entry.title,
          bullets:
            copyIndex === 3 && entry.title === 'SmartBudget'
              ? [
                  'Boundary first bullet that must stay with its entry heading.',
                  ...entry.bullets.slice(1),
                ]
              : entry.bullets,
        })),
      }))
    ).flat()
    const pages = await renderPdfPages({ ...DEFAULT_RESUME, sections })

    expect(pages).toHaveLength(3)
    expect(pages[1]).not.toContain('SmartBudget Boundary')
    expect(pages[2]).toContain('SmartBudget Boundary')
    expect(pages[2]).toContain('Python, FastAPI, React, PostgreSQL, Plaid API')
    expect(pages[2]).toContain(
      'Boundary first bullet that must stay with its entry heading.'
    )
  })

  it('preserves an oversized first bullet while allowing later bullets to paginate', async () => {
    const terminalSentinel = 'OVERSIZED-FIRST-BULLET-END'
    const oversizedFirstBullet = `${Array.from(
      { length: 1_400 },
      (_, index) => `LONGFIRST${String(index + 1).padStart(4, '0')}`
    ).join(' ')} ${terminalSentinel}`
    const resume = {
      ...DEFAULT_RESUME,
      sections: [
        {
          title: 'Experience',
          entries: [
            {
              ...DEFAULT_RESUME.sections[1].entries[0],
              title: 'Oversized First Bullet',
              bullets: [
                oversizedFirstBullet,
                'Later bullet after oversized first bullet.',
              ],
            },
          ],
        },
      ],
    }
    const warnings: string[] = []
    const warningSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation((...args: unknown[]) => {
        warnings.push(args.map(String).join(' '))
      })

    let pages: string[]
    try {
      pages = await renderPdfPages(resume)
    } finally {
      warningSpy.mockRestore()
    }

    const outputText = pages.join('\n')
    expect(pages.length).toBeGreaterThan(1)
    expect(outputText).toContain('LONGFIRST1400')
    expect(outputText).toContain(terminalSentinel)
    expect(outputText).toContain('Later bullet after oversized first bullet.')
    expect(warnings.join('\n')).not.toContain("can't wrap between pages")
  })
})
