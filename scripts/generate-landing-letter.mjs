import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const root = process.cwd()
const outputs = [
  { width: 695, file: 'resume-letter.png' },
  { width: 1390, file: 'resume-letter@2x.png' },
]
const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'presume-letter-'))
const pdfPath = path.join(temporaryDirectory, 'resume.pdf')
const server = await createServer({
  logLevel: 'error',
  server: { host: '127.0.0.1', port: 0 },
})

await server.listen()
const address = server.httpServer?.address()
if (!address || typeof address === 'string') throw new Error('Unable to resolve the Vite server port.')
const origin = `http://127.0.0.1:${address.port}`
const base = server.config.base
const viteFileUrl = file => `${origin}${base}@fs/${pathToFileURL(file).pathname}`
const pdfModule = viteFileUrl(path.join(root, 'node_modules/pdfjs-dist/build/pdf.mjs'))
const pdfWorker = viteFileUrl(path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.mjs'))
const browser = await chromium.launch()

try {
  const editor = await browser.newPage()
  await editor.addInitScript(() => localStorage.clear())
  await editor.goto(`${origin}${base}editor/`, { waitUntil: 'networkidle' })
  await editor.evaluate(() => document.fonts.ready)
  const exportButton = editor.getByRole('button', { name: 'Export PDF' })
  await exportButton.waitFor({ state: 'visible' })
  if (await exportButton.isDisabled()) throw new Error('The canonical PDF renderer did not become ready.')

  const downloadPromise = editor.waitForEvent('download')
  await exportButton.click()
  const download = await downloadPromise
  if (download.suggestedFilename() !== 'resume.pdf') {
    throw new Error(`Unexpected export filename: ${download.suggestedFilename()}`)
  }
  await download.saveAs(pdfPath)
  await editor.close()

  const pdf = await fs.readFile(pdfPath)
  if (!pdf.subarray(0, 4).equals(Buffer.from('%PDF'))) throw new Error('Export did not produce a PDF.')
  const encodedPdf = pdf.toString('base64')

  for (const output of outputs) {
    const renderer = await browser.newPage({
      viewport: { width: output.width, height: Math.ceil(output.width * 11 / 8.5) },
      deviceScaleFactor: 1,
    })
    await renderer.goto(`${origin}${base}`)
    const rendered = await renderer.evaluate(async ({ encodedPdf, pdfModule, pdfWorker, targetWidth }) => {
      const pdfjs = await import(pdfModule)
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
      const bytes = Uint8Array.from(atob(encodedPdf), character => character.charCodeAt(0))
      const document = await pdfjs.getDocument({ data: bytes }).promise
      if (document.numPages !== 1) throw new Error(`Expected one PDF page, received ${document.numPages}.`)
      const page = await document.getPage(1)
      const baseViewport = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: targetWidth / baseViewport.width })
      const canvas = window.document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = Math.round(viewport.height)
      const context = canvas.getContext('2d', { alpha: false })
      if (!context) throw new Error('Unable to create the PDF raster canvas.')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      window.document.body.replaceChildren(canvas)
      await page.render({ canvasContext: context, viewport }).promise
      return {
        data: canvas.toDataURL('image/png').split(',')[1],
        width: canvas.width,
        height: canvas.height,
      }
    }, { encodedPdf, pdfModule, pdfWorker, targetWidth: output.width })

    const expectedHeight = Math.round(output.width * 11 / 8.5)
    if (rendered.width !== output.width || rendered.height !== expectedHeight) {
      throw new Error(`Unexpected ${output.file} geometry: ${rendered.width}x${rendered.height}`)
    }
    const outputPath = path.join(root, 'public/landing', output.file)
    await fs.writeFile(outputPath, Buffer.from(rendered.data, 'base64'))
    console.log(`Wrote ${path.relative(root, outputPath)} (${rendered.width}x${rendered.height})`)
    await renderer.close()
  }

  console.log(`Chromium ${browser.version()}`)
} finally {
  await browser.close()
  await server.close()
  await fs.rm(temporaryDirectory, { recursive: true, force: true })
}
