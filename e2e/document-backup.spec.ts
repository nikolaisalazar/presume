import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { DEFAULT_RESUME } from '../src/defaultResume'
import { DEFAULT_CONSTRAINTS } from '../src/constraints'

const sourceData = {
  resume: {
    name: 'Zoë 李 👩🏽‍💻',
    contact: ['first\r\nsecond\r', 'e\u0301@example.test', ''],
    sections: [{
      title: '\nExperience\n',
      entries: [{
        title: 'Engineer\nLead', subtitle: '日本語', location: ' NY\t',
        dateRange: '2020–2026', bullets: ['\nFirst\n\nLast\n', ''],
      }],
    }],
  },
  constraints: { maxPages: 1, maxLinesPerBullet: 3, minFontSize: 12 },
}

const snapshot = (page: Page) => page.evaluate(() => ({
  resume: JSON.parse(localStorage.getItem('presume:resume')!),
  constraints: JSON.parse(localStorage.getItem('presume:constraints')!),
}))

const upload = (page: Page, value: unknown) => page.locator('input[type=file]').setInputFiles({
  name: 'resume.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)),
})

test('F09: actual download restores all text and non-default settings in a fresh browser context', async ({ page, browser }, testInfo) => {
  await page.goto('./editor/')
  await page.evaluate(data => {
    localStorage.setItem('presume:resume', JSON.stringify(data.resume))
    localStorage.setItem('presume:constraints', JSON.stringify(data.constraints))
  }, sourceData)
  await page.reload()

  // An ordinary edit stays focused right up to the download action.
  const name = page.locator('.resume-name')
  await name.fill('Latest focused edit — Zoë 李 👩🏽‍💻')
  await expect(name).toBeFocused()
  const expected = { ...sourceData, resume: { ...sourceData.resume, name: await name.textContent() } }
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup', exact: true }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('presume-backup.json')
  const path = testInfo.outputPath('presume-backup.json')
  await download.saveAs(path)
  const backup = JSON.parse(await readFile(path, 'utf8'))
  expect(backup).toEqual({ format: 'presume-backup', version: 1, exportedAt: expect.any(String), data: expected })
  await testInfo.attach('downloaded-backup', { path, contentType: 'application/json' })

  const fresh = await browser.newContext()
  try {
    const restored = await fresh.newPage()
    await restored.goto(page.url())
    await expect(restored.locator('.resume-name')).toHaveText(DEFAULT_RESUME.name)
    expect(await snapshot(restored)).toEqual({ resume: null, constraints: null })
    const dialogPromise = restored.waitForEvent('dialog')
    const restoring = restored.locator('input[type=file]').setInputFiles(path)
    const dialog = await dialogPromise
    expect(dialog.message()).toContain('resume text and formatting settings')
    await dialog.accept()
    await restoring
    await expect.poll(() => snapshot(restored)).toEqual(expected)
    await expect(restored.locator('.resume-name')).toHaveText(expected.resume.name!)
    await expect(restored.getByRole('button', { name: /Fit constraints/ })).toContainText('1 page · 3 line/bullet · 12px min')
    await restored.reload()
    await expect.poll(() => snapshot(restored)).toEqual(expected)
    const nextDownload = restored.waitForEvent('download')
    await restored.getByRole('button', { name: 'Download backup', exact: true }).click()
    const restoredPath = testInfo.outputPath('restored-backup.json')
    await (await nextDownload).saveAs(restoredPath)
    expect(JSON.parse(await readFile(restoredPath, 'utf8')).data).toEqual(expected)
  } finally {
    await fresh.close()
  }
})

test('legacy restore discloses text-only replacement and retains current settings, including defaults', async ({ page }) => {
  await page.goto('./editor/')
  const messages: string[] = []
  page.on('dialog', async dialog => {
    messages.push(dialog.message())
    await dialog.accept()
  })
  await upload(page, sourceData.resume)
  await expect.poll(() => snapshot(page)).toEqual({ resume: sourceData.resume, constraints: DEFAULT_CONSTRAINTS })
  await page.getByRole('button', { name: /Fit constraints/ }).click()
  await page.getByRole('button', { name: 'Increase max pages', exact: true }).click()
  await page.locator('.resume-name').fill('Current draft')
  await upload(page, sourceData.resume)
  await expect.poll(() => snapshot(page)).toEqual({
    resume: sourceData.resume, constraints: { ...DEFAULT_CONSTRAINTS, maxPages: 2 },
  })
  expect(messages).toHaveLength(2)
  for (const message of messages) {
    expect(message).toContain('This file contains resume text only. Your current formatting settings will be kept.')
  }
})

test('invalid/future backups and cancellation preserve both halves; the same file can be retried', async ({ page }) => {
  await page.goto('./editor/')
  const original = await snapshot(page)
  const valid = { format: 'presume-backup', version: 1, exportedAt: '2026-09-12T12:00:00.000Z', data: sourceData }
  for (const invalid of [
    { ...valid, version: 2, ...sourceData.resume },
    { ...valid, data: { resume: sourceData.resume }, ...sourceData.resume },
    { ...valid, data: { ...sourceData, constraints: { ...sourceData.constraints, minFontSize: 17 } } },
    { ...valid, format: 'unknown', ...sourceData.resume },
  ]) {
    const waiting = page.waitForEvent('dialog')
    const reading = upload(page, invalid)
    const dialog = await waiting
    expect(dialog.type()).toBe('alert')
    expect(dialog.message()).toContain('Restore failed:')
    await dialog.dismiss()
    await reading
    expect(await snapshot(page)).toEqual(original)
    await expect(page.locator('input[type=file]')).toHaveValue('')
  }
  const file = { name: 'presume-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(valid)) }
  for (const accept of [false, true]) {
    const waiting = page.waitForEvent('dialog')
    const reading = page.locator('input[type=file]').setInputFiles(file)
    const dialog = await waiting
    expect(dialog.type()).toBe('confirm')
    if (accept) await dialog.accept()
    else await dialog.dismiss()
    await reading
    await expect.poll(() => snapshot(page)).toEqual(accept ? sourceData : original)
    await expect(page.locator('input[type=file]')).toHaveValue('')
  }
})
